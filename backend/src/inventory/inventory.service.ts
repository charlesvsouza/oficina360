import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartDto, UpdatePartDto, CreateMovementDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

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
    if (dto.sku) {
      const existing = await this.prisma.part.findFirst({ where: { tenantId, sku: dto.sku } });
      if (existing) throw new BadRequestException('SKU já cadastrado');
    }
    return this.prisma.part.create({ data: { tenantId, ...dto } });
  }

  async updatePart(tenantId: string, partId: string, dto: UpdatePartDto) {
    await this.findPartById(tenantId, partId);
    if (dto.sku) {
      const existing = await this.prisma.part.findFirst({ where: { tenantId, sku: dto.sku, NOT: { id: partId } } });
      if (existing) throw new BadRequestException('SKU já cadastrado');
    }
    return this.prisma.part.update({ where: { id: partId }, data: dto });
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
