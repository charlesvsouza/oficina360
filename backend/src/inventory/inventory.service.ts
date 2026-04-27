import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartDto, UpdatePartDto, CreateMovementDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAllParts(tenantId: string) {
    return this.prisma.part.findMany({
      where: { tenantId },
      include: {
        _count: { select: { inventoryMovements: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findPartById(tenantId: string, partId: string) {
    const part = await this.prisma.part.findFirst({
      where: { id: partId, tenantId },
      include: {
        inventoryMovements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!part) {
      throw new NotFoundException('Part not found');
    }

    return part;
  }

  async createPart(tenantId: string, dto: CreatePartDto) {
    const existing = await this.prisma.part.findFirst({
      where: { tenantId, sku: dto.sku },
    });

    if (existing) {
      throw new BadRequestException('SKU already exists');
    }

    return this.prisma.part.create({
      data: { tenantId, ...dto },
    });
  }

  async updatePart(tenantId: string, partId: string, dto: UpdatePartDto) {
    await this.findPartById(tenantId, partId);

    if (dto.sku) {
      const existing = await this.prisma.part.findFirst({
        where: { tenantId, sku: dto.sku, NOT: { id: partId } },
      });

      if (existing) {
        throw new BadRequestException('SKU already exists');
      }
    }

    return this.prisma.part.update({
      where: { id: partId },
      data: dto,
    });
  }

  async deletePart(tenantId: string, partId: string) {
    await this.findPartById(tenantId, partId);
    return this.prisma.part.update({
      where: { id: partId },
      data: { isActive: false },
    });
  }

  async createMovement(tenantId: string, dto: CreateMovementDto) {
    const part = await this.findPartById(tenantId, dto.partId);

    if (dto.type === 'EXIT') {
      const currentStock = await this.getCurrentStock(tenantId, dto.partId);
      if (currentStock < dto.quantity) {
        throw new BadRequestException('Insufficient stock');
      }
    }

    return this.prisma.inventoryMovement.create({
      data: {
        tenantId,
        partId: dto.partId,
        type: dto.type,
        quantity: dto.quantity,
        note: dto.note,
      },
    });
  }

  async getStockReport(tenantId: string) {
    const parts = await this.prisma.part.findMany({
      where: { tenantId, isActive: true },
    });

    const report = await Promise.all(
      parts.map(async (part) => {
        const currentStock = await this.getCurrentStock(tenantId, part.id);
        return {
          ...part,
          currentStock,
          needsRestock: currentStock <= part.minStock,
        };
      }),
    );

    return report;
  }

  private async getCurrentStock(tenantId: string, partId: string): Promise<number> {
    const movements = await this.prisma.inventoryMovement.findMany({
      where: { tenantId, partId },
      orderBy: { createdAt: 'desc' },
    });

    let stock = 0;
    for (const m of movements) {
      if (m.type === 'ENTRY') stock += m.quantity;
      else stock -= m.quantity;
    }

    return stock;
  }
}