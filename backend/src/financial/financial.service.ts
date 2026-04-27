import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/financial.dto';

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { tenantId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    return this.prisma.financialTransaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async findById(tenantId: string, transactionId: string) {
    const transaction = await this.prisma.financialTransaction.findFirst({
      where: { id: transactionId, tenantId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async create(tenantId: string, dto: CreateTransactionDto) {
    return this.prisma.financialTransaction.create({
      data: {
        tenantId,
        type: dto.type,
        amount: dto.amount,
        description: dto.description,
        category: dto.category,
        referenceId: dto.referenceId,
        referenceType: dto.referenceType,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });
  }

  async delete(tenantId: string, transactionId: string) {
    await this.findById(tenantId, transactionId);
    return this.prisma.financialTransaction.delete({
      where: { id: transactionId },
    });
  }

  async getSummary(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { tenantId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const transactions = await this.prisma.financialTransaction.findMany({ where });

    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      period: { start: startDate || new Date(0), end: endDate || new Date() },
    };
  }

  async getOSProfit(tenantId: string, serviceOrderId: string) {
    const order = await this.prisma.serviceOrder.findFirst({
      where: { id: serviceOrderId, tenantId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Service order not found');
    }

    return {
      serviceOrderId,
      revenue: Number(order.totalCost),
      costs: order.items.reduce((sum, item) => sum + Number(item.totalPrice), 0),
      profit: Number(order.totalCost),
    };
  }
}