import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EvolutionWhatsappProvider } from './evolution-whatsapp.provider';
import { MetaCloudWhatsappProvider } from './meta-cloud-whatsapp.provider';
import { WhatsappProvider } from './whatsapp-provider.interface';

@Injectable()
export class WhatsappProviderService {
  constructor(
    private readonly config: ConfigService,
    private readonly evolutionProvider: EvolutionWhatsappProvider,
    private readonly metaCloudProvider: MetaCloudWhatsappProvider,
  ) {}

  get providerMode(): string {
    return (this.config.get<string>('WHATSAPP_PROVIDER') ?? 'EVOLUTION').trim().toUpperCase();
  }

  getProvider(): WhatsappProvider {
    if (this.providerMode === 'META_CLOUD') {
      return this.metaCloudProvider;
    }

    return this.evolutionProvider;
  }
}
