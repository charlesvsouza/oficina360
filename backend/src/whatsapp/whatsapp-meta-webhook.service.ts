import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class WhatsappMetaWebhookService {
  private readonly logger = new Logger(WhatsappMetaWebhookService.name);
  private readonly processedEventIds = new Map<string, number>();
  private readonly eventTtlMs = 6 * 60 * 60 * 1000;

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return this.providerMode === 'META_CLOUD';
  }

  validateWebhookChallenge(mode?: string, token?: string, challenge?: string): string | null {
    if (!this.isEnabled()) return null;
    if (!mode || !token || !challenge) return null;
    if (mode !== 'subscribe') return null;
    if (token !== this.verifyToken) return null;
    return challenge;
  }

  isValidSignature(signatureHeader: string | undefined, rawBody: Buffer | undefined): boolean {
    if (!this.isEnabled()) return false;
    if (!this.appSecret || !signatureHeader || !rawBody) return false;
    if (!signatureHeader.startsWith('sha256=')) return false;

    const received = signatureHeader.slice('sha256='.length);
    const expected = createHmac('sha256', this.appSecret).update(rawBody).digest('hex');

    const expectedBuffer = Buffer.from(expected, 'hex');
    const receivedBuffer = Buffer.from(received, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length) return false;

    return timingSafeEqual(expectedBuffer, receivedBuffer);
  }

  processInboundEvent(payload: any): { processed: number; duplicates: number } {
    this.cleanupOldEvents();

    const ids = this.extractEventIds(payload);
    if (ids.length === 0) {
      const fallbackId = this.buildFallbackEventId(payload);
      ids.push(fallbackId);
    }

    let processed = 0;
    let duplicates = 0;

    for (const id of ids) {
      if (this.processedEventIds.has(id)) {
        duplicates++;
        continue;
      }

      this.processedEventIds.set(id, Date.now());
      processed++;
    }

    this.logger.log(
      `Meta webhook recebido: provider=${this.providerMode} processed=${processed} duplicates=${duplicates}`,
    );

    return { processed, duplicates };
  }

  private get providerMode(): string {
    return (this.config.get<string>('WHATSAPP_PROVIDER') ?? 'EVOLUTION').trim().toUpperCase();
  }

  private get verifyToken(): string {
    return this.config.get<string>('META_WHATSAPP_VERIFY_TOKEN') ?? '';
  }

  private get appSecret(): string {
    return this.config.get<string>('META_WHATSAPP_APP_SECRET') ?? '';
  }

  private cleanupOldEvents(): void {
    const now = Date.now();
    for (const [id, ts] of this.processedEventIds.entries()) {
      if (now - ts > this.eventTtlMs) {
        this.processedEventIds.delete(id);
      }
    }
  }

  private extractEventIds(payload: any): string[] {
    const ids = new Set<string>();

    const entries = Array.isArray(payload?.entry) ? payload.entry : [];
    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = change?.value ?? {};

        const statuses = Array.isArray(value?.statuses) ? value.statuses : [];
        for (const status of statuses) {
          if (status?.id) {
            ids.add(`status:${status.id}`);
          }
        }

        const messages = Array.isArray(value?.messages) ? value.messages : [];
        for (const message of messages) {
          if (message?.id) {
            ids.add(`message:${message.id}`);
          }
        }
      }
    }

    return Array.from(ids);
  }

  private buildFallbackEventId(payload: any): string {
    const raw = JSON.stringify(payload ?? {});
    const hash = createHmac('sha256', 'meta-webhook-fallback').update(raw).digest('hex');
    return `fallback:${hash}`;
  }
}
