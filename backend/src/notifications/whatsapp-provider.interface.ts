export interface WhatsappProvider {
  readonly name: string;
  isConfigured(): boolean;
  sendText(to: string, message: string): Promise<void>;
}
