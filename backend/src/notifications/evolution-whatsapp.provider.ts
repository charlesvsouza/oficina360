import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WhatsappProvider } from './whatsapp-provider.interface';

@Injectable()
export class EvolutionWhatsappProvider implements WhatsappProvider {
  readonly name = 'EVOLUTION';
  private readonly logger = new Logger(EvolutionWhatsappProvider.name);

  constructor(private readonly config: ConfigService) {}

  private get apiUrl(): string {
    return this.config.get<string>('EVOLUTION_API_URL') ?? '';
  }

  private get globalApiKey(): string {
    return this.config.get<string>('EVOLUTION_API_KEY') ?? '';
  }

  private get instanceName(): string {
    return this.config.get<string>('EVOLUTION_INSTANCE') ?? 'sygmaauto';
  }

  isConfigured(): boolean {
    return !!(this.apiUrl && this.globalApiKey);
  }

  async sendText(to: string, message: string): Promise<void> {
    const number = this.normalizePhone(to);

    if (!this.isConfigured()) {
      this.logger.warn(`Provider Evolution nao configurado; envio para ${number} descartado`);
      return;
    }

    try {
      await axios.post(
        `${this.apiUrl}/message/sendText/${this.instanceName}`,
        { number, text: message },
        {
          headers: {
            apikey: this.globalApiKey,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        },
      );
      this.logger.log(`Mensagem enviada via Evolution para ${number}`);
    } catch (err: any) {
      this.logger.error(
        `Falha no envio Evolution para ${number}: ${err?.response?.data?.message ?? err.message}`,
      );
    }
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('55') && digits.length >= 12) return digits;
    return `55${digits}`;
  }
}
