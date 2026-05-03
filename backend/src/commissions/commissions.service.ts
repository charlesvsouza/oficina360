import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type ListFilters = {
  startDate?: string;
  endDate?: string;
  status?: string;
  userId?: string;
};

@Injectable()
export class CommissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    user: { userId: string; role: string },
    filters: ListFilters,
  ) {
    const where: any = { tenantId };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const role = String(user.role || '').toUpperCase();

    if (['MASTER', 'ADMIN', 'FINANCEIRO'].includes(role)) {
      if (filters.userId) where.userId = filters.userId;
    } else if (role === 'CHEFE_OFICINA') {
      const actor = await this.prisma.user.findFirst({
        where: { id: user.userId, tenantId },
        select: { id: true, workshopArea: true },
      });

      const team = await this.prisma.user.findMany({
        where: {
          tenantId,
          isActive: true,
          chiefId: user.userId,
          ...(actor?.workshopArea ? { workshopArea: actor.workshopArea } : {}),
        },
        select: { id: true },
      });

      const allowedIds = [user.userId, ...team.map((u) => u.id)];
      where.userId = filters.userId && allowedIds.includes(filters.userId)
        ? filters.userId
        : { in: allowedIds };
    } else {
      where.userId = user.userId;
    }

    const commissions = await this.prisma.mechanicCommission.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            workshopArea: true,
            jobFunction: true,
          },
        },
        serviceOrder: {
          select: {
            id: true,
            status: true,
            customerId: true,
            vehicleId: true,
            createdAt: true,
          },
        },
        serviceOrderItem: {
          select: {
            id: true,
            description: true,
            type: true,
            totalPrice: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totals = commissions.reduce(
      (acc, c) => {
        const value = Number(c.commissionValue || 0);
        acc.total += value;
        if (c.status === 'PAGO') acc.paid += value;
        else acc.pending += value;
        return acc;
      },
      { total: 0, pending: 0, paid: 0 },
    );

    return {
      totals,
      data: commissions,
    };
  }

  async markAsPaid(tenantId: string, commissionId: string, paidByUserId: string) {
    const commission = await this.prisma.mechanicCommission.findFirst({
      where: { id: commissionId, tenantId },
      select: { id: true, status: true },
    });

    if (!commission) {
      throw new NotFoundException('Comissão não encontrada');
    }

    if (commission.status === 'PAGO') {
      return { success: true, alreadyPaid: true };
    }

    return this.prisma.mechanicCommission.update({
      where: { id: commissionId },
      data: {
        status: 'PAGO',
        paidAt: new Date(),
        paidBy: paidByUserId,
      },
    });
  }
}
