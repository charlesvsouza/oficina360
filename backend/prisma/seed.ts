import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create subscription plans
  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'BASIC' },
    update: {},
    create: {
      name: 'BASIC',
      description: 'Plano básico para pequenas oficinas',
      price: 0.00,
      features: JSON.stringify({
        customers: true,
        vehicles: true,
        serviceOrders: true,
        manualFinancial: true,
      }),
      limits: JSON.stringify({
        serviceOrdersPerMonth: 50,
        users: 3,
        storage: '1GB',
      }),
    },
  });

  const premiumPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'PREMIUM' },
    update: {},
    create: {
      name: 'PREMIUM',
      description: 'Plano premium com analytics e notificações',
      price: 99.00,
      features: JSON.stringify({
        customers: true,
        vehicles: true,
        serviceOrders: true,
        manualFinancial: true,
        inventory: true,
        dashboardAnalytics: true,
        whatsappNotifications: true,
        serviceApprovalLink: true,
      }),
      limits: JSON.stringify({
        serviceOrdersPerMonth: -1, // unlimited
        users: 10,
        storage: '10GB',
      }),
    },
  });

  const masterPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'MASTER' },
    update: {},
    create: {
      name: 'MASTER',
      description: 'Plano master com AI e relatórios avançados',
      price: 199.00,
      features: JSON.stringify({
        customers: true,
        vehicles: true,
        serviceOrders: true,
        manualFinancial: true,
        inventory: true,
        dashboardAnalytics: true,
        whatsappNotifications: true,
        serviceApprovalLink: true,
        advancedReports: true,
        financialInsights: true,
        automationTriggers: true,
        priorityPerformance: true,
        aiHooks: true,
      }),
      limits: JSON.stringify({
        serviceOrdersPerMonth: -1,
        users: -1,
        storage: '100GB',
      }),
    },
  });

  console.log('✅ Plans created:', { basicPlan, premiumPlan, masterPlan });

  // Create demo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { document: '12.345.678/0001-90' },
    update: {},
    create: {
      name: 'Demo Auto Workshop',
      document: '12.345.678/0001-90',
      address: 'Av. Principal, 1234 - São Paulo, SP',
      phone: '(11) 99999-9999',
      email: 'contato@demooficina.com.br',
    },
  });

  console.log('✅ Demo tenant created');

  // Create subscription for demo tenant
  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 7);

  const currentPeriodEnd = new Date();
  currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

  await prisma.subscription.upsert({
    where: { tenantId: demoTenant.id },
    update: {},
    create: {
      tenantId: demoTenant.id,
      planId: premiumPlan.id,
      status: 'TRIALING',
      trialEndsAt: trialEnds,
      currentPeriodStart: new Date(),
      currentPeriodEnd,
    },
  });

  console.log('✅ Subscription created');

  // Create demo users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const productivePassword = await bcrypt.hash('produtivo123', 10);
  const financeiroPassword = await bcrypt.hash('financeiro123', 10);

  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: demoTenant.id, email: 'admin@demo.com' } },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: 'admin@demo.com',
      passwordHash: adminPassword,
      name: 'Admin Demo',
      role: 'ADMIN',
    },
  });

  const productiveUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: demoTenant.id, email: 'produtivo@demo.com' } },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: 'produtivo@demo.com',
      passwordHash: productivePassword,
      name: 'Produtivo Demo',
      role: 'PRODUTIVO',
    },
  });

  const financeiroUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: demoTenant.id, email: 'financeiro@demo.com' } },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: 'financeiro@demo.com',
      passwordHash: financeiroPassword,
      name: 'Financeiro Demo',
      role: 'FINANCEIRO',
    },
  });

  console.log('✅ Demo users created');

  // Create demo customers
  const customer1 = await prisma.customer.upsert({
    where: { id: 'customer-1' },
    update: {},
    create: {
      id: 'customer-1',
      tenantId: demoTenant.id,
      name: 'João Silva',
      document: '123.456.789-00',
      email: 'joao@email.com',
      phone: '(11) 99999-1111',
      address: 'Rua das Flores, 100 - São Paulo, SP',
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: 'customer-2' },
    update: {},
    create: {
      id: 'customer-2',
      tenantId: demoTenant.id,
      name: 'Maria Santos',
      document: '987.654.321-00',
      email: 'maria@email.com',
      phone: '(11) 99999-2222',
      address: 'Av. Paulista, 500 - São Paulo, SP',
    },
  });

  console.log('✅ Demo customers created');

  // Create demo vehicles
  const vehicle1 = await prisma.vehicle.upsert({
    where: { tenantId_plate: { tenantId: demoTenant.id, plate: 'ABC-1234' } },
    update: {},
    create: {
      id: 'vehicle-1',
      tenantId: demoTenant.id,
      customerId: customer1.id,
      plate: 'ABC-1234',
      brand: 'Volkswagen',
      model: 'Gol',
      year: 2020,
      color: 'Preto',
      km: 45000,
    },
  });

  const vehicle2 = await prisma.vehicle.upsert({
    where: { tenantId_plate: { tenantId: demoTenant.id, plate: 'DEF-5678' } },
    update: {},
    create: {
      id: 'vehicle-2',
      tenantId: demoTenant.id,
      customerId: customer2.id,
      plate: 'DEF-5678',
      brand: 'Chevrolet',
      model: 'Onix',
      year: 2022,
      color: 'Branco',
      km: 20000,
    },
  });

  console.log('✅ Demo vehicles created');

  // Create demo services
  const services = await Promise.all([
    prisma.service.upsert({
      where: { id: 'service-1' },
      update: {},
      create: {
        id: 'service-1',
        tenantId: demoTenant.id,
        name: 'Troca de Óleo',
        description: 'Troca completa de óleo do motor',
        basePrice: 150.00,
        category: 'Manutenção',
        duration: 30,
      },
    }),
    prisma.service.upsert({
      where: { id: 'service-2' },
      update: {},
      create: {
        id: 'service-2',
        tenantId: demoTenant.id,
        name: 'Alinhamento',
        description: 'Alinhamento e balanceamento',
        basePrice: 200.00,
        category: 'Suspensão',
        duration: 60,
      },
    }),
    prisma.service.upsert({
      where: { id: 'service-3' },
      update: {},
      create: {
        id: 'service-3',
        tenantId: demoTenant.id,
        name: 'Freios',
        description: 'Revisão completa do sistema de freios',
        basePrice: 350.00,
        category: 'Freios',
        duration: 90,
      },
    }),
  ]);

  console.log('✅ Demo services created:', services.length);

  // Create demo parts
  const parts = await Promise.all([
    prisma.part.upsert({
      where: { id: 'part-1' },
      update: {},
      create: {
        id: 'part-1',
        tenantId: demoTenant.id,
        name: 'Óleo Lubrax 5W30',
        sku: 'OLEO-001',
        description: 'Óleo Lubrax Sintético 5W30 - 1L',
        unitPrice: 45.00,
        unit: 'L',
        minStock: 10,
      },
    }),
    prisma.part.upsert({
      where: { id: 'part-2' },
      update: {},
      create: {
        id: 'part-2',
        tenantId: demoTenant.id,
        name: 'Filtro de Óleo',
        sku: 'FILTRO-001',
        description: 'Filtro de óleo universal',
        unitPrice: 35.00,
        unit: 'un',
        minStock: 5,
      },
    }),
    prisma.part.upsert({
      where: { id: 'part-3' },
      update: {},
      create: {
        id: 'part-3',
        tenantId: demoTenant.id,
        name: 'Pastilha de Freio',
        sku: 'FREIO-001',
        description: 'Pastilha de freio dianteira',
        unitPrice: 120.00,
        unit: 'jg',
        minStock: 3,
      },
    }),
  ]);

  console.log('✅ Demo parts created:', parts.length);

console.log(`
 ╔════════════════════════════════════════════════════════╗
 ║                   🎉 SEED COMPLETE 🎉                  ║
 ╠════════════════════════════════════════════════════════════════╣
 ║  Demo Tenant: ${demoTenant.name.padEnd(42)}║
 ║  Document: ${demoTenant.document.padEnd(42)}║
 ╠════════════════════════════════════════════════════════════════╣
 ║  Users:                                                  ║
 ║  - admin@demo.com / admin123 (ADMIN)                      ║
 ║  - produtivo@demo.com / produtivo123 (PRODUTIVO)          ║
 ║  - financeiro@demo.com / financeiro123 (FINANCEIRO)    ║
 ╠════════════════════════════════════════════════════════════════╣
 ║  Plans:                                                  ║
 ║  - BASIC: R$ 99,00                                    ║
 ║  - PREMIUM: R$ 199,00                                   ║
 ║  - MASTER: R$ 399,00                                   ║
 ╚════════════════════════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });