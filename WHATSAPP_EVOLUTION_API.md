# WhatsApp — Evolution API: Diagnóstico e Configuração

## Situação atual

O backend (Sygma Auto) está correto e pronto para receber o QR code via webhook.
O problema principal é o servidor da Evolution API que não consegue iniciar a conexão com os servidores do WhatsApp. Além disso, identificamos que o backend não atualizava o webhook para instâncias já existentes, o que foi corrigido em 03/05/2026.
O backend agora força a configuração do webhook e ativa a flag `base64: true` para garantir o recebimento do QR Code.

---

## Sintoma

`GET /instance/connect/{instance}` retorna sempre `{"count":0}` e nenhum evento webhook é disparado, mesmo após 40 segundos de polling.

No `fetchInstances`, a instância aparece com `connectionStatus: "close"` e nunca transita para `"connecting"`.

---

## Causa raiz

O processo Baileys dentro da Evolution API não consegue estabelecer conexão com os servidores do WhatsApp. Possíveis causas:

| Causa | Como verificar |
|---|---|
| RAM insuficiente no servidor | Railway → serviço Evolution API → Metrics → Memory |
| IP bloqueado pelo WhatsApp (rate-limit) | Ocorre após muitos ciclos de create/delete |
| Falha de rede (Evolution API não alcança WhatsApp) | Logs da Evolution API |
| Bug na versão da Evolution API em uso | Verificar versão e atualizar |

---

## Como resolver

### 1. Verificar logs da Evolution API

Acesse no Railway o **serviço da Evolution API** (não o backend Sygma) → aba **Logs** e procure por:

```
Error: Connection Failure
Timed out after
ECONNREFUSED
ENOTFOUND
out of memory
QR code timeout
```

### 2. Aguardar cooldown do IP

Após muitos ciclos de connect/disconnect, o WhatsApp bloqueia temporariamente o IP.
**Aguarde 30–60 minutos sem tentar gerar QR** e tente novamente.

### 3. Reiniciar a Evolution API

No Railway → serviço Evolution API → **Restart**. Isso limpa processos Baileys travados.

### 4. Verificar memória

O Baileys precisa de pelo menos **300–500 MB de RAM livre**. Se o plano do Railway estiver no limite, aumente o tier ou reinicie para liberar memória.

### 5. Verificar versão da Evolution API

A versão em uso retorna o seguinte formato em `fetchInstances`:

```json
{
  "name": "sygmaauto",
  "connectionStatus": "close",
  "token": "XXXX-XXXX-XXXX",
  "integration": "WHATSAPP-BAILEYS"
}
```

Se a versão tiver bugs conhecidos, considere atualizar para a versão estável mais recente.

---

## Fluxo correto após o servidor corrigido

Quando a Evolution API conseguir conectar ao WhatsApp, o fluxo será:

```
Frontend → GET /whatsapp/qrcode
    ↓
Backend verifica instância existente (não recria desnecessariamente)
    ↓
Backend chama GET /instance/connect/{instance}
    ↓
Evolution API conecta ao WhatsApp (Baileys)
    ↓
Evolution API dispara POST para https://sygmaauto-api-production.up.railway.app/whatsapp/qr-webhook
    ↓
Backend armazena QR em memória
    ↓
Backend retorna QR para o frontend
    ↓
Frontend exibe QR Code para o usuário escanear
```

---

## Variáveis de ambiente necessárias (backend Railway)

| Variável | Valor | Descrição |
|---|---|---|
| `EVOLUTION_API_URL` | `https://...` | URL do servidor da Evolution API |
| `EVOLUTION_API_KEY` | `...` | Global API key da Evolution API |
| `EVOLUTION_INSTANCE` | `sygmaauto` | Nome da instância |
| `BACKEND_PUBLIC_URL` | `https://sygmaauto-api-production.up.railway.app` | URL pública do backend (para webhook) |

---

## Endpoint de webhook (já implementado)

```
POST /whatsapp/qr-webhook
```

- Sem autenticação (público — necessário para a Evolution API chamar)
- Recebe o payload de evento `QRCODE_UPDATED` da Evolution API
- Armazena o QR em memória para ser servido via `GET /whatsapp/qrcode`

### Payload esperado da Evolution API

```json
{
  "event": "QRCODE_UPDATED",
  "instance": "sygmaauto",
  "data": {
    "qrcode": {
      "base64": "data:image/png;base64,...",
      "count": 1
    }
  }
}
```

---

## Teste manual do webhook

Para verificar se o endpoint de webhook está acessível, execute:

```bash
curl -X POST https://sygmaauto-api-production.up.railway.app/whatsapp/qr-webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"QRCODE_UPDATED","instance":"sygmaauto","data":{"qrcode":{"base64":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==","count":1}}}'
```

Resposta esperada: `{"received":true}`

Se retornar 200, o webhook está funcionando. O QR ficará armazenado em memória por até 2 minutos.
