'use strict';
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const plans = [
  {
    name: 'RETIFICA_PRO',
    description: 'Modo Retifica de Motores — operacao PRO com oficina e retifica integradas.',
    price: 499.0,
    features: JSON.stringify({
      customers: true, vehicles: true, serviceOrders: true, manualFinancial: true,
      inventory: true, whatsappNotifications: true, checklist: true, kanban: true,
      mechanicCommission: true, dre: false, multiUnit: false, retificaMode: true,
    }),
    limits: JSON.stringify({ serviceOrdersPerMonth: -1, users: 15, storage: '40GB' }),
  },
  {
    name: 'RETIFICA_REDE',
    description: 'Modo Retifica de Motores com multiunidade e governanca de rede.',
    price: 899.0,
    features: JSON.stringify({
      customers: true, vehicles: true, serviceOrders: true, manualFinancial: true,
      inventory: true, whatsappNotifications: true, checklist: true, kanban: true,
      mechanicCommission: true, dre: true, multiUnit: true, retificaMode: true,
    }),
    limits: JSON.stringify({ serviceOrdersPerMonth: -1, users: -1, storage: '100GB' }),
  },
];

async function main() {
  for (const plan of plans) {
    const result = await p.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: { price: plan.price, description: plan.description, features: plan.features, limits: plan.limits },
      create: plan,
    });
    console.log(`[seed-plans] ${plan.name} OK — id: ${result.id}`);
  }
  console.log('[seed-plans] Concluido.');
}

main()
  .catch((e) => { console.error('[seed-plans] ERRO:', e.message); process.exit(1); })
  .finally(() => p.$disconnect());
