import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function buildDatabaseUrl(): string {
  const base = process.env.DATABASE_URL ?? '';
  // Keep pool reasonable for Railway Pro (max_connections ~100)
  const separator = base.includes('?') ? '&' : '?';
  if (base.includes('connection_limit')) return base;
  return `${base}${separator}connection_limit=15&pool_timeout=30&connect_timeout=15`;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: { db: { url: buildDatabaseUrl() } },
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    await this.applyMissingMigrations();
  }

  private async applyMissingMigrations() {
    try {
      await this.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS commission_rates (
          id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "tenantId"   TEXT NOT NULL,
          "userId"     TEXT UNIQUE,
          role         TEXT,
          rate         DOUBLE PRECISION NOT NULL,
          "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await this.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS commissions (
          id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "tenantId"           TEXT NOT NULL,
          "serviceOrderId"     TEXT NOT NULL,
          "serviceOrderItemId" TEXT UNIQUE NOT NULL,
          "userId"             TEXT NOT NULL,
          "baseValue"          DOUBLE PRECISION NOT NULL,
          "commissionPercent"  DOUBLE PRECISION NOT NULL,
          "commissionValue"    DOUBLE PRECISION NOT NULL,
          status               TEXT NOT NULL DEFAULT 'PENDENTE',
          "paidAt"             TIMESTAMPTZ,
          "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt"          TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await this.$executeRawUnsafe(`
        ALTER TABLE "ServiceOrderItem" ADD COLUMN IF NOT EXISTS "assignedUserId" TEXT
      `);
      await this.$executeRawUnsafe(`
        ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS "statusChangedAt" TIMESTAMPTZ
      `);
      await this.$executeRawUnsafe(`
        ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS "partsReserved" BOOLEAN NOT NULL DEFAULT false
      `);
      await this.$executeRawUnsafe(`
        ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS "partsCheckedAt" TIMESTAMPTZ
      `);
      await this.$executeRawUnsafe(`
        ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS "expectedPartsDate" TIMESTAMPTZ
      `);
      await this.$executeRawUnsafe(`
        ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS "purchaseOrderNumber" TEXT
      `);
    } catch (err) {
      console.error('[prisma] applyMissingMigrations error:', err.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}