# WhatsApp — Evolution API: Diagnóstico e Configuração

## Situação atual (Atualizado em 03/05/2026)

O backend (Sygma Auto) está 100% funcional e resiliente. O problema persistente de "connecting" infinito foi identificado como uma falha de comunicação entre o servidor da Evolution API e o WhatsApp, não relacionada a recursos de hardware.

### O que foi corrigido no Backend:
- **Reset Agressivo**: O sistema agora realiza um `DELETE` seguido de um `CREATE` toda vez que a instância é detectada em estado não-conectado (`close` ou `connecting` travado).
- **Sincronização de Webhook**: O backend força a atualização do webhook e da flag `base64: true` em cada tentativa, garantindo a recepção do QR Code.
- **Timeouts Otimizados**: Aumento nos tempos de espera para acomodar a lentidão de resposta da API.

---

## Diagnóstico Técnico

### 1. Recursos de Hardware (Railway Metrics)
- **RAM Utilizada**: ~165 MB
- **Limite Disponível**: 24 GB
- **Conclusão**: O problema **NÃO é falta de memória**. O servidor tem recursos de sobra.

### 2. Sintoma: Loop de "Connecting"
`GET /instance/connect/{instance}` retorna `{"count":0}` e o webhook envia apenas eventos de `state: "connecting"` com `statusReason: 200`.

### 3. Causa Raiz Provável
- **Incompatibilidade de Versão**: A imagem da Evolution API pode estar usando uma versão do Baileys desatualizada em relação ao protocolo atual do WhatsApp.
- **Bloqueio de IP (Rate Limit)**: O WhatsApp bloqueou temporariamente o IP do servidor Railway devido a múltiplas tentativas de conexão/reconexão.

---

## Plano de Ação para Resolução Definitiva

### Passo 1: Atualização da Imagem
No Railway, acesse as configurações do serviço da **Evolution API**:
- Certifique-se de usar a tag `latest` para a imagem Docker.
- Verifique a variável de ambiente `CONFIG_SESSION_PHONE_VERSION`. Tente atualizar para a versão mais recente (ex: `2.3000.x` ou superior).

### Passo 2: Cooldown (Essencial)
- **Não tente gerar o QR Code pelos próximos 60 minutos.**
- O WhatsApp aplica bloqueios temporários que são renovados a cada nova tentativa falha. O descanso de 1 hora é necessário para "limpar" o IP.

### Passo 3: Reinicialização Limpa
Após o período de cooldown e a atualização da imagem:
1. Faça um **Restart** no serviço da Evolution API no Railway.
2. Acesse a tela de WhatsApp no sistema e solicite um novo QR Code.
3. O sistema fará o `DELETE` e o `CREATE` automaticamente, gerando uma sessão virgem.

---

## Fluxo Técnico Atualizado

```
Frontend → GET /whatsapp/qrcode
    ↓
Backend verifica status da instância
    ↓
Status !== 'open'? → DELETE instance → CREATE instance fresca (com webhook + base64)
    ↓
Backend inicia polling (20x) chamando /instance/connect/{instance}
    ↓
Evolution API gera QR → Dispara Webhook OU Retorna no polling
    ↓
Backend armazena QR em memória (qrStore)
    ↓
Frontend exibe QR Code
```

---

## Variáveis de Ambiente Críticas (Backend Railway)

| Variável | Valor Atual | Status |
|---|---|---|
| `EVOLUTION_API_URL` | `https://...` | OK |
| `EVOLUTION_API_KEY` | `...` | OK |
| `BACKEND_PUBLIC_URL` | `https://sygmaauto-api-production.up.railway.app` | OK |
