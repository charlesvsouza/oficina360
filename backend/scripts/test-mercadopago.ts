type MpUser = {
  id: number;
  nickname?: string;
  email?: string;
  site_id?: string;
};

type MpPreference = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Variavel obrigatoria ausente: ${name}`);
  }
  return value.trim();
}

function optionalEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

async function mpRequest<T>(
  accessToken: string,
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Mercado Pago ${response.status}: ${errorBody}`);
  }

  return (await response.json()) as T;
}

async function main() {
  const accessToken = requiredEnv('MP_ACCESS_TOKEN');
  const frontendUrl = optionalEnv('FRONTEND_URL', 'https://sigmaauto.com.br').replace(/\/+$/, '');
  const backendPublicUrl = optionalEnv('BACKEND_PUBLIC_URL', '');
  const webhookUrl = backendPublicUrl
    ? `${backendPublicUrl.replace(/\/+$/, '')}/webhooks/mercadopago`
    : undefined;

  console.log('Iniciando teste de integracao Mercado Pago...');

  const me = await mpRequest<MpUser>(accessToken, 'https://api.mercadopago.com/users/me', {
    method: 'GET',
  });
  console.log(`Token valido para usuario MP id=${me.id} nickname=${me.nickname || '-'} site=${me.site_id || '-'}`);

  const externalReference = `smoke:${Date.now()}`;
  const payload: Record<string, unknown> = {
    items: [
      {
        title: 'Sigma Auto Smoke Test',
        quantity: 1,
        unit_price: 1,
        currency_id: 'BRL',
        description: 'Teste de integracao Mercado Pago sem cobranca real',
      },
    ],
    external_reference: externalReference,
    metadata: {
      source: 'backend-smoke-test',
      externalReference,
    },
    back_urls: {
      success: `${frontendUrl}/settings?checkout=success`,
      pending: `${frontendUrl}/settings?checkout=pending`,
      failure: `${frontendUrl}/settings?checkout=failure`,
    },
    auto_return: 'approved',
  };

  if (webhookUrl) {
    payload.notification_url = webhookUrl;
  }

  const preference = await mpRequest<MpPreference>(
    accessToken,
    'https://api.mercadopago.com/checkout/preferences',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

  if (!preference.id) {
    throw new Error('Mercado Pago nao retornou id da preferencia');
  }

  console.log(`Preferencia criada com sucesso: ${preference.id}`);
  console.log(`Checkout URL: ${preference.init_point || preference.sandbox_init_point || '-'}`);
  console.log('Teste concluido: API de pagamentos respondeu corretamente.');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Falha no teste Mercado Pago: ${message}`);
  process.exit(1);
});
