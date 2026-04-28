import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceOrderDto, CreateOrcamentoDto, UpdateOrcamentoDto, UpdateStatusDto, AprovarOrcamentoDto, FinalizeOrderDto, CreateOrUpdateItemDto } from './dto/service-order.dto';
import { v4 as uuidv4 } from 'uuid';



@Injectable()
export class ServiceOrdersService {
  constructor(private prisma: PrismaService) {}

  private readonly STATUS_FLOW: Record<string, string[]> = {
    ABERTA: ['EM_DIAGNOSTICO', 'CANCELADO'],
    EM_DIAGNOSTICO: ['ORCAMENTO_PRONTO', 'CANCELADO'],
    ORCAMENTO_PRONTO: ['AGUARDANDO_APROVACAO', 'CANCELADO'],
    AGUARDANDO_APROVACAO: ['APROVADO', 'REPROVADO', 'CANCELADO'],
    APROVADO: ['AGUARDANDO_PECAS', 'EM_EXECUCAO', 'CANCELADO'],
    REPROVADO: ['FATURADO', 'CANCELADO'], // Fatura o diagnóstico se houver
    AGUARDANDO_PECAS: ['EM_EXECUCAO', 'CANCELADO'],
    EM_EXECUCAO: ['PRONTO_ENTREGA', 'CANCELADO'],
    PRONTO_ENTREGA: ['FATURADO', 'CANCELADO'],
    FATURADO: ['ENTREGUE'],
    ENTREGUE: [],
    CANCELADO: [],
    
    // Fallbacks for old statuses if they still exist
    ORCAMENTO: ['AGUARDANDO_APROVACAO'],
  };


  async findAll(tenantId: string, status?: string, orderType?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    if (orderType) where.orderType = orderType;

    return this.prisma.serviceOrder.findMany({
      where,
      include: {
        customer: true,
        vehicle: true,
        items: { include: { service: true, part: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const order = await this.prisma.serviceOrder.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        vehicle: true,
        items: { include: { service: true, part: true } },
        timeline: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) {
      throw new NotFoundException('Ordem não encontrada');
    }

    return order;
  }

  async createOrcamento(tenantId: string, dto: CreateOrcamentoDto, userId: string) {
    // Valida cliente e veículo
    const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, tenantId } });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const vehicle = await this.prisma.vehicle.findFirst({ where: { id: dto.vehicleId, tenantId } });
    if (!vehicle) throw new NotFoundException('Veículo não encontrado');

    const approvalToken = uuidv4();
    const approvalTokenExpires = new Date();
    approvalTokenExpires.setDate(approvalTokenExpires.getDate() + 7);

    // Processa itens
    let totalParts = 0, totalServices = 0, totalLabor = 0;
    const itemsData = dto.items?.map((item) => {
      const qty = item.quantity || 1;
      const unitPrice = item.unitPrice || 0;
      const discount = item.discount || 0;
      const total = (unitPrice * qty) - discount;

      if (item.type === 'part') totalParts += total;
      else if (item.type === 'service') totalServices += total;
      else totalLabor += total;

      return {
        serviceId: item.serviceId,
        partId: item.partId,
        description: item.description,
        quantity: qty,
        unitPrice,
        discount,
        totalPrice: total,
        type: item.type,
        applied: false,
      };
    }) || [];

    const order = await this.prisma.serviceOrder.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        vehicleId: dto.vehicleId,
        orderType: 'ORCAMENTO',
        status: 'ORCAMENTO',
        notes: dto.notes,
        complaint: dto.complaint,
        equipmentBrand: dto.equipmentBrand,
        equipmentModel: dto.equipmentModel,
        serialNumber: dto.serialNumber,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,

        totalParts,
        totalServices,
        totalLabor,
        totalCost: totalParts + totalServices + totalLabor,
        items: { create: itemsData },
      },
      include: {
        customer: true,
        vehicle: true,
        items: true,
      },
    });

    await this.createTimeline(order.id, 'ORCAMENTO', 'Orçamento criado', userId);

    return order;
  }

  async createServiceOrder(tenantId: string, dto: CreateServiceOrderDto, userId: string) {
    // Se vier com orderType ORDEM_SERVICO, cria diretamente como OS
    const baseOrder = await this.createOrcamento(tenantId, dto, userId);

    if (dto.orderType === 'ORDEM_SERVICO') {
      return this.prisma.serviceOrder.update({
        where: { id: baseOrder.id },
        data: {
          orderType: 'ORDEM_SERVICO',
          status: 'EM_EXECUCAO',
          startedAt: new Date(),
        },
        include: {
          customer: true,
          vehicle: true,
          items: true,
        },
      });
    }

    return baseOrder;
  }

  async updateOrcamento(tenantId: string, id: string, dto: UpdateOrcamentoDto, userId: string) {
    const order = await this.findById(tenantId, id);

    if (!['ORCAMENTO', 'AGUARDANDO_APROVACAO'].includes(order.status)) {
      throw new BadRequestException('Não é possível editar neste status');
    }

    return this.prisma.serviceOrder.update({
      where: { id },
      data: {
        complaint: dto.complaint,
        diagnosis: dto.diagnosis,
        technicalReport: dto.technicalReport,
        observations: dto.observations,
        equipmentBrand: dto.equipmentBrand,
        equipmentModel: dto.equipmentModel,
        serialNumber: dto.serialNumber,
        notes: dto.notes,
      },

      include: {
        customer: true,
        vehicle: true,
        items: true,
      },
    });
  }

  async requestApproval(tenantId: string, id: string) {
    const order = await this.findById(tenantId, id);

    if (!['ORCAMENTO', 'AGUARDANDO_APROVACAO'].includes(order.status)) {
      throw new BadRequestException('Não é possível solicitar aprovação neste status');
    }

    const newToken = uuidv4();
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    const updated = await this.prisma.serviceOrder.update({
      where: { id },
      data: {
        approvalToken: newToken,
        approvalTokenExpires: expires,
        status: 'AGUARDANDO_APROVACAO',
      },
    });

    await this.createTimeline(id, 'AGUARDANDO_APROVACAO', 'Aprovação solicitada', undefined);

    return {
      orderId: id,
      token: newToken,
      url: `/approval/${newToken}`,
    };
  }

  async approveOrcamento(approvalToken: string, dto: AprovarOrcamentoDto) {
    const order = await this.prisma.serviceOrder.findFirst({
      where: { approvalToken },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    if (order.approvalTokenExpires && new Date() > order.approvalTokenExpires) {
      throw new BadRequestException('Token expirado');
    }

    if (!dto.approved) {
      await this.prisma.serviceOrder.update({
        where: { id: order.id },
        data: { status: 'REPROVADO' },
      });

      // Se não autorizado, cobra custo de diagnóstico se existir
      if (order.diagnosticCost > 0) {
        await this.prisma.financialTransaction.create({
          data: {
            tenantId: order.tenantId,
            type: 'INCOME',
            amount: order.diagnosticCost,
            description: `Custo de Diagnóstico (Orçamento Reprovado) - OS ${order.id.slice(0, 8)}`,
            category: 'servicos',
            referenceId: order.id,
            referenceType: 'service_order',
          },
        });
      }

      await this.createTimeline(order.id, 'REPROVADO', dto.notes || 'Orçamento reprovado pelo cliente', undefined);
      return { success: false, message: 'Orçamento reprovado' };
    }

    // Aprova - transita para OS
    let totalDiscount = order.totalDiscount;
    
    // Se autorizado, o custo de diagnóstico entra como desconto
    if (order.diagnosticCost > 0) {
      totalDiscount += order.diagnosticCost;
    }

    const updated = await this.prisma.serviceOrder.update({
      where: { id: order.id },
      data: {
        orderType: 'ORDEM_SERVICO',
        status: 'APROVADO',
        approvedAt: new Date(),
        approvalStatus: 'APPROVED',
        totalDiscount,
        totalCost: (order.totalParts + order.totalServices + order.totalLabor) - totalDiscount,
      },
    });

    // Lança débito no financeiro (Receita pendente)
    await this.prisma.financialTransaction.create({
      data: {
        tenantId: order.tenantId,
        type: 'INCOME',
        amount: updated.totalCost,
        description: `Serviços/Peças - OS ${order.id.slice(0, 8)}`,
        category: 'servicos',
        referenceId: order.id,
        referenceType: 'service_order',
      },
    });

    // Se houver reserva de itens, debita estoque agora
    if (order.reserveStock) {
      const parts = order.items.filter((item: any) => item.type === 'part' && !item.applied);
      for (const item of parts) {
        if (item.partId) {
          await this.prisma.inventoryMovement.create({
            data: {
              tenantId: order.tenantId,
              partId: item.partId,
              type: 'EXIT',
              quantity: item.quantity,
              note: `Reserva OS ${order.id.slice(0, 8)} (Aprovada)`,
            },
          });
          await this.prisma.serviceOrderItem.update({
            where: { id: item.id },
            data: { applied: true },
          });
        }
      }
    }

    await this.createTimeline(order.id, 'APROVADO', 'Orçamento aprovado pelo cliente. Convertido em OS e gerado financeiro.', undefined);

    return { success: true, order: updated };
  }


  async updateStatus(tenantId: string, id: string, dto: UpdateStatusDto, userId: string) {
    const order = await this.findById(tenantId, id);
    const currentStatus = order.status;
    const newStatus = dto.status;

    // Valida transição
    const allowed = this.STATUS_FLOW[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Não é possível alterar de ${currentStatus} para ${newStatus}. Status permitidos: ${allowed.join(', ')}`
      );
    }

    const updateData: any = { status: newStatus };

    // Eventos de transição
    if (newStatus === 'EM_EXECUCAO' && !order.startedAt) {
      updateData.startedAt = new Date();
    }

    if (newStatus === 'PRONTO_ENTREGA') {
      updateData.completedAt = new Date();

      if (dto.kmSaida) {
        updateData.kmSaida = dto.kmSaida;
        if (dto.testeRodagem && order.kmEntrada) {
          updateData.testeRodagem = true;
          updateData.kmDiferenca = dto.kmSaida - order.kmEntrada;
        } else {
          updateData.testeRodagem = false;
          updateData.kmDiferenca = 0;
        }
      }
    }

    if (newStatus === 'FATURADO') {
      updateData.paidAt = new Date();
    }

    if (newStatus === 'ENTREGUE') {
      updateData.deliveredAt = new Date();
    }

    const updated = await this.prisma.serviceOrder.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        vehicle: true,
        items: true,
      },
    });

    await this.createTimeline(id, newStatus, dto.notes || `Status alterado para ${newStatus}`, userId);

    return updated;
  }

  async applyStockAndFinancial(tenantId: string, id: string, userId: string) {
    const order = await this.findById(tenantId, id);

    if (!['APROVADO', 'EM_EXECUCAO', 'PRONTO_ENTREGA', 'FATURADO'].includes(order.status)) {
      throw new BadRequestException('Não é possível aplicar estoque neste status');
    }

    // Aplica baixa de estoque para itens não aplicados
    const items = order.items.filter((item: any) => item.type === 'part' && !item.applied);

    for (const item of items) {
      if (item.partId) {
        // Baixa no estoque
        await this.prisma.inventoryMovement.create({
          data: {
            tenantId,
            partId: item.partId,
            type: 'EXIT',
            quantity: item.quantity,
            note: `OS ${order.id.slice(0, 8)}`,
          },
        });

        // Marca item como aplicado
        await this.prisma.serviceOrderItem.update({
          where: { id: item.id },
          data: { applied: true },
        });
      }
    }

    // Lança despesa no financeiro
    const totalPartsNum = Number(order.totalParts);
    if (totalPartsNum > 0) {
      await this.prisma.financialTransaction.create({
        data: {
          tenantId,
          type: 'EXPENSE',
          amount: totalPartsNum,
          description: `Peças - OS ${order.id.slice(0, 8)}`,
          category: 'pecas',
          referenceId: order.id,
          referenceType: 'service_order',
        },
      });
    }

    await this.createTimeline(id, 'STOCK_APPLIED', 'Estoque baixado', userId);

    return { success: true, itemsApplied: items.length };
  }

  async receivePayment(tenantId: string, id: string, dto: FinalizeOrderDto, userId: string) {
    const order = await this.findById(tenantId, id);

    if (order.status !== 'PRONTO_ENTREGA') {
      throw new BadRequestException('OS deve estar em PRONTO_ENTREGA para registrar pagamento');
    }

    const amountPaid = dto.amountPaid || Number(order.totalCost);

    await this.prisma.serviceOrder.update({
      where: { id },
      data: { status: 'FATURADO', paidAt: new Date() },
    });

    if (dto.createIncomeTransaction) {
      await this.prisma.financialTransaction.create({
        data: {
          tenantId,
          type: 'INCOME',
          amount: amountPaid,
          description: `Pagamento - OS ${order.id.slice(0, 8)}`,
          category: 'servicos',
          referenceId: order.id,
          referenceType: 'service_order',
        },
      });
    }

    await this.createTimeline(id, 'FATURADO', `Pagamento de R$ ${amountPaid.toFixed(2)} recebido`, userId);

    return { success: true, amountPaid, status: 'FATURADO' };
  }

  async delete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.serviceOrder.delete({ where: { id } });
  }

  async addItem(tenantId: string, orderId: string, dto: CreateOrUpdateItemDto, userId: string) {
    const order = await this.findById(tenantId, orderId);

    let qty = dto.quantity || 1;
    let unitPrice = dto.unitPrice || 0;
    let description = dto.description;

    // Se for serviço e tiver ID, busca TMO e VH
    if (dto.type === 'service' && dto.serviceId) {
      const catalogService = await this.prisma.service.findUnique({
        where: { id: dto.serviceId },
      });

      if (catalogService && catalogService.hourlyRate && catalogService.tmo) {
        unitPrice = catalogService.hourlyRate;
        qty = catalogService.tmo;
        description = `${catalogService.name} (TMO: ${catalogService.tmo}h x R$ ${catalogService.hourlyRate}/h)`;
      }
    }

    const discount = dto.discount || 0;
    const totalPrice = (unitPrice * qty) - discount;

    let finalPartId = dto.partId;

    // Se for peça e não existir ID (Quick Add), cria a peça e inicializa estoque
    if (dto.type === 'part' && !finalPartId) {
      const newPart = await this.prisma.part.create({
        data: {
          tenantId,
          name: description,
          unitPrice: unitPrice,
          isActive: true,
        },
      });
      finalPartId = newPart.id;

      // Inicializa o estoque com a quantidade que está sendo lançada (para não ficar negativo)
      await this.prisma.inventoryMovement.create({
        data: {
          tenantId,
          partId: finalPartId,
          type: 'ENTRY',
          quantity: qty,
          note: `Entrada automática via Quick Add na OS ${order.id.slice(0, 8)}`,
        },
      });
    }

    const item = await this.prisma.serviceOrderItem.create({
      data: {
        serviceOrderId: orderId,
        serviceId: dto.serviceId,
        partId: finalPartId,
        description,
        quantity: qty,
        unitPrice,
        discount,
        totalPrice,
        type: dto.type,
      },
    });

    // Se for peça (existente ou nova), registra a saída do estoque IMEDIATAMENTE
    // mas só se não for orçamento (ou se estiver configurado para reservar no orçamento)
    // O usuário disse: "decrementa do estoque" ao inserir.
    if (dto.type === 'part' && finalPartId) {
      // Se for orçamento e NÃO estiver marcado para reservar, não baixamos ainda?
      // O usuário disse: "decrementa do estoque" ao inserir. Vou seguir isso.
      await this.prisma.inventoryMovement.create({
        data: {
          tenantId,
          partId: finalPartId,
          type: 'EXIT',
          quantity: qty,
          note: `Saída OS ${order.id.slice(0, 8)}`,
        },
      });
      
      // Marca como aplicado pois já baixamos
      await this.prisma.serviceOrderItem.update({
        where: { id: item.id },
        data: { applied: true },
      });
    }

    await this.recalculateTotals(orderId);
    await this.createTimeline(orderId, 'ITEM_ADDED', `Adicionado: ${description}`, userId);

    return item;
  }


  async removeItem(tenantId: string, orderId: string, itemId: string, userId: string) {
    const order = await this.findById(tenantId, orderId);
    
    const item = await this.prisma.serviceOrderItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.serviceOrderId !== orderId) {
      throw new NotFoundException('Item não encontrado na ordem');
    }

    // Se for peça, devolve ao estoque
    if (item.type === 'part' && item.partId) {
      await this.prisma.inventoryMovement.create({
        data: {
          tenantId,
          partId: item.partId,
          type: 'ENTRY',
          quantity: item.quantity,
          note: `Estorno (Item removido da OS ${order.id.slice(0, 8)})`,
        },
      });
    }

    await this.prisma.serviceOrderItem.delete({
      where: { id: itemId },
    });

    await this.recalculateTotals(orderId);
    await this.createTimeline(orderId, 'ITEM_REMOVED', `Removido: ${item.description}`, userId);

    return { success: true };
  }

  async updateItem(tenantId: string, orderId: string, itemId: string, dto: CreateOrUpdateItemDto, userId: string) {
    const order = await this.findById(tenantId, orderId);
    
    const oldItem = await this.prisma.serviceOrderItem.findUnique({
      where: { id: itemId },
    });

    if (!oldItem || oldItem.serviceOrderId !== orderId) {
      throw new NotFoundException('Item não encontrado na ordem');
    }

    const qty = dto.quantity !== undefined ? dto.quantity : oldItem.quantity;
    const unitPrice = dto.unitPrice !== undefined ? dto.unitPrice : oldItem.unitPrice;
    const discount = dto.discount !== undefined ? dto.discount : oldItem.discount;
    const totalPrice = (unitPrice * qty) - discount;

    // Atualiza estoque se a quantidade mudou e for peça
    if (oldItem.type === 'part' && oldItem.partId) {
      const diff = qty - oldItem.quantity;
      if (diff > 0) {
        await this.prisma.inventoryMovement.create({
          data: {
            tenantId,
            partId: oldItem.partId,
            type: 'EXIT',
            quantity: diff,
            note: `Ajuste Qtd OS ${order.id.slice(0, 8)}`,
          },
        });
      } else if (diff < 0) {
        await this.prisma.inventoryMovement.create({
          data: {
            tenantId,
            partId: oldItem.partId,
            type: 'ENTRY',
            quantity: Math.abs(diff),
            note: `Estorno Ajuste Qtd OS ${order.id.slice(0, 8)}`,
          },
        });
      }
    }

    const updated = await this.prisma.serviceOrderItem.update({
      where: { id: itemId },
      data: {
        description: dto.description || oldItem.description,
        quantity: qty,
        unitPrice,
        discount,
        totalPrice,
      },
    });


    await this.recalculateTotals(orderId);
    await this.createTimeline(orderId, 'ITEM_UPDATED', `Editado: ${updated.description}`, userId);

    return updated;
  }

  private async recalculateTotals(orderId: string) {

    const items = await this.prisma.serviceOrderItem.findMany({
      where: { serviceOrderId: orderId },
    });

    let totalParts = 0;
    let totalServices = 0;
    let totalLabor = 0;

    items.forEach((item) => {
      if (item.type === 'part') totalParts += Number(item.totalPrice);
      else if (item.type === 'service') totalServices += Number(item.totalPrice);
      else totalLabor += Number(item.totalPrice);
    });

    const order = await this.prisma.serviceOrder.findUnique({
      where: { id: orderId },
      select: { totalDiscount: true },
    });

    const totalDiscount = order?.totalDiscount || 0;

    await this.prisma.serviceOrder.update({
      where: { id: orderId },
      data: {
        totalParts,
        totalServices,
        totalLabor,
        totalCost: (totalParts + totalServices + totalLabor) - totalDiscount,
      },
    });

  }

  async getApprovalPage(token: string) {
    const order = await this.prisma.serviceOrder.findFirst({
      where: { approvalToken: token },
      include: {
        customer: true,
        vehicle: true,
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    return order;
  }

  private async createTimeline(
    serviceOrderId: string,
    status: string,
    description?: string,
    createdBy?: string,
  ) {
    await this.prisma.serviceOrderTimeline.create({
      data: {
        serviceOrderId,
        status,
        eventType: 'status',
        description,
        createdBy,
      },
    });
  }
}