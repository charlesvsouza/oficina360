# Checkpoint Oficina360 — Para Copilot

**Data:** 2026-05-01  
**Branch:** master  
**Último commit:** `4bee7f0 feat(users): adiciona roles GERENTE, SECRETARIA, MECANICO na UsersPage`

---

## Estado Atual do Sistema

### Stack
- **Frontend:** React + Vite + TypeScript + Tailwind + Framer Motion → Vercel
- **Backend:** NestJS + Prisma + PostgreSQL → Railway (Docker)
- **Auth:** JWT com refresh token, multi-tenant por `tenantId`

---

## Roles de Usuário (UserRole enum no Prisma)

| Role | Descrição |
|---|---|
| `MASTER` | Proprietário — acesso total, 1 por tenant |
| `ADMIN` | Administrador — gerencia equipe e configurações |
| `GERENTE` | Gerência operacional — aprova OSs, muda status |
| `FINANCEIRO` | Fechamento e pagamentos |
| `SECRETARIA` | Recepção — abre OS, cadastra clientes/veículos |
| `MECANICO` | Técnico — executa OS, adiciona peças e serviços |
| `PRODUTIVO` | Legado — equivalente a MECANICO (manter para compatibilidade) |

**Migration pendente no banco (já existe o SQL em `backend/prisma/migrations/20260501120000_add_roles_gerente_secretaria_mecanico/migration.sql`):**
```sql
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'GERENTE';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SECRETARIA';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MECANICO';
```

---

## Matriz de Permissões (ServiceOrdersPage)

| Ação | MASTER | ADMIN | GERENTE | FINANCEIRO | SECRETARIA | MECANICO |
|---|---|---|---|---|---|---|
| Alterar status via badge (dropdown) | ✅ | ✅ | ✅ | — | — | — |
| Adicionar/remover peças | ✅ | ✅ | — | — | — | ✅ |
| Alterar qtd / remover itens | ✅ | ✅ | — | — | — | ✅ |
| Avançar status (botões normais) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Deletar OS | ✅ | — | — | — | — | — |
| Gerenciar usuários | ✅ | ✅ | — | — | — | — |
| Configurações da oficina | ✅ | — | — | — | — | — |

---

## Funcionalidades Implementadas (prontas)

### Ordens de Serviço
- [x] Criar OS / Orçamento (com tipo: ORCAMENTO ou ORDEM_SERVICO)
- [x] Múltiplas OSs por veículo, aviso de OSs abertas ao criar
- [x] Visualização e impressão com layout CAOA (print preview em iframe)
- [x] Importar orçamento via PDF (Google Gemini 2.5 Flash OCR)
- [x] Alterar status via badge clicável (dropdown — ADMIN/MASTER/GERENTE)
- [x] Botões de avanço de status respeitam fluxo
- [x] OS REPROVADA: estorno de estoque, bloqueio de edição, banner "Criar OS de Diagnóstico"
- [x] OS REPROVADA/CANCELADA: ADMIN/MASTER podem reabrir via `adminOverride`
- [x] Bloqueio de add/remove itens em OS fechadas (frontend + backend)
- [x] Sync de preços do catálogo
- [x] Exclusão de OS (MASTER only, com confirmação por número)

### Configurações (SettingsPage)
- [x] Cadastro da oficina com busca CNPJ na Receita Federal
- [x] `laborHourlyRate` e `diagnosticHours` configuráveis
- [x] Lista de equipe com badges de role (view em SettingsPage)
- [x] UI completa de add membro inline (botão "Adicionar Membro" em SettingsPage) ← pode simplificar para só link para /users

### Gestão de Usuários (UsersPage — `/users`)
- [x] Tabela com busca por nome/email
- [x] Modal "Novo Usuário" com layout 2 colunas (igual lexgen-studio-v2)
- [x] Roles: ADMIN, GERENTE, FINANCEIRO, SECRETARIA, MECANICO no dropdown
- [x] Badges coloridos por role na tabela
- [x] Avatar colorido por role
- [x] Editar usuário (role, ativo/inativo)
- [x] Excluir usuário (exceto MASTER)
- [ ] Proteção por role: só ADMIN/MASTER deveriam ver/usar esta página (falta guardar no frontend)
- [ ] Mostrar badge "Você" para o usuário logado

---

## Pendências / Melhorias Identificadas

### ALTA PRIORIDADE

**1. Proteger a rota `/users` por role no frontend**
```tsx
// Em UsersPage.tsx, no início do componente:
const { user } = useAuthStore();
if (!['MASTER', 'ADMIN'].includes(user?.role ?? '')) {
  return <Navigate to="/" />;
}
```

**2. Ocultar link "Usuários" na sidebar para roles sem acesso**
```tsx
// Em Layout.tsx, filtrar navItems:
// O item { to: '/users', icon: UserCheck, label: 'Usuários' }
// só deve aparecer para MASTER e ADMIN
```

**3. Simplificar seção "Equipe" no SettingsPage**
A SettingsPage tem uma seção "Sua Equipe" com UI completa (add/edit/delete).
Agora que UsersPage existe, o ideal é:
- Manter a lista de usuários na SettingsPage (read-only)
- Adicionar botão "Gerenciar Equipe →" que leva para `/users`
- Remover o modal de add/edit duplicado do SettingsPage

**4. Verificar migration no banco Railway**
O campo `diagnosticHours` foi adicionado ao schema mas `prisma db push` (via Dockerfile CMD) deve ter rodado. Confirmar que a coluna existe:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'tenants' AND column_name = 'diagnosticHours';
```

### MÉDIA PRIORIDADE

**5. Dashboard com métricas reais**
- OSs abertas, faturamento do mês, peças em estoque baixo
- Gráfico de OSs por status

**6. Módulo de NF de entrada de peças**
- Upload de XML NF-e ou PDF
- Parser para criar movimentações de estoque automaticamente
- Campos: fornecedor, CNPJ, itens (código, descrição, qtd, valor unitário)

**7. Notificações in-app**
- Badge de alerta para peças abaixo do estoque mínimo
- Alerta de OSs sem movimentação há X dias

---

## Arquivos Principais

| Arquivo | Descrição |
|---|---|
| `backend/prisma/schema.prisma` | Schema completo (Tenant, User, ServiceOrder, Part, etc.) |
| `backend/src/service-orders/service-orders.service.ts` | Regras de negócio das OSs |
| `backend/src/service-orders/service-orders.controller.ts` | Endpoints REST |
| `frontend/src/pages/ServiceOrdersPage.tsx` | Tela principal de OSs (~1700 linhas) |
| `frontend/src/pages/UsersPage.tsx` | Gestão de usuários (estilo lexgen) |
| `frontend/src/pages/SettingsPage.tsx` | Configurações da oficina |
| `frontend/src/api/client.ts` | Todos os endpoints do frontend |
| `frontend/src/store/authStore.ts` | Estado de auth (user: { userId, role, tenantId }) |

---

## Padrões de Código

- **Backend:** `@Roles('ADMIN')` no controller; RolesGuard permite MASTER em qualquer rota
- **Frontend:** `canManageStock = ['MASTER','ADMIN','MECANICO','PRODUTIVO'].includes(role)`
- **Estilos:** Tailwind + classes globais `.btn`, `.btn-primary`, `.input`, `.card`, `.badge` em `index.css`
- **Cores primárias:** `primary-600 = #2563eb` (azul), sidebar `midnight-950`
- **Modais:** Framer Motion `scale: 0.95 → 1`, `backdrop-blur-sm`, `rounded-[3rem]`
