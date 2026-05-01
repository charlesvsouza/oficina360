import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';

@ApiExcludeController()
@Controller('webhooks/mercadopago')
export class SubscriptionsWebhookController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get()
  ping() {
    return { ok: true, provider: 'mercado_pago' };
  }

  @Post()
  async receive(
    @Body() payload: any,
    @Query() query: Record<string, any>,
    @Headers() headers: Record<string, any>,
  ) {
    return this.subscriptionsService.processMercadoPagoWebhook(payload, query, headers);
  }
}
