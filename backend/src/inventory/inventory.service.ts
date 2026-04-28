import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartDto, UpdatePartDto, CreateMovementDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  private readonly partsLimitByPlan: Record<string, number> = {
    START: 100,
    PRO: 1000,
    REDE: 1000000,
  };

  private async getTenantPlanName(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: { select: { name: true } } },
    });
    return subscription?.plan?.name || 'START';
  }

  private getPartsLimit(planName: string) {
    return this.partsLimitByPlan[planName] ?? 100;
  }

  private normalizeOptionalString(value?: string) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  async findAllParts(tenantId: string) {
    const parts = await this.prisma.part.findMany({
      where: { tenantId, isActive: true },
      include: {
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
    return parts.map((p) => ({ ...p, currentStock: p.currentStock ?? 0 }));
  }

  async findPartById(tenantId: string, partId: string) {
    const part = await this.prisma.part.findFirst({
      where: { id: partId, tenantId },
      include: {
        supplier: { select: { id: true, name: true } },
        inventoryMovements: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!part) throw new NotFoundException('Part not found');
    return part;
  }

  async createPart(tenantId: string, dto: CreatePartDto) {
    const planName = await this.getTenantPlanName(tenantId);
    const maxParts = this.getPartsLimit(planName);
    const activeParts = await this.prisma.part.count({ where: { tenantId, isActive: true } });
    if (activeParts >= maxParts) {
      throw new BadRequestException(`Limite de ${maxParts} pecas atingido para o plano ${planName}.`);
    }

    const normalizedDto: CreatePartDto = {
      ...dto,
      internalCode: this.normalizeOptionalString(dto.internalCode),
      sku: this.normalizeOptionalString(dto.sku),
      category: this.normalizeOptionalString(dto.category),
      description: this.normalizeOptionalString(dto.description),
      unit: this.normalizeOptionalString(dto.unit),
      location: this.normalizeOptionalString(dto.location),
      supplierId: this.normalizeOptionalString(dto.supplierId),
    };

    if (normalizedDto.sku) {
      const existing = await this.prisma.part.findFirst({ where: { tenantId, sku: normalizedDto.sku } });
      if (existing) throw new BadRequestException('SKU já cadastrado');
    }
    return this.prisma.part.create({ data: { tenantId, ...normalizedDto } });
  }

  async updatePart(tenantId: string, partId: string, dto: UpdatePartDto) {
    await this.findPartById(tenantId, partId);

    const normalizedDto: UpdatePartDto = {
      ...dto,
      internalCode: this.normalizeOptionalString(dto.internalCode),
      sku: this.normalizeOptionalString(dto.sku),
      category: this.normalizeOptionalString(dto.category),
      description: this.normalizeOptionalString(dto.description),
      unit: this.normalizeOptionalString(dto.unit),
      location: this.normalizeOptionalString(dto.location),
      supplierId: this.normalizeOptionalString(dto.supplierId),
    };

    if (normalizedDto.sku) {
      const existing = await this.prisma.part.findFirst({ where: { tenantId, sku: normalizedDto.sku, NOT: { id: partId } } });
      if (existing) throw new BadRequestException('SKU já cadastrado');
    }

    return this.prisma.part.update({ where: { id: partId }, data: normalizedDto });
  }

  async deletePart(tenantId: string, partId: string) {
    await this.findPartById(tenantId, partId);
    return this.prisma.part.update({ where: { id: partId }, data: { isActive: false } });
  }

  async createMovement(tenantId: string, dto: CreateMovementDto) {
    const part = await this.findPartById(tenantId, dto.partId);

    const delta = dto.type === 'ENTRY' ? dto.quantity : -dto.quantity;
    const newStock = (part.currentStock ?? 0) + delta;

    if (dto.type === 'EXIT' && newStock < 0) {
      throw new BadRequestException('Estoque insuficiente');
    }

    const [movement] = await this.prisma.$transaction([
      this.prisma.inventoryMovement.create({
        data: { tenantId, partId: dto.partId, type: dto.type, quantity: dto.quantity, note: dto.note },
      }),
      this.prisma.part.update({
        where: { id: dto.partId },
        data: { currentStock: newStock },
      }),
    ]);

    return movement;
  }

  async getStockReport(tenantId: string) {
    const parts = await this.prisma.part.findMany({
      where: { tenantId, isActive: true },
      include: { supplier: { select: { id: true, name: true } } },
    });
    return parts.map((p) => ({
      ...p,
      currentStock: p.currentStock ?? 0,
      needsRestock: (p.currentStock ?? 0) <= p.minStock,
    }));
  }
}
