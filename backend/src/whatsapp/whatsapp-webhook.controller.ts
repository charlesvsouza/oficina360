import { Controller, Post, Body, HttpCode, Param } from '@nestjs/common';
import { WhatsappAdminService } from '../notifications/whatsapp-admin.service';

@Controller('whatsapp')
export class WhatsappWebhookController {
  constructor(private readonly whatsappAdmin: WhatsappAdminService) {}

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
}
