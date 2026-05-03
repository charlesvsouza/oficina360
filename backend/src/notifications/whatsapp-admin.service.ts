import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WhatsappAdminService {
  private readonly logger = new Logger(WhatsappAdminService.name);

  constructor(private readonly config: ConfigService) {}

  private get apiUrl(): string | undefined {
    return this.config.get<string>('EVOLUTION_API_URL');
  }

  private get apiKey(): string | undefined {
    return this.config.get<string>('EVOLUTION_API_KEY');
  }

  private get instance(): string {
    return this.config.get<string>('EVOLUTION_INSTANCE') ?? 'sygmaauto';
  }

  isConfigured(): boolean {
    return !!(this.apiUrl && this.apiKey);
  }

  private headers() {
    return { apikey: this.apiKey, 'Content-Type': 'application/json' };
  }

  async getStatus() {
    if (!this.isConfigured()) {
      return { configured: false, connected: false, state: 'unknown', instanceName: this.instance };
    }

    try {
      const res = await axios.get(
        `${this.apiUrl}/instance/connectionState/${this.instance}`,
        { headers: this.headers(), timeout: 6000 },
      );
      const state = res.data?.instance?.state ?? 'unknown';
      return {
        configured: true,
        connected: state === 'open',
        state,
        instanceName: this.instance,
      };
    } catch {
      return { configured: true, connected: false, state: 'close', instanceName: this.instance };
    }
  }

  async getQrCode(): Promise<{ qrCode: string | null; error?: string }> {
    if (!this.isConfigured()) return { qrCode: null, error: 'Evolution API não configurada' };

    try {
      // 1. Descobre instâncias existentes para usar o nome correto
      let instanceName = this.instance;
      const fetchRes = await axios.get(`${this.apiUrl}/instance/fetchInstances`, {
        headers: this.headers(), timeout: 6000,
      }).catch(() => null);

      const instances: any[] = Array.isArray(fetchRes?.data)
        ? fetchRes.data
        : (fetchRes?.data?.data ?? []);

      this.logger.log(`Instâncias encontradas: ${JSON.stringify(instances.map((i: any) => i.instance?.instanceName ?? i.instanceName))}`);

      if (instances.length > 0) {
        // Usa a primeira instância disponível (ou a que bate com o env)
        const match = instances.find((i: any) =>
          (i.instance?.instanceName ?? i.instanceName) === this.instance,
        ) ?? instances[0];
        instanceName = match.instance?.instanceName ?? match.instanceName ?? this.instance;
        this.logger.log(`Usando instância: ${instanceName}`);
      } else {
        // Nenhuma instância — tenta criar
        const createRes = await axios.post(
          `${this.apiUrl}/instance/create`,
          { instanceName: this.instance, qrcode: true, integration: 'WHATSAPP-BAILEYS' },
          { headers: this.headers(), timeout: 8000 },
        ).catch((e) => {
          this.logger.warn(`create instance: ${e?.response?.data?.message ?? e.message}`);
          return null;
        });

        const createQr = createRes?.data?.qrcode?.base64 ?? createRes?.data?.base64 ?? null;
        if (createQr) {
          const qrCode = createQr.startsWith('data:') ? createQr : `data:image/png;base64,${createQr}`;
          this.logger.log('QR Code obtido via create');
          return { qrCode };
        }
      }

      // 2. Chama connect para obter QR
      const qrRes = await axios.get(
        `${this.apiUrl}/instance/connect/${instanceName}`,
        { headers: this.headers(), timeout: 8000 },
      );

      this.logger.log(`connect response: ${JSON.stringify(qrRes.data)}`);

      // Cobre todos os formatos conhecidos da Evolution API v1/v2
      const rawQr =
        qrRes.data?.base64 ??
        qrRes.data?.qrcode?.base64 ??
        qrRes.data?.Qrcode?.base64 ??
        qrRes.data?.code ??
        null;

      if (!rawQr) {
        this.logger.error(`QR não encontrado. Resposta completa: ${JSON.stringify(qrRes.data)}`);
        return { qrCode: null, error: `QR não disponível. Resposta da API: ${JSON.stringify(qrRes.data)}` };
      }

      const qrCode = rawQr.startsWith('data:') ? rawQr : `data:image/png;base64,${rawQr}`;
      return { qrCode };
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err.message;
      this.logger.error(`Erro ao obter QR Code: ${msg} — status: ${err?.response?.status} — data: ${JSON.stringify(err?.response?.data)}`);
      return { qrCode: null, error: msg };
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConfigured()) return;
    try {
      await axios.delete(
        `${this.apiUrl}/instance/logout/${this.instance}`,
        { headers: this.headers(), timeout: 6000 },
      );
    } catch (err: any) {
      this.logger.error(`Erro ao desconectar: ${err?.response?.data?.message ?? err.message}`);
    }
  }
}
