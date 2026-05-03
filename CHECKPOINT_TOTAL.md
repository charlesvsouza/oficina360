# CHECKPOINT TOTAL — SigmaAuto (03/05/2026)

## Visão Geral do Projeto

**Produto:** SigmaAuto — SaaS multi-tenant para gestão de oficinas mecânicas  
**Domínio:** [sigmaauto.com.br](https://sigmaauto.com.br)  
**Repositório:** `charlesvsouza/sygmaauto` — branch `master`  
**Status:** LIVE em produção  

| Componente | Plataforma | URL |
|---|---|---|
| Frontend | Vercel | https://sigmaauto.com.br |
| Backend API | Railway | https://sygmaauto-api-production.up.railway.app |
| Banco de Dados | Railway PostgreSQL | provisionado automaticamente |
| CI/CD | GitHub Actions | push → master → deploy automático |

---

## Stack Tecnológica

**Backend**
- NestJS + TypeScript
- Prisma ORM + PostgreSQL
- JWT Auth (access + refresh token)
- Multi-tenant por `tenantId` em todos os recursos

**Frontend**
- React 18 + Vite + TypeScript
- TailwindCSS + Framer Motion
- Zustand (state management com persist)
- React Router v6
- Lucide Icons

**Pagamentos**
- Mercado Pago Checkout Pro (modo produção)

---

## Módulos Implementados

| Módulo | Status | Descrição |
|---|---|---|
| Auth | ✅ | Login, registro, JWT, refresh token, roles |
| Tenants | ✅ | Multi-tenant, configurações da oficina, dados fiscais |
| Usuários | ✅ | CRUD, roles (MASTER/ADMIN/GERENTE/SECRETARIA/MECANICO/FINANCEIRO) |
| Clientes | ✅ | CRM completo, histórico de OS |
| Veículos | ✅ | Cadastro por cliente, placa, modelo, ano |
| Ordens de Serviço | ✅ | Ciclo completo: criação → diagnóstico → aprovação → execução → entrega |
| Serviços | ✅ | Catálogo com preço, TMO, categoria |
| Estoque | ✅ | Peças, movimentações, quick-add na OS |
| Financeiro | ✅ | Lançamentos, receitas/despesas, summary mensal |
| Assinaturas | ✅ | Planos START/PRO/REDE, checkout Mercado Pago, upgrade sem downgrade |
| Super Admin | ✅ | Painel de gestão de todos os tenants |
| Onboarding | ✅ | Fluxo de ativação por token |
| Notificações | ✅ (base) | Estrutura de notificações implementada |
| Kanban de Pátio | ✅ | Board visual por status com modo TV fullscreen |
| Checklist Entrada/Saída | ✅ | 15 áreas, 5 condições, fotos comprimidas, nível de combustível |
| WhatsApp Automático | ✅ | 5 templates por evento de OS via Evolution API |
| WhatsApp Admin UI | ✅ | Tela `/whatsapp` com status, QR Code e desconexão — **ONLINE** |

---

## Fluxo de Navegação

```
Landing Page (/)
    ↓  [Acessar sistema / Entrar]
Splash Screen (/splash)   ← NOVO: carregamento fictício ~4,5s, visual alinhado à landing
    ↓  [automático]
Login (/login)
    ↓  [autenticação JWT]
Welcome Page (/welcome)   ← tela de boas-vindas com tagline e destaques do sistema
    ↓  [automático 60s ou clique]
Dashboard (/dashboard)
```

**Rotas públicas:** `/`, `/planos`, `/login`, `/register`, `/forgot-password`  
**Rotas protegidas:** `/dashboard`, `/customers`, `/vehicles`, `/service-orders`, `/services`, `/inventory`, `/financial`, `/settings`, `/users`  
**Rotas Super Admin:** `/admin/login`, `/admin`

---

## Planos Comerciais

| | START | PRO | REDE |
|---|---|---|---|
| **Preço** | R$ 149/mês | R$ 299/mês | Sob consulta |
| **Usuários** | até 3 | até 10 | ilimitado |
| **OS/mês** | 50 | ilimitado | ilimitado |
| **Financeiro** | ✅ | ✅ | ✅ |
| **Estoque** | básico | ✅ | ✅ |
| **Multi-unidades** | ❌ | ❌ | ✅ |

**Hierarquia de upgrade:** START → PRO → REDE  
**Downgrade:** apenas disponível após vencimento do plano atual (bloqueado na UI)

---

## Roles e Permissões

| Role | Descrição |
|---|---|
| MASTER | Proprietário. Acesso total. Único por tenant. Gerencia assinatura. |
| ADMIN | Gerência operacional. Pode convidar PRODUTIVO/FINANCEIRO. |
| GERENTE | Gerência operacional sem acesso financeiro completo. |
| SECRETARIA | Atendimento, criação de OS, cadastro de clientes. |
| MECANICO | Execução técnica de OS. Diagnóstico, fotos, itens. |
| FINANCEIRO | Fechamento, pagamentos, relatórios financeiros. |

---

## SEO e Identidade

- **Título da página:** `Sistema para Oficina Mecânica | ERP Automotivo SigmaAuto`
- **sitemap.xml:** `frontend/public/sitemap.xml` — rotas públicas indexadas
- **robots.txt:** `frontend/public/robots.txt` — bloqueia rotas internas
- **Domínio:** `sigmaauto.com.br`

---

## Commits Recentes (git log)

```
eae6701 fix(backend): add axios dependency for WhatsApp Evolution API integration
8fe69fe feat(whatsapp): WhatsApp Automático via Evolution API
1d79fb3 feat(checklist): Checklist de Entrada/Saída com fotos
ac61ac0 feat(kanban): Kanban de Pátio com modo TV
4247027 feat: block plan downgrade in settings, only allow upgrade until current plan expires
```

---

## Arquivos-Chave

| Arquivo | Descrição |
|---|---|
| `frontend/src/App.tsx` | Roteamento completo da aplicação |
| `frontend/src/pages/LandingPage.tsx` | Página comercial pública |
| `frontend/src/pages/InitialSplash.tsx` | Tela de loading entre landing e login |
| `frontend/src/pages/WelcomePage.tsx` | Boas-vindas pós-login |
| `frontend/src/pages/DashboardPage.tsx` | Painel principal |
| `frontend/src/pages/SettingsPage.tsx` | Configurações + assinatura + usuários |
| `frontend/src/components/Layout.tsx` | Sidebar + topbar da área logada |
| `frontend/src/store/authStore.ts` | Estado de autenticação (Zustand) |
| `frontend/src/api/client.ts` | Chamadas à API (Axios) |
| `backend/src/app.module.ts` | Módulo raiz NestJS |
| `backend/prisma/schema.prisma` | Schema do banco de dados |
| `.github/workflows/deploy.yml` | CI/CD GitHub Actions |
| `frontend/public/sitemap.xml` | Sitemap para SEO |
| `frontend/public/robots.txt` | Diretivas para crawlers |

---

## Variáveis de Ambiente

### Railway (Backend)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=<openssl rand -hex 32>
JWT_REFRESH_SECRET=<openssl rand -hex 32>
FRONTEND_URL=https://sigmaauto.com.br
NODE_ENV=production
PORT=3000
MERCADOPAGO_ACCESS_TOKEN=...
EVOLUTION_API_URL=https://evolution-api-r2-production.up.railway.app
EVOLUTION_API_KEY=SygmaEvolution@2026!
EVOLUTION_INSTANCE=sygmaauto
```
CHECKOUT_SUCCESS_URL=https://sigmaauto.com.br/settings?checkout=success
CHECKOUT_CANCEL_URL=https://sigmaauto.com.br/settings?checkout=cancel
BACKEND_PUBLIC_URL=https://sygmaauto-api-production.up.railway.app
```

### Vercel (Frontend)
```env
VITE_API_URL=https://sygmaauto-api-production.up.railway.app
VITE_APP_URL=https://sigmaauto.com.br
```

### GitHub Actions (Secrets)
```
RAILWAY_TOKEN
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
VITE_API_URL
```

---

## Credencial Super Admin
```
Email: charlesvsouza@hotmail.com
Rota:  /admin/login
```

---

## Próximos Passos (Roadmap Priorizado)

### ✅ Sprint 1 — Concluído (02/05/2026)
1. ✅ **Kanban de Pátio** — board visual por status com modo TV
2. ✅ **Checklist de entrada/saída com fotos** — 15 áreas, fotos comprimidas, nível combustível
3. ✅ **WhatsApp automático por evento de OS** — 5 templates via Evolution API
4. ✅ **Tela de configuração WhatsApp** — `/whatsapp` com QR Code e status — **ONLINE**

### 🔄 Sprint 2 — Em Andamento (iniciado em 03/05/2026)

> **Pré-requisito validado:** WhatsApp com estado `open` confirmado + teste de envio bem-sucedido para 5521979330093 em 03/05/2026.

5. ✅ **Comissão de mecânicos** — backend completo implementado e deployado
   - `CommissionRate` + `Commission` models no schema Prisma
   - `assignedUserId` em `ServiceOrderItem`
   - `CommissionsModule/Service/Controller` com cálculo automático ao faturar OS
   - **⚠️ BLOQUEIO:** tabelas `commission_rates` e `commissions` não existem em produção
6. ⏸ **Seed de dados demo** — 48 OS, 10 executores, comissões — **bloqueado pelo item acima**
7. **Lembrete de manutenção preventiva** — WhatsApp automático por KM/data
8. **DRE — Demonstrativo de Resultado** — Receita, CMV, Margem, EBITDA
9. **NPS Automático** — pesquisa pós-entrega, dashboard de satisfação

---

## ⚠️ Bloqueio Crítico — Tabelas de Comissão Ausentes em Produção

**Sintoma:** `POST /management/seed-demo` retorna erro:
```
The table `public.commission_rates` does not exist in the current database.
```

**Tentativas de fix (03/05/2026) — nenhuma funcionou:**

| # | Abordagem | Arquivo | Resultado |
|---|---|---|---|
| 1 | `SEED_DEMO=true` env var no Railway | `release.js` | Seed não disparou |
| 2 | Endpoint HTTP `POST /management/seed-demo` | `management.controller.ts` | 500 — tabela ausente |
| 3 | Cache bust Dockerfile + `prisma generate` forçado | `Dockerfile` | Tabelas ainda ausentes |
| 4 | `ensureMissingTables()` raw SQL no `release.js` | `release.js` | Tabelas ainda ausentes |
| 5 | `applyMissingMigrations()` no `PrismaService.onModuleInit` | `prisma.service.ts` | Tabelas ainda ausentes |

**Causa raiz provável:** `releaseCommand` do Railway pode não estar executando, ou o `prisma db push` usa schema cacheado sem os novos modelos.

**Solução definitiva pendente:** executar o SQL diretamente no Railway Dashboard → PostgreSQL → Query console:
```sql
CREATE TABLE IF NOT EXISTS commission_rates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" TEXT NOT NULL, "userId" TEXT UNIQUE, role TEXT,
  rate DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS commissions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" TEXT NOT NULL, "serviceOrderId" TEXT NOT NULL,
  "serviceOrderItemId" TEXT UNIQUE NOT NULL, "userId" TEXT NOT NULL,
  "baseValue" DOUBLE PRECISION NOT NULL, "commissionPercent" DOUBLE PRECISION NOT NULL,
  "commissionValue" DOUBLE PRECISION NOT NULL, status TEXT NOT NULL DEFAULT 'PENDENTE',
  "paidAt" TIMESTAMPTZ, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "ServiceOrderItem" ADD COLUMN IF NOT EXISTS "assignedUserId" TEXT;
```
Após executar o SQL, chamar: `POST /management/seed-demo/e3c1d0fb-aaf2-46c4-b84a-263cd6137734` com header `x-seed-key: sygma-seed-2026`
