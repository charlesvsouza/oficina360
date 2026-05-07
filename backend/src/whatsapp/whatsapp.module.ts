import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';
import { WhatsappAdminService } from '../notifications/whatsapp-admin.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { WhatsappMetaWebhookService } from './whatsapp-meta-webhook.service';

@Module({
  imports: [NotificationsModule],
  controllers: [WhatsappController, WhatsappWebhookController],
  providers: [WhatsappAdminService, WhatsappMetaWebhookService],
})
export class WhatsappModule {}
