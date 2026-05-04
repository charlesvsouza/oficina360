-- ============================================
-- SQL para criar tabelas de comissão em produção
-- Execute este script no Railway Dashboard → PostgreSQL → Query Console
-- Data: 03/05/2026
-- ============================================

-- 1. Adicionar coluna assignedUserId em service_order_items (se não existir)
ALTER TABLE "service_order_items"
  ADD COLUMN IF NOT EXISTS "assignedUserId" TEXT;

-- 2. Criar tabela commission_rates
CREATE TABLE IF NOT EXISTS "commission_rates" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT UNIQUE,
  "role" TEXT,
  "rate" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para commission_rates
CREATE INDEX IF NOT EXISTS "commission_rates_tenantId_idx" ON "commission_rates" ("tenantId");
CREATE INDEX IF NOT EXISTS "commission_rates_userId_idx" ON "commission_rates" ("userId");

-- Foreign keys para commission_rates
ALTER TABLE "commission_rates"
  DROP CONSTRAINT IF EXISTS "commission_rates_tenantId_fkey",
  ADD CONSTRAINT "commission_rates_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"(id) ON DELETE CASCADE;

ALTER TABLE "commission_rates"
  DROP CONSTRAINT IF EXISTS "commission_rates_userId_fkey",
  ADD CONSTRAINT "commission_rates_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"(id) ON DELETE SET NULL;

-- 3. Criar tabela commissions
CREATE TABLE IF NOT EXISTS "commissions" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" TEXT NOT NULL,
  "serviceOrderId" TEXT NOT NULL,
  "serviceOrderItemId" TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL,
  "baseValue" DOUBLE PRECISION NOT NULL,
  "commissionPercent" DOUBLE PRECISION NOT NULL,
  "commissionValue" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDENTE',
  "paidAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para commissions
CREATE INDEX IF NOT EXISTS "commissions_tenantId_idx" ON "commissions" ("tenantId");
CREATE INDEX IF NOT EXISTS "commissions_serviceOrderId_idx" ON "commissions" ("serviceOrderId");
CREATE INDEX IF NOT EXISTS "commissions_serviceOrderItemId_idx" ON "commissions" ("serviceOrderItemId");
CREATE INDEX IF NOT EXISTS "commissions_userId_idx" ON "commissions" ("userId");

-- Foreign keys para commissions
ALTER TABLE "commissions"
  DROP CONSTRAINT IF EXISTS "commissions_tenantId_fkey",
  ADD CONSTRAINT "commissions_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"(id) ON DELETE CASCADE;

ALTER TABLE "commissions"
  DROP CONSTRAINT IF EXISTS "commissions_serviceOrderId_fkey",
  ADD CONSTRAINT "commissions_serviceOrderId_fkey"
    FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"(id) ON DELETE CASCADE;

ALTER TABLE "commissions"
  DROP CONSTRAINT IF EXISTS "commissions_serviceOrderItemId_fkey",
  ADD CONSTRAINT "commissions_serviceOrderItemId_fkey"
    FOREIGN KEY ("serviceOrderItemId") REFERENCES "service_order_items"(id) ON DELETE CASCADE;

ALTER TABLE "commissions"
  DROP CONSTRAINT IF EXISTS "commissions_userId_fkey",
  ADD CONSTRAINT "commissions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"(id) ON DELETE CASCADE;

-- 4. Adicionar foreign key de assignedUserId em service_order_items
ALTER TABLE "service_order_items"
  DROP CONSTRAINT IF EXISTS "service_order_items_assignedUserId_fkey",
  ADD CONSTRAINT "service_order_items_assignedUserId_fkey"
    FOREIGN KEY ("assignedUserId") REFERENCES "users"(id) ON DELETE SET NULL;

-- ============================================
-- Verificação (opcional - execute separadamente)
-- ============================================
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   AND table_name IN ('commission_rates', 'commissions');
--
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'service_order_items'
--   AND column_name = 'assignedUserId';
