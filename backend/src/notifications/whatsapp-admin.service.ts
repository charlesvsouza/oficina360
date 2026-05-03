import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import QRCode from 'qrcode';

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

  private authHeadersList(apiKeyOverride?: string): Array<Record<string, string>> {
    const key = apiKeyOverride ?? this.apiKey ?? '';
    return [
      { apikey: key, 'Content-Type': 'application/json' },
      { apiKey: key, 'Content-Type': 'application/json' },
      { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    ];
  }

  private async withAuthRetry<T>(
    runner: (headers: Record<string, string>) => Promise<T>,
    apiKeyOverride?: string,
  ): Promise<T> {
    const headersOptions = this.authHeadersList(apiKeyOverride);
    let lastError: any;

    for (const headers of headersOptions) {
      try {
        return await runner(headers);
      } catch (err: any) {
        lastError = err;
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          continue;
        }
        throw err;
      }
    }

    throw lastError;
  }

  private async getInstanceApiKey(): Promise<string | null> {
    try {
      const res = await this.withAuthRetry((headers) => axios.get(
        `${this.apiUrl}/instance/fetchInstances`,
        { headers, timeout: 8000 },
      ));

      const data = res.data;
      const instances: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.response)
          ? data.response
          : Array.isArray(data?.data)
            ? data.data
            : [];

      const current = instances.find((item) => {
        const name = item?.instance?.instanceName ?? item?.instanceName;
        return name === this.instance;
      });

      const instanceKey =
        current?.instance?.apikey ??
        current?.apikey ??
        current?.instance?.token ??
        current?.token ??
        null;

      if (instanceKey) {
        this.logger.log(`Usando apikey da instância ${this.instance} para connect/logout.`);
      }

      return instanceKey;
    } catch {
      return null;
    }
  }

  private async extractQrCode(data: any): Promise<string | null> {
    const imageCandidates = [
      data?.base64,
      data?.qrcode?.base64,
      data?.Qrcode?.base64,
      data?.data?.base64,
      data?.data?.qrcode?.base64,
      data?.response?.base64,
      data?.response?.qrcode?.base64,
    ];

    for (const candidate of imageCandidates) {
      if (typeof candidate === 'string' && candidate.length > 20) {
        return candidate.startsWith('data:') ? candidate : `data:image/png;base64,${candidate}`;
      }
    }

    const payloadCandidates = [
      data?.code,
      data?.qr,
      data?.pairingCode,
      data?.data?.code,
      data?.data?.qr,
      data?.data?.pairingCode,
      data?.response?.code,
      data?.response?.qr,
      data?.response?.pairingCode,
    ];

    for (const candidate of payloadCandidates) {
      if (typeof candidate === 'string' && candidate.length > 3) {
        try {
          // Alguns endpoints retornam o payload do QR (code) em vez de imagem base64.
          return await QRCode.toDataURL(candidate, { margin: 1, width: 320 });
        } catch {
          // Ignora candidato inválido e tenta o próximo.
        }
      }
    }

    return null;
  }


  private async wait(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getStatus() {
    if (!this.isConfigured()) {
      return { configured: false, connected: false, state: 'unknown', instanceName: this.instance };
    }

    try {
      const res = await this.withAuthRetry((headers) => axios.get(
        `${this.apiUrl}/instance/connectionState/${this.instance}`,
        { headers, timeout: 6000 },
      ));
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
      // Apaga a instância existente para garantir estado limpo.
      const oldKey = await this.getInstanceApiKey();
      await this.withAuthRetry(
        (headers) => axios.delete(`${this.apiUrl}/instance/delete/${this.instance}`, { headers, timeout: 8000 }),
        oldKey ?? undefined,
      ).catch((err: any) => {
        this.logger.log(`delete instance: ${err?.response?.status ?? 'n/a'} (pode não existir ainda)`);
      });

      await this.wait(1500);

      // Cria instância fresca com QR habilitado.
      const createRes = await this.withAuthRetry((headers) => axios.post(
        `${this.apiUrl}/instance/create`,
        { instanceName: this.instance, qrcode: true, integration: 'WHATSAPP-BAILEYS' },
        { headers, timeout: 10000 },
      )).catch((err: any) => {
        this.logger.warn(`create instance: ${err?.response?.status ?? 'n/a'} ${JSON.stringify(err?.response?.data ?? err.message)}`);
        return null;
      });

      this.logger.log(`create response: ${JSON.stringify(createRes?.data ?? {}).substring(0, 300)}`);

      const qrFromCreate = await this.extractQrCode(createRes?.data);
      if (qrFromCreate) {
        this.logger.log('QR Code obtido via create');
        return { qrCode: qrFromCreate };
      }

      // Busca apikey da instância recém-criada.
      const instanceApiKey = await this.getInstanceApiKey();

      // Polling: tenta connect E fetchInstances (v2 retorna QR dentro do fetchInstances).
      const maxAttempts = 15;
      const intervalMs = 2000;

      for (let i = 1; i <= maxAttempts; i++) {
        await this.wait(intervalMs);

        // Tenta /instance/connect primeiro.
        try {
          const res = await this.withAuthRetry(
            (headers) => axios.get(`${this.apiUrl}/instance/connect/${this.instance}`, { headers, timeout: 10000 }),
            instanceApiKey ?? undefined,
          );
          const qr = await this.extractQrCode(res.data);
          if (qr) {
            this.logger.log(`QR Code obtido via connect (tentativa ${i})`);
            return { qrCode: qr };
          }
        } catch { /* ignora, tenta fetchInstances */ }

        // Tenta extrair QR do fetchInstances (Evolution API v2).
        try {
          const fetchRes = await this.withAuthRetry(
            (headers) => axios.get(`${this.apiUrl}/instance/fetchInstances`, { headers, timeout: 8000 }),
          );
          const instances: any[] = Array.isArray(fetchRes.data) ? fetchRes.data
            : Array.isArray(fetchRes.data?.response) ? fetchRes.data.response
            : Array.isArray(fetchRes.data?.data) ? fetchRes.data.data : [];

          const current = instances.find((item) => {
            const name = item?.instance?.instanceName ?? item?.instanceName;
            return name === this.instance;
          });

          const raw = JSON.stringify(current ?? {});
          this.logger.log(`fetchInstances (tentativa ${i}/${maxAttempts}): ${raw.substring(0, 300)}`);

          const qr = await this.extractQrCode(current) ?? await this.extractQrCode(current?.qrcode);
          if (qr) {
            this.logger.log(`QR Code obtido via fetchInstances (tentativa ${i})`);
            return { qrCode: qr };
          }
        } catch (err: any) {
          this.logger.warn(`fetchInstances (tentativa ${i}): ${err?.response?.status ?? 'n/a'}`);
        }
      }

      return {
        qrCode: null,
        error: 'QR não gerado após 30 segundos. Verifique a configuração da Evolution API e tente novamente.',
      };
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err.message;
      this.logger.error(`Erro ao obter QR Code: ${msg} — status: ${err?.response?.status} — data: ${JSON.stringify(err?.response?.data)}`);
      return { qrCode: null, error: msg };
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConfigured()) return;
    try {
      await this.withAuthRetry((headers) => axios.delete(
        `${this.apiUrl}/instance/logout/${this.instance}`,
        { headers, timeout: 6000 },
      ));
    } catch (err: any) {
      this.logger.error(`Erro ao desconectar: ${err?.response?.data?.message ?? err.message}`);
    }
  }
}
