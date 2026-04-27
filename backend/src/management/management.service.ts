import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ManagementService {
  constructor(private prisma: PrismaService) {}

  async createTenantWithAdmin(dto: any) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const tenantId = uuidv4();
    const userId = uuidv4();

    // Get the BASIC plan or create it if it doesn't exist
    let plan = await this.prisma.subscriptionPlan.findUnique({
      where: { name: 'BASIC' },
    });

    if (!plan) {
      plan = await this.prisma.subscriptionPlan.create({
        data: {
          name: 'BASIC',
          description: 'Plano básico automático',
          price: 0,
          features: '{}',
          limits: '{}',
        },
      });
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          id: tenantId,
          name: dto.tenantName,
          document: dto.document || '',
        },
      });

      await tx.subscription.create({
        data: {
          tenantId,
          planId: plan.id,
          status: 'ACTIVE',
          currentPeriodEnd: trialEndsAt,
        },
      });

      const user = await tx.user.create({
        data: {
          id: userId,
          tenantId,
          email: dto.email,
          passwordHash: await bcrypt.hash(dto.password, 10),
          name: dto.name,
          role: 'ADMIN',
        },
      });

      return { tenant, user };
    });
  }

  async listAllTenants() {
    return this.prisma.tenant.findMany({
      include: {
        _count: {
          select: { users: true }
        },
        subscription: {
          include: { plan: true }
        }
      }
    });
  }
}
