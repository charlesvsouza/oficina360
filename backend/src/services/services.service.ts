import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  private readonly servicesLimitByPlan: Record<string, number> = {
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

  private getServicesLimit(planName: string) {
    return this.servicesLimitByPlan[planName] ?? 100;
  }

  async findAll(tenantId: string) {
    return this.prisma.service.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(tenantId: string, serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async create(tenantId: string, dto: CreateServiceDto) {
    const planName = await this.getTenantPlanName(tenantId);
    const maxServices = this.getServicesLimit(planName);
    const activeServices = await this.prisma.service.count({ where: { tenantId, isActive: true } });
    if (activeServices >= maxServices) {
      throw new BadRequestException(`Limite de ${maxServices} servicos atingido para o plano ${planName}.`);
    }

    return this.prisma.service.create({
      data: { tenantId, ...dto },
    });
  }

  async update(tenantId: string, serviceId: string, dto: UpdateServiceDto) {
    await this.findById(tenantId, serviceId);
    return this.prisma.service.update({
      where: { id: serviceId },
      data: dto,
    });
  }

  async delete(tenantId: string, serviceId: string) {
    await this.findById(tenantId, serviceId);
    return this.prisma.service.update({
      where: { id: serviceId },
      data: { isActive: false },
    });
  }
}