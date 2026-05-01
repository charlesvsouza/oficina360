import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePlanDto, CreateCheckoutDto } from './dto/subscription.dto';
export enum PlanType {
  START = 'START',
  PRO = 'PRO',
  REDE = 'REDE',
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
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

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

  async createCheckoutLink(tenantId: string, dto: CreateCheckoutDto) {
    const subscription = await this.findByTenant(tenantId);
    const selectedPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { name: dto.plan },
    });

    if (!selectedPlan) {
      throw new NotFoundException('Plan not found');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const frontendUrl = (this.configService.get<string>('FRONTEND_URL') || 'https://sigmaauto.com.br').replace(/\/+$/, '');
    const successUrl = dto.successUrl || this.configService.get<string>('CHECKOUT_SUCCESS_URL') || `${frontendUrl}/settings?checkout=success`;
    const cancelUrl = dto.cancelUrl || this.configService.get<string>('CHECKOUT_CANCEL_URL') || `${frontendUrl}/settings?checkout=cancel`;

    const mercadoPagoToken = this.configService.get<string>('MP_ACCESS_TOKEN');
    const mercadoPagoMode = (this.configService.get<string>('MP_MODE') || 'production').toLowerCase();

    // Preferred flow: create Mercado Pago preference dynamically.
    if (mercadoPagoToken) {
      const preferencePayload = {
        items: [
          {
            title: `Sigma Auto Plano ${selectedPlan.name}`,
            quantity: 1,
            unit_price: Number(selectedPlan.price),
            currency_id: 'BRL',
            description: `Assinatura mensal do plano ${selectedPlan.name}`,
          },
        ],
        external_reference: `${tenant.id}:${selectedPlan.name}:${Date.now()}`,
        metadata: {
          tenantId: tenant.id,
          tenantName: tenant.name,
          plan: selectedPlan.name,
          currentPlan: subscription.plan.name,
        },
        back_urls: {
          success: successUrl,
          pending: cancelUrl,
          failure: cancelUrl,
        },
        auto_return: 'approved',
      };

      const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mercadoPagoToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferencePayload),
      });

      if (!mpResponse.ok) {
        const errorText = await mpResponse.text();
        throw new InternalServerErrorException(`Mercado Pago checkout error: ${errorText}`);
      }

      const mpData = await mpResponse.json() as { init_point?: string; sandbox_init_point?: string };
      const checkoutUrl = mercadoPagoMode === 'sandbox' ? (mpData.sandbox_init_point || mpData.init_point) : (mpData.init_point || mpData.sandbox_init_point);

      if (!checkoutUrl) {
        throw new InternalServerErrorException('Mercado Pago did not return checkout URL');
      }

      return {
        provider: 'mercado_pago',
        mode: mercadoPagoMode,
        plan: dto.plan,
        checkoutUrl,
      };
    }

    const checkoutByPlan: Record<string, string | undefined> = {
      START: this.configService.get<string>('CHECKOUT_URL_START'),
      PRO: this.configService.get<string>('CHECKOUT_URL_PRO'),
      REDE: this.configService.get<string>('CHECKOUT_URL_REDE'),
    };

    const configuredCheckout = checkoutByPlan[dto.plan];
    if (!configuredCheckout) {
      throw new NotFoundException('Configure MP_ACCESS_TOKEN ou CHECKOUT_URL_* para habilitar checkout');
    }

    const checkoutUrl = new URL(configuredCheckout);
    checkoutUrl.searchParams.set('tenantId', tenant.id);
    checkoutUrl.searchParams.set('tenantName', tenant.name);
    checkoutUrl.searchParams.set('plan', dto.plan);
    checkoutUrl.searchParams.set('currentPlan', subscription.plan.name);

    if (successUrl) checkoutUrl.searchParams.set('success_url', successUrl);
    if (cancelUrl) checkoutUrl.searchParams.set('cancel_url', cancelUrl);

    return {
      provider: 'external_checkout',
      plan: dto.plan,
      checkoutUrl: checkoutUrl.toString(),
    };
  }

  async processMercadoPagoWebhook(payload: any, query?: Record<string, any>, headers?: Record<string, any>) {
    const webhookSecret = this.configService.get<string>('MP_WEBHOOK_SECRET');
    if (webhookSecret) {
      const signatureOk = this.validateMercadoPagoSignature(headers || {}, query || {}, payload || {}, webhookSecret);
      if (!signatureOk) {
        throw new ForbiddenException('Invalid Mercado Pago signature');
      }
    }

    const webhookToken = this.configService.get<string>('MP_WEBHOOK_TOKEN');
    if (webhookToken) {
      const receivedToken = headers?.['x-webhook-token'] || headers?.['X-Webhook-Token'];
      if (receivedToken !== webhookToken) {
        throw new ForbiddenException('Invalid webhook token');
      }
    }

    const eventType = payload?.type || payload?.topic || query?.type || query?.topic;
    const paymentId =
      payload?.data?.id ||
      payload?.resource?.id ||
      query?.['data.id'] ||
      query?.id;

    if (!paymentId) {
      return { received: true, ignored: true, reason: 'missing payment id' };
    }

    if (eventType && String(eventType).toLowerCase() !== 'payment') {
      return { received: true, ignored: true, reason: `event type ${eventType} not handled` };
    }

    const accessToken = this.configService.get<string>('MP_ACCESS_TOKEN');
    if (!accessToken) {
      throw new NotFoundException('MP_ACCESS_TOKEN not configured');
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      throw new InternalServerErrorException(`Mercado Pago payment lookup failed: ${errorText}`);
    }

    const paymentData = (await paymentResponse.json()) as any;
    const paymentStatus = String(paymentData?.status || '').toLowerCase();

    if (paymentStatus !== 'approved') {
      return {
        received: true,
        ignored: true,
        reason: `payment status ${paymentStatus} not approved`,
      };
    }

    const metadata = paymentData?.metadata || {};
    let tenantId: string | undefined = metadata?.tenantId;
    let planName: string | undefined = metadata?.plan;

    const externalReference = String(paymentData?.external_reference || '');
    if ((!tenantId || !planName) && externalReference.includes(':')) {
      const [refTenantId, refPlan] = externalReference.split(':');
      tenantId = tenantId || refTenantId;
      planName = planName || refPlan;
    }

    if (!tenantId || !planName) {
      return { received: true, ignored: true, reason: 'missing tenantId or plan in metadata' };
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { name: planName } });
    if (!plan) {
      throw new NotFoundException('Plan not found for webhook processing');
    }

    const now = new Date();
    const currentPeriodEnd = new Date(now);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    const updated = await this.prisma.subscription.update({
      where: { tenantId },
      data: {
        planId: plan.id,
        status: 'ACTIVE',
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        currentPeriodStart: now,
        currentPeriodEnd,
      },
      include: { plan: true },
    });

    return {
      received: true,
      processed: true,
      paymentId: String(paymentId),
      tenantId,
      plan: updated.plan.name,
      status: updated.status,
    };
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
      START: 1,
      PRO: 2,
      REDE: 3,
    };

    const requiredLevel = planHierarchy[requiredPlan] || 0;
    const userLevel = planHierarchy[subscription.plan.name] || 0;

    if (userLevel < requiredLevel) {
      throw new ForbiddenException(`This feature requires ${requiredPlan} plan`);
    }

    return true;
  }

  private validateMercadoPagoSignature(
    headers: Record<string, any>,
    query: Record<string, any>,
    payload: Record<string, any>,
    secret: string,
  ) {
    const rawSignature = String(headers?.['x-signature'] || headers?.['X-Signature'] || '');
    const requestId = String(headers?.['x-request-id'] || headers?.['X-Request-Id'] || '');

    if (!rawSignature || !requestId) {
      return false;
    }

    const signatureParts = rawSignature.split(',').map((p) => p.trim());
    const ts = signatureParts.find((p) => p.startsWith('ts='))?.split('=')[1] || '';
    const v1 = signatureParts.find((p) => p.startsWith('v1='))?.split('=')[1] || '';

    if (!ts || !v1) {
      return false;
    }

    const rawDataId = query?.['data.id'] || payload?.data?.id || query?.id || '';
    const dataId = String(rawDataId || '').toLowerCase();

    const manifestParts = [] as string[];
    if (dataId) manifestParts.push(`id:${dataId}`);
    if (requestId) manifestParts.push(`request-id:${requestId}`);
    if (ts) manifestParts.push(`ts:${ts}`);
    const manifest = `${manifestParts.join(';')};`;

    if (!manifestParts.length) {
      return false;
    }

    const expected = createHmac('sha256', secret).update(manifest).digest('hex');

    try {
      return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(v1, 'utf8'));
    } catch {
      return false;
    }
  }
}