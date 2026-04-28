# Oficina360 — Roadmap & Estratégia Comercial

## Pacotes Comerciais

### Comparativo de Funcionalidades

| Funcionalidade                      | START    | PRO      | REDE     |
|-------------------------------------|----------|----------|----------|
| **Preço mensal**                    | R$ 97    | R$ 197   | R$ 397   |
| **Preço anual** (2 meses grátis)    | R$ 970   | R$ 1.970 | R$ 3.970 |
| **Trial gratuito**                  | 14 dias  | 14 dias  | 14 dias  |
| **Usuários**                        | até 3    | até 10   | ilimitado |
| **Ordens de Serviço**               | 50/mês   | ilimitado | ilimitado |
| **Clientes e Veículos**             | ✅       | ✅       | ✅       |
| **Catálogo de Serviços**            | ✅       | ✅       | ✅       |
| **Financeiro Básico**               | ✅       | ✅       | ✅       |
| **Aprovação de Orçamento por Link** | ❌       | ✅       | ✅       |
| **Estoque de Peças**                | ❌       | ✅       | ✅       |
| **Checklist com Fotos**             | ❌       | ✅       | ✅       |
| **Kanban de Pátio**                 | ❌       | ✅       | ✅       |
| **WhatsApp Automático**             | ❌       | ✅       | ✅       |
| **Lembrete de Manutenção**          | ❌       | ✅       | ✅       |
| **Comissão de Mecânicos**           | ❌       | ✅       | ✅       |
| **NPS Automático**                  | ❌       | ✅       | ✅       |
| **DRE Completo**                    | ❌       | ❌       | ✅       |
| **Multi-Unidades**                  | ❌       | ❌       | ✅       |
| **NF-e / NFS-e**                    | ❌       | ❌       | ✅       |
| **Portal do Cliente (PWA)**         | ❌       | ❌       | ✅       |
| **IA Assistiva no Orçamento**       | ❌       | ❌       | ✅       |
| **Suporte**                         | E-mail   | Chat     | Prioritário |

### Posicionamento vs. Mercado

| Concorrente           | Plano Entry   | Plano Top     |
|-----------------------|---------------|---------------|
| **Oficina360**        | **R$ 97**     | **R$ 397**    |
| Onmotor               | R$ 32         | ~R$ 300       |
| Oficina Integrada     | R$ 99         | R$ 299        |
| Oficina Inteligente   | R$ 399        | R$ 599        |
| GestaoAuto            | R$ 250        | —             |

> Posicionamento: **melhor custo-benefício no segmento mid-market**, abaixo dos players premium
> e com mais features que os players de entrada.

---

## Infraestrutura

| Componente | Plataforma | Observações |
|------------|------------|-------------|
| Frontend   | **Vercel** | React + Vite, CDN global, deploy automático |
| Backend    | **Railway** | NestJS + Docker, auto-deploy do GitHub |
| Banco      | **Railway PostgreSQL** | Managed, backups automáticos |
| CI/CD      | **GitHub Actions** | Type-check + build + deploy em push para master |

### Variáveis de Ambiente (Railway)

```env
DATABASE_URL=postgresql://...  # provida automaticamente pelo Railway
JWT_SECRET=<gerar com: openssl rand -hex 32>
JWT_REFRESH_SECRET=<gerar com: openssl rand -hex 32>
FRONTEND_URL=https://oficina360.vercel.app
NODE_ENV=production
PORT=3000
```

### Variáveis de Ambiente (Vercel)

```env
VITE_API_URL=https://oficina360-api.railway.app
```

### Secrets GitHub Actions (Settings > Secrets)

```
RAILWAY_TOKEN         # token da Railway CLI
VITE_API_URL          # URL da API no Railway
VERCEL_TOKEN          # token da Vercel CLI
VERCEL_ORG_ID         # ID da organização no Vercel
VERCEL_PROJECT_ID     # ID do projeto no Vercel
```

---

## Roadmap de Desenvolvimento

### ✅ Fase 0 — Infraestrutura (concluído)
- [x] Multi-tenant SaaS com isolamento por tenant
- [x] Autenticação JWT com refresh token
- [x] Fluxo completo de OS (11 etapas + timeline)
- [x] Estoque com movimentações e quick-add
- [x] Financeiro com lançamentos e summary
- [x] CRM de Clientes e Veículos
- [x] Aprovação de orçamento por link/token
- [x] Serviços com TMO e VH
- [x] Migração SQLite → PostgreSQL
- [x] Deploy: Vercel + Railway + GitHub Actions

---

### 🚀 Sprint 1 — Converter START → PRO (3–4 semanas)
> Meta: funcionalidades que fazem o cliente perceber valor no upgrade imediato

- [ ] **Kanban de Pátio** — board visual por status, projetável em TV
- [ ] **Checklist de Entrada/Saída com Fotos** — proteção jurídica + upsell
- [ ] **WhatsApp Automático por evento da OS** — via Evolution API ou Z-API
  - Orçamento pronto → link de aprovação
  - OS aprovada → "Iniciando os serviços"
  - Pronto para entrega → notificação
  - Pós-venda (7 dias após entrega)

---

### 🚀 Sprint 2 — Consolidar PRO + preparar REDE (3–4 semanas)
> Meta: fidelização e relatórios gerenciais

- [ ] **Lembrete de Manutenção Preventiva** — WhatsApp automático por KM/data
- [ ] **DRE — Demonstrativo de Resultado** — Receita, CMV, Margem, Despesas, EBITDA
- [ ] **Comissão de Mecânicos** — % por serviço executado, relatório por funcionário
- [ ] **NPS Automático** — pesquisa via WhatsApp pós-entrega, dashboard de satisfação

---

### 🚀 Sprint 3 — Expandir para novos segmentos (4–6 semanas)
> Meta: aquisição de novos clientes e ticket PRO

- [ ] **Agendamento Online Público** — link da oficina, cliente agenda 24x7
- [ ] **Portal do Cliente (PWA)** — status em tempo real, histórico, aprovação
- [ ] **App Mobile (React Native ou PWA)** — para mecânicos receberem OS no celular

---

### 🚀 Sprint 4 — Enterprise / Franquias (6–8 semanas)
> Meta: plano REDE, ticket alto, contrato anual

- [ ] **Gestão Multi-Unidades** — login único, estoque compartilhado, relatórios por filial
- [ ] **Emissão NF-e / NFS-e** — integração Focus NF-e ou eNotas
- [ ] **IA Assistiva no Orçamento** — via Claude API: sugestão de serviços por sintoma
- [ ] **Marketplace de Peças** — consulta de estoque e preço em distribuidores parceiros

---

## Checklist de Deploy Inicial

### Backend (Railway)

```bash
# 1. Criar projeto no Railway e adicionar PostgreSQL
# 2. Definir variáveis de ambiente
# 3. Conectar repositório GitHub

# 4. Após deploy: rodar seed
railway run --service oficina360-api npx ts-node prisma/seed.ts
```

### Frontend (Vercel)

```bash
# 1. Importar repositório no Vercel
# 2. Root directory: frontend
# 3. Framework: Vite
# 4. Adicionar variável: VITE_API_URL=https://<sua-api>.railway.app
```

### Após primeiro deploy

```bash
# Rodar migrations (Railway executa automaticamente via CMD)
# Rodar seed manualmente uma vez:
railway run npx ts-node prisma/seed.ts
```
