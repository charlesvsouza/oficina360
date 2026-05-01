import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SuperAdminLoginDto, CreateSuperAdminDto } from './dto/superadmin.dto';

@Injectable()
export class SuperAdminService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: SuperAdminLoginDto) {
    const admin = await this.prisma.superAdmin.findUnique({
      where: { email: dto.email },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const valid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const token = this.jwtService.sign(
      { sub: admin.id, email: admin.email, isSuperAdmin: true },
      {
        secret: this.configService.get('JWT_SECRET') || 'oficina360-secret-key',
        expiresIn: '8h',
      },
    );

    return {
      accessToken: token,
      superAdmin: { id: admin.id, name: admin.name, email: admin.email },
    };
  }

  async createSuperAdmin(dto: CreateSuperAdminDto) {
    const bootstrapSecret = this.configService.get('SUPER_ADMIN_BOOTSTRAP_SECRET');
    if (!bootstrapSecret || dto.bootstrapSecret !== bootstrapSecret) {
      throw new ForbiddenException('Segredo de bootstrap inválido');
    }

    const existing = await this.prisma.superAdmin.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const admin = await this.prisma.superAdmin.create({
      data: { email: dto.email, name: dto.name, passwordHash },
    });

    return { id: admin.id, name: admin.name, email: admin.email };
  }

  async listTenants() {
    return this.prisma.tenant.findMany({
      include: {
        subscription: { include: { plan: true } },
        _count: {
          select: {
            users: true,
            customers: true,
            vehicles: true,
            serviceOrders: true,
            parts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTenantDetails(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: { include: { plan: true } },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            customers: true,
            vehicles: true,
            serviceOrders: true,
            parts: true,
            financialTransactions: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    return tenant;
  }

  async deleteTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    // Deletar na ordem correta para respeitar FK constraints
    await this.prisma.$transaction([
      this.prisma.serviceOrderTimeline.deleteMany({ where: { serviceOrder: { tenantId } } }),
      this.prisma.serviceOrderItem.deleteMany({ where: { serviceOrder: { tenantId } } }),
      this.prisma.serviceOrder.deleteMany({ where: { tenantId } }),
      this.prisma.inventoryMovement.deleteMany({ where: { tenantId } }),
      this.prisma.part.deleteMany({ where: { tenantId } }),
      this.prisma.supplier.deleteMany({ where: { tenantId } }),
      this.prisma.financialTransaction.deleteMany({ where: { tenantId } }),
      this.prisma.vehicle.deleteMany({ where: { tenantId } }),
      this.prisma.customer.deleteMany({ where: { tenantId } }),
      this.prisma.service.deleteMany({ where: { tenantId } }),
      this.prisma.user.deleteMany({ where: { tenantId } }),
      this.prisma.subscription.deleteMany({ where: { tenantId } }),
      this.prisma.tenant.delete({ where: { id: tenantId } }),
    ]);

    return { deleted: true, tenantId, tenantName: tenant.name };
  }

  async getSystemStats() {
    const [totalTenants, totalUsers, totalServiceOrders, totalRevenue] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.user.count(),
      this.prisma.serviceOrder.count(),
      this.prisma.financialTransaction.aggregate({ _sum: { amount: true }, where: { type: 'INCOME' } }),
    ]);

    return {
      totalTenants,
      totalUsers,
      totalServiceOrders,
      totalRevenue: totalRevenue._sum.amount ?? 0,
    };
  }
}
