import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePlanDto } from './dto/subscription.dto';
export enum PlanType {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  MASTER = 'MASTER',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  TRIALING = 'TRIALING',
  PAUSED = 'PAUSED',
}

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async findByTenant(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async changePlan(tenantId: string, dto: ChangePlanDto) {
    const subscription = await this.findByTenant(tenantId);
    const newPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { name: dto.plan },
    });

    if (!newPlan) {
      throw new NotFoundException('Plan not found');
    }

    const now = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    if (subscription.status === 'TRIALING') {
      return this.prisma.subscription.update({
        where: { tenantId },
        data: {
          planId: newPlan.id,
          status: 'ACTIVE',
          trialEndsAt: null,
          currentPeriodStart: now,
          currentPeriodEnd,
        },
        include: { plan: true },
      });
    }

    return this.prisma.subscription.update({
      where: { tenantId },
      data: {
        planId: newPlan.id,
        currentPeriodStart: now,
        currentPeriodEnd,
      },
      include: { plan: true },
    });
  }

  async cancel(tenantId: string) {
    return this.prisma.subscription.update({
      where: { tenantId },
      data: { cancelAtPeriodEnd: true },
      include: { plan: true },
    });
  }

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async checkAccess(tenantId: string, requiredPlan: string) {
    const subscription = await this.findByTenant(tenantId);
    
    if (subscription.status === 'TRIALING' && subscription.trialEndsAt && new Date() > subscription.trialEndsAt) {
      throw new ForbiddenException('Trial period expired');
    }

    if (subscription.status === 'PAST_DUE') {
      throw new ForbiddenException('Subscription past due');
    }

    const planHierarchy: Record<string, number> = {
      BASIC: 1,
      PREMIUM: 2,
      MASTER: 3,
    };

    const requiredLevel = planHierarchy[requiredPlan] || 0;
    const userLevel = planHierarchy[subscription.plan.name] || 0;

    if (userLevel < requiredLevel) {
      throw new ForbiddenException(`This feature requires ${requiredPlan} plan`);
    }

    return true;
  }
}