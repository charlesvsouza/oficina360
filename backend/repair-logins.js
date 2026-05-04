/**
 * repair-logins.js
 *
 * Repara credenciais sem limpar dados:
 * - Super Admin: atualiza senha do primeiro ativo encontrado ou faz upsert pelo email informado
 * - MASTER: atualiza senha do MASTER do tenant alvo ou cria um novo se não existir
 *
 * Variáveis opcionais:
 *   REPAIR_SUPERADMIN_EMAIL
 *   REPAIR_SUPERADMIN_NAME
 *   REPAIR_SUPERADMIN_PASSWORD
 *   REPAIR_MASTER_EMAIL
 *   REPAIR_MASTER_NAME
 *   REPAIR_MASTER_PASSWORD
 *   REPAIR_TENANT_ID
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

function normalizeEmail(value, fallback) {
  return String(value || fallback || '').toLowerCase().trim();
}

async function repairSuperAdmin() {
  const existing = await prisma.superAdmin.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });

  const email = normalizeEmail(
    process.env.REPAIR_SUPERADMIN_EMAIL,
    existing?.email || 'charlesvsouza@sigmaauto.com.br',
  );
  const name = process.env.REPAIR_SUPERADMIN_NAME || existing?.name || 'Charles Souza';
  const password = process.env.REPAIR_SUPERADMIN_PASSWORD || '2021Bl08Ap303*a';
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.superAdmin.upsert({
    where: { email },
    update: { name, passwordHash, isActive: true },
    create: { email, name, passwordHash, isActive: true },
  });

  if (existing && existing.email !== email) {
    await prisma.superAdmin.update({
      where: { id: existing.id },
      data: { isActive: false },
    }).catch(() => null);
  }

  return { email: admin.email, name };
}

async function resolveTargetTenant() {
  const requestedTenantId = process.env.REPAIR_TENANT_ID?.trim();
  if (requestedTenantId) {
    const tenant = await prisma.tenant.findUnique({ where: { id: requestedTenantId } });
    if (tenant) return tenant;
  }

  const activeTenant = await prisma.tenant.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
  });
  if (activeTenant) return activeTenant;

  return prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } });
}

async function repairMaster() {
  const tenant = await resolveTargetTenant();
  if (!tenant) {
    throw new Error('Nenhum tenant encontrado para reparar o login MASTER');
  }

  const existingMaster = await prisma.user.findFirst({
    where: { tenantId: tenant.id, role: 'MASTER' },
    orderBy: { createdAt: 'asc' },
  });

  const email = normalizeEmail(
    process.env.REPAIR_MASTER_EMAIL,
    existingMaster?.email || tenant.email || 'assine@sigmaauto.com.br',
  );
  const name = process.env.REPAIR_MASTER_NAME || existingMaster?.name || 'Master Sigma Auto';
  const password = process.env.REPAIR_MASTER_PASSWORD || 'SygmaMaster@2026!';
  const passwordHash = await bcrypt.hash(password, 10);

  const sameEmailUser = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: { equals: email, mode: 'insensitive' } },
  });

  let master;
  if (sameEmailUser) {
    master = await prisma.user.update({
      where: { id: sameEmailUser.id },
      data: {
        name,
        email,
        passwordHash,
        role: 'MASTER',
        isActive: true,
        passwordUpdatedAt: new Date(),
      },
    });
  } else if (existingMaster) {
    master = await prisma.user.update({
      where: { id: existingMaster.id },
      data: {
        name,
        email,
        passwordHash,
        isActive: true,
        passwordUpdatedAt: new Date(),
      },
    });
  } else {
    master = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        passwordHash,
        name,
        role: 'MASTER',
        isActive: true,
        passwordUpdatedAt: new Date(),
      },
    });
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { email },
  }).catch(() => null);

  return { tenantId: tenant.id, tenantName: tenant.name, email: master.email, name };
}

async function runRepairLogins() {
  const superAdmin = await repairSuperAdmin();
  const master = await repairMaster();

  console.log('[repair-logins] Credenciais reparadas com sucesso:');
  console.log(`[repair-logins] Super Admin: ${superAdmin.email}`);
  console.log(`[repair-logins] MASTER: ${master.email} | tenant=${master.tenantName} (${master.tenantId})`);
}

if (require.main === module) {
  runRepairLogins()
    .catch((err) => {
      console.error('[repair-logins] Erro:', err.message || err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { runRepairLogins };