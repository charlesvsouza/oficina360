import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

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