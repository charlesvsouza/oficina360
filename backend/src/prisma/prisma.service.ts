import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function buildDatabaseUrl(): string {
  const base = process.env.DATABASE_URL ?? '';
  // Append connection pool limits to avoid exhausting free-tier DB connections
  const separator = base.includes('?') ? '&' : '?';
  if (base.includes('connection_limit')) return base;
  return `${base}${separator}connection_limit=5&pool_timeout=20`;
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
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}