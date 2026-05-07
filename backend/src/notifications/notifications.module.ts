import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { WhatsappService } from './whatsapp.service';
import { EvolutionWhatsappProvider } from './evolution-whatsapp.provider';
import { MetaCloudWhatsappProvider } from './meta-cloud-whatsapp.provider';
import { WhatsappProviderService } from './whatsapp-provider.service';

@Module({
  imports: [ConfigModule],
  providers: [
    EmailService,
    WhatsappService,
    EvolutionWhatsappProvider,
    MetaCloudWhatsappProvider,
    WhatsappProviderService,
  ],
  exports: [EmailService, WhatsappService],
})
export class NotificationsModule {}
