import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { WhatsappAdminService } from '../notifications/whatsapp-admin.service';
import { WhatsappMetaWebhookService } from './whatsapp-meta-webhook.service';

@Controller('whatsapp')
export class WhatsappWebhookController {
  constructor(
    private readonly whatsappAdmin: WhatsappAdminService,
    private readonly metaWebhook: WhatsappMetaWebhookService,
  ) {}

  /** Rota base: POST /whatsapp/qr-webhook */
  @Post('qr-webhook')
  @HttpCode(200)
  async qrWebhook(@Body() body: any) {
    this.whatsappAdmin.storeQrFromWebhook(body);
    return { received: true };
  }

  /** Rota com evento como sufixo: POST /whatsapp/qr-webhook/:event
   * A Evolution API adiciona o nome do evento ao final da URL, ex:
   * /whatsapp/qr-webhook/qrcode-updated
   * /whatsapp/qr-webhook/connection-update
   */
  @Post('qr-webhook/:event')
  @HttpCode(200)
  async qrWebhookEvent(@Param('event') event: string, @Body() body: any) {
    // Normaliza para o formato de evento que storeQrFromWebhook espera
    const normalized = { ...body, event: body.event ?? event };
    this.whatsappAdmin.storeQrFromWebhook(normalized);
    return { received: true };
  }

  /** Meta webhook verification: GET /whatsapp/meta-webhook */
  @Get('meta-webhook')
  @HttpCode(200)
  verifyMetaWebhook(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') verifyToken?: string,
    @Query('hub.challenge') challenge?: string,
  ) {
    const accepted = this.metaWebhook.validateWebhookChallenge(mode, verifyToken, challenge);
    if (!accepted) {
      throw new UnauthorizedException('Meta webhook verification failed');
    }
    return accepted;
  }

  /** Meta inbound events: POST /whatsapp/meta-webhook */
  @Post('meta-webhook')
  @HttpCode(200)
  receiveMetaWebhook(
    @Req() req: Request,
    @Body() body: any,
    @Headers('x-hub-signature-256') signature?: string,
  ) {
    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!rawBody) {
      throw new BadRequestException('Raw body is required for webhook signature validation');
    }

    const valid = this.metaWebhook.isValidSignature(signature, rawBody);
    if (!valid) {
      throw new UnauthorizedException('Invalid Meta webhook signature');
    }

    const result = this.metaWebhook.processInboundEvent(body);
    return { received: true, ...result };
  }
}
