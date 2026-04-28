'use strict';
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// ─── Catálogo de Peças ────────────────────────────────────────────────────────
const PARTS_CATALOG = [
  // FREIOS
  { name: 'Pastilha de Freio Dianteira', internalCode: 'FRE-001', category: 'FRE', unit: 'jg', unitPrice: 189.90, costPrice: 95.00 },
  { name: 'Pastilha de Freio Traseira', internalCode: 'FRE-002', category: 'FRE', unit: 'jg', unitPrice: 149.90, costPrice: 75.00 },
  { name: 'Disco de Freio Dianteiro (par)', internalCode: 'FRE-003', category: 'FRE', unit: 'par', unitPrice: 320.00, costPrice: 160.00 },
  { name: 'Disco de Freio Traseiro (par)', internalCode: 'FRE-004', category: 'FRE', unit: 'par', unitPrice: 280.00, costPrice: 140.00 },
  { name: 'Fluido de Freio DOT4 500ml', internalCode: 'FRE-005', category: 'FRE', unit: 'un', unitPrice: 38.90, costPrice: 18.00 },
  { name: 'Cilindro de Roda Traseiro', internalCode: 'FRE-006', category: 'FRE', unit: 'un', unitPrice: 89.90, costPrice: 42.00 },
  { name: 'Lona de Freio (jogo)', internalCode: 'FRE-007', category: 'FRE', unit: 'jg', unitPrice: 119.90, costPrice: 55.00 },
  { name: 'Bomba de Freio Principal', internalCode: 'FRE-008', category: 'FRE', unit: 'un', unitPrice: 245.00, costPrice: 120.00 },

  // MOTOR / ÓLEO
  { name: 'Óleo Motor 5W30 Sintético 1L', internalCode: 'MOT-001', category: 'MOT', unit: 'L', unitPrice: 49.90, costPrice: 28.00 },
  { name: 'Óleo Motor 10W40 Semissintético 1L', internalCode: 'MOT-002', category: 'MOT', unit: 'L', unitPrice: 32.90, costPrice: 17.00 },
  { name: 'Filtro de Óleo (rosca)', internalCode: 'MOT-003', category: 'MOT', unit: 'un', unitPrice: 39.90, costPrice: 18.00 },
  { name: 'Filtro de Ar do Motor', internalCode: 'MOT-004', category: 'MOT', unit: 'un', unitPrice: 59.90, costPrice: 28.00 },
  { name: 'Filtro de Combustível', internalCode: 'MOT-005', category: 'MOT', unit: 'un', unitPrice: 69.90, costPrice: 32.00 },
  { name: 'Vela de Ignição (unidade)', internalCode: 'MOT-006', category: 'MOT', unit: 'un', unitPrice: 45.00, costPrice: 20.00 },
  { name: 'Correia Dentada + Tensionador (kit)', internalCode: 'MOT-007', category: 'MOT', unit: 'kt', unitPrice: 380.00, costPrice: 180.00 },
  { name: 'Correia Poly-V', internalCode: 'MOT-008', category: 'MOT', unit: 'un', unitPrice: 95.00, costPrice: 45.00 },
  { name: 'Bomba D\'Água', internalCode: 'MOT-009', category: 'MOT', unit: 'un', unitPrice: 210.00, costPrice: 100.00 },
  { name: 'Tampa de Válvulas (junta)', internalCode: 'MOT-010', category: 'MOT', unit: 'un', unitPrice: 85.00, costPrice: 38.00 },

  // SUSPENSÃO
  { name: 'Amortecedor Dianteiro (unidade)', internalCode: 'SUS-001', category: 'SUS', unit: 'un', unitPrice: 320.00, costPrice: 155.00 },
  { name: 'Amortecedor Traseiro (unidade)', internalCode: 'SUS-002', category: 'SUS', unit: 'un', unitPrice: 280.00, costPrice: 135.00 },
  { name: 'Pivô de Suspensão Dianteiro', internalCode: 'SUS-003', category: 'SUS', unit: 'un', unitPrice: 145.00, costPrice: 68.00 },
  { name: 'Barra Estabilizadora (bucha)', internalCode: 'SUS-004', category: 'SUS', unit: 'un', unitPrice: 42.90, costPrice: 18.00 },
  { name: 'Rolamento de Roda Dianteiro', internalCode: 'SUS-005', category: 'SUS', unit: 'un', unitPrice: 189.00, costPrice: 88.00 },
  { name: 'Rolamento de Roda Traseiro', internalCode: 'SUS-006', category: 'SUS', unit: 'un', unitPrice: 175.00, costPrice: 82.00 },
  { name: 'Terminal de Direção', internalCode: 'SUS-007', category: 'SUS', unit: 'un', unitPrice: 98.00, costPrice: 45.00 },
  { name: 'Bieleta de Suspensão', internalCode: 'SUS-008', category: 'SUS', unit: 'un', unitPrice: 79.90, costPrice: 35.00 },
  { name: 'Coxim do Amortecedor', internalCode: 'SUS-009', category: 'SUS', unit: 'un', unitPrice: 110.00, costPrice: 50.00 },

  // ELÉTRICO
  { name: 'Bateria 60Ah Selada', internalCode: 'ELE-001', category: 'ELE', unit: 'un', unitPrice: 520.00, costPrice: 280.00 },
  { name: 'Bateria 45Ah Selada', internalCode: 'ELE-002', category: 'ELE', unit: 'un', unitPrice: 420.00, costPrice: 220.00 },
  { name: 'Alternador Remanufaturado', internalCode: 'ELE-003', category: 'ELE', unit: 'un', unitPrice: 680.00, costPrice: 320.00 },
  { name: 'Motor de Partida (arranque)', internalCode: 'ELE-004', category: 'ELE', unit: 'un', unitPrice: 590.00, costPrice: 280.00 },
  { name: 'Lâmpada Farol H7 55W (par)', internalCode: 'ELE-005', category: 'ELE', unit: 'par', unitPrice: 58.90, costPrice: 25.00 },
  { name: 'Lâmpada Farol LED H4 (par)', internalCode: 'ELE-006', category: 'ELE', unit: 'par', unitPrice: 149.90, costPrice: 70.00 },
  { name: 'Fusível Automotivo (caixa 100un)', internalCode: 'ELE-007', category: 'ELE', unit: 'cx', unitPrice: 38.00, costPrice: 15.00 },
  { name: 'Cabo de Vela (jogo)', internalCode: 'ELE-008', category: 'ELE', unit: 'jg', unitPrice: 185.00, costPrice: 88.00 },

  // SENSORES
  { name: 'Sensor de Temperatura do Motor', internalCode: 'SEN-001', category: 'SEN', unit: 'un', unitPrice: 145.00, costPrice: 68.00 },
  { name: 'Sensor MAP (pressão coletor)', internalCode: 'SEN-002', category: 'SEN', unit: 'un', unitPrice: 210.00, costPrice: 98.00 },
  { name: 'Sensor de Oxigênio (Lambda)', internalCode: 'SEN-003', category: 'SEN', unit: 'un', unitPrice: 320.00, costPrice: 150.00 },
  { name: 'Sensor ABS Dianteiro', internalCode: 'SEN-004', category: 'SEN', unit: 'un', unitPrice: 248.00, costPrice: 115.00 },
  { name: 'Sensor ABS Traseiro', internalCode: 'SEN-005', category: 'SEN', unit: 'un', unitPrice: 228.00, costPrice: 108.00 },
  { name: 'Sensor de Nível de Combustível', internalCode: 'SEN-006', category: 'SEN', unit: 'un', unitPrice: 185.00, costPrice: 85.00 },
  { name: 'Sensor de Rotação (CKP)', internalCode: 'SEN-007', category: 'SEN', unit: 'un', unitPrice: 175.00, costPrice: 80.00 },

  // REFRIGERAÇÃO
  { name: 'Fluido Radiador Concentrado 1L', internalCode: 'REF-001', category: 'REF', unit: 'L', unitPrice: 32.90, costPrice: 15.00 },
  { name: 'Radiador (alumínio)', internalCode: 'REF-002', category: 'REF', unit: 'un', unitPrice: 580.00, costPrice: 280.00 },
  { name: 'Mangueira Superior do Radiador', internalCode: 'REF-003', category: 'REF', unit: 'un', unitPrice: 78.90, costPrice: 35.00 },
  { name: 'Mangueira Inferior do Radiador', internalCode: 'REF-004', category: 'REF', unit: 'un', unitPrice: 68.90, costPrice: 30.00 },
  { name: 'Termostato + Junta', internalCode: 'REF-005', category: 'REF', unit: 'kt', unitPrice: 95.00, costPrice: 42.00 },
  { name: 'Reservatório de Água (Expansão)', internalCode: 'REF-006', category: 'REF', unit: 'un', unitPrice: 128.00, costPrice: 58.00 },

  // TRANSMISSÃO
  { name: 'Óleo de Câmbio ATF 1L', internalCode: 'TRA-001', category: 'TRA', unit: 'L', unitPrice: 42.90, costPrice: 20.00 },
  { name: 'Óleo de Diferencial GL5 1L', internalCode: 'TRA-002', category: 'TRA', unit: 'L', unitPrice: 38.90, costPrice: 18.00 },
  { name: 'Kit de Embreagem (disco + platô)', internalCode: 'TRA-003', category: 'TRA', unit: 'kt', unitPrice: 680.00, costPrice: 320.00 },
  { name: 'Rolamento de Embreagem (thrust)', internalCode: 'TRA-004', category: 'TRA', unit: 'un', unitPrice: 145.00, costPrice: 65.00 },
  { name: 'Cubo de Roda Dianteiro', internalCode: 'TRA-005', category: 'TRA', unit: 'un', unitPrice: 320.00, costPrice: 148.00 },

  // REVISÃO GERAL
  { name: 'Filtro de Ar do Habitáculo (cabine)', internalCode: 'REV-001', category: 'REV', unit: 'un', unitPrice: 49.90, costPrice: 22.00 },
  { name: 'Palheta Limpador Dianteiro (par)', internalCode: 'REV-002', category: 'REV', unit: 'par', unitPrice: 68.90, costPrice: 30.00 },
  { name: 'Fluido Limpador de Vidro 500ml', internalCode: 'REV-003', category: 'REV', unit: 'un', unitPrice: 18.90, costPrice: 7.00 },
  { name: 'Kit Revisão 30.000 km', internalCode: 'REV-004', category: 'REV', unit: 'kt', unitPrice: 280.00, costPrice: 130.00 },
  { name: 'Vela de Ignição Iridium (unidade)', internalCode: 'REV-005', category: 'REV', unit: 'un', unitPrice: 89.00, costPrice: 42.00 },
];

// ─── Veículos Populares RJ / SP ───────────────────────────────────────────────
const VEHICLES_CATALOG = [
  // Volkswagen
  { brand: 'Volkswagen', model: 'Gol' }, { brand: 'Volkswagen', model: 'Polo' },
  { brand: 'Volkswagen', model: 'Virtus' }, { brand: 'Volkswagen', model: 'T-Cross' },
  { brand: 'Volkswagen', model: 'Nivus' }, { brand: 'Volkswagen', model: 'Amarok' },
  { brand: 'Volkswagen', model: 'Saveiro' }, { brand: 'Volkswagen', model: 'Fox' },
  // Chevrolet
  { brand: 'Chevrolet', model: 'Onix' }, { brand: 'Chevrolet', model: 'Onix Plus' },
  { brand: 'Chevrolet', model: 'Tracker' }, { brand: 'Chevrolet', model: 'S10' },
  { brand: 'Chevrolet', model: 'Montana' }, { brand: 'Chevrolet', model: 'Cruze' },
  // Fiat
  { brand: 'Fiat', model: 'Argo' }, { brand: 'Fiat', model: 'Mobi' },
  { brand: 'Fiat', model: 'Pulse' }, { brand: 'Fiat', model: 'Strada' },
  { brand: 'Fiat', model: 'Toro' }, { brand: 'Fiat', model: 'Cronos' },
  { brand: 'Fiat', model: 'Uno' }, { brand: 'Fiat', model: 'Palio' },
  // Hyundai
  { brand: 'Hyundai', model: 'HB20' }, { brand: 'Hyundai', model: 'HB20S' },
  { brand: 'Hyundai', model: 'Creta' }, { brand: 'Hyundai', model: 'Tucson' },
  // Toyota
  { brand: 'Toyota', model: 'Corolla' }, { brand: 'Toyota', model: 'Corolla Cross' },
  { brand: 'Toyota', model: 'Hilux' }, { brand: 'Toyota', model: 'Yaris' },
  { brand: 'Toyota', model: 'SW4' },
  // Renault
  { brand: 'Renault', model: 'Kwid' }, { brand: 'Renault', model: 'Sandero' },
  { brand: 'Renault', model: 'Duster' }, { brand: 'Renault', model: 'Oroch' },
  { brand: 'Renault', model: 'Logan' },
  // Honda
  { brand: 'Honda', model: 'Civic' }, { brand: 'Honda', model: 'HR-V' },
  { brand: 'Honda', model: 'City' }, { brand: 'Honda', model: 'WR-V' },
  { brand: 'Honda', model: 'Fit' },
  // Jeep
  { brand: 'Jeep', model: 'Renegade' }, { brand: 'Jeep', model: 'Compass' },
  { brand: 'Jeep', model: 'Commander' },
  // Nissan
  { brand: 'Nissan', model: 'Kicks' }, { brand: 'Nissan', model: 'Frontier' },
  { brand: 'Nissan', model: 'Versa' }, { brand: 'Nissan', model: 'March' },
  // Ford
  { brand: 'Ford', model: 'Ka' }, { brand: 'Ford', model: 'EcoSport' },
  { brand: 'Ford', model: 'Ranger' }, { brand: 'Ford', model: 'Territory' },
  // Mitsubishi
  { brand: 'Mitsubishi', model: 'L200 Triton' }, { brand: 'Mitsubishi', model: 'Eclipse Cross' },
  { brand: 'Mitsubishi', model: 'Outlander' },
  // Caoa Chery / BYD (crescendo muito no RJ/SP)
  { brand: 'Caoa Chery', model: 'Tiggo 5x' }, { brand: 'Caoa Chery', model: 'Tiggo 8' },
  { brand: 'BYD', model: 'Dolphin' }, { brand: 'BYD', model: 'Seal' }, { brand: 'BYD', model: 'Song Plus' },
  // Citroën / Peugeot
  { brand: 'Citroën', model: 'C3' }, { brand: 'Citroën', model: 'C4 Cactus' },
  { brand: 'Peugeot', model: '208' }, { brand: 'Peugeot', model: '2008' },
];

async function main() {
  console.log('🌱 Starting seed...');

  // ─── Planos ────────────────────────────────────────────────────────────────
  const startPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'START' }, update: { price: 97.00 },
    create: {
      name: 'START', description: 'Para oficinas que estão começando a se profissionalizar.',
      price: 97.00,
      features: JSON.stringify({ customers: true, vehicles: true, serviceOrders: true, manualFinancial: true, serviceApprovalLink: false, inventory: false, whatsappNotifications: false, checklist: false, kanban: false, mechanicCommission: false, maintenanceReminder: false, dre: false, multiUnit: false, nfe: false, clientPortal: false, aiAssist: false, nps: false }),
      limits: JSON.stringify({ serviceOrdersPerMonth: 50, users: 3, storage: '2GB' }),
    },
  });

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'PRO' }, update: { price: 197.00 },
    create: {
      name: 'PRO', description: 'Para oficinas estabelecidas que querem escalar com automação.',
      price: 197.00,
      features: JSON.stringify({ customers: true, vehicles: true, serviceOrders: true, manualFinancial: true, serviceApprovalLink: true, inventory: true, whatsappNotifications: true, checklist: true, kanban: true, mechanicCommission: true, maintenanceReminder: true, dre: false, multiUnit: false, nfe: false, clientPortal: false, aiAssist: false, nps: true }),
      limits: JSON.stringify({ serviceOrdersPerMonth: -1, users: 10, storage: '20GB' }),
    },
  });

  const redePlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'REDE' }, update: { price: 397.00 },
    create: {
      name: 'REDE', description: 'Para redes e franquias com múltiplas unidades.',
      price: 397.00,
      features: JSON.stringify({ customers: true, vehicles: true, serviceOrders: true, manualFinancial: true, serviceApprovalLink: true, inventory: true, whatsappNotifications: true, checklist: true, kanban: true, mechanicCommission: true, maintenanceReminder: true, dre: true, multiUnit: true, nfe: true, clientPortal: true, aiAssist: true, nps: true }),
      limits: JSON.stringify({ serviceOrdersPerMonth: -1, users: -1, storage: '100GB' }),
    },
  });

  console.log('✅ Plans: START / PRO / REDE');

  // ─── Tenant Demo ───────────────────────────────────────────────────────────
  const demoTenant = await prisma.tenant.upsert({
    where: { document: '12.345.678/0001-90' }, update: {},
    create: {
      name: 'Oficina Demo', document: '12.345.678/0001-90',
      address: 'Av. Principal, 1234 - São Paulo, SP',
      phone: '(11) 99999-9999', email: 'contato@oficina-demo.com.br',
      laborHourlyRate: 120.00,
    },
  });

  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 14);

  await prisma.subscription.upsert({
    where: { tenantId: demoTenant.id }, update: {},
    create: {
      tenantId: demoTenant.id, planId: proPlan.id, status: 'TRIALING',
      trialEndsAt: trialEnds, currentPeriodStart: new Date(), currentPeriodEnd: trialEnds,
    },
  });

  console.log('✅ Demo tenant + subscription');

  // ─── Usuários Demo ─────────────────────────────────────────────────────────
  const [adminPwd, mecPwd, recPwd] = await Promise.all([
    bcrypt.hash('admin123', 10), bcrypt.hash('mecanico123', 10), bcrypt.hash('recepcao123', 10),
  ]);

  await Promise.all([
    prisma.user.upsert({ where: { tenantId_email: { tenantId: demoTenant.id, email: 'admin@demo.com' } }, update: {}, create: { tenantId: demoTenant.id, email: 'admin@demo.com', passwordHash: adminPwd, name: 'Admin Demo', role: 'MASTER' } }),
    prisma.user.upsert({ where: { tenantId_email: { tenantId: demoTenant.id, email: 'mecanico@demo.com' } }, update: {}, create: { tenantId: demoTenant.id, email: 'mecanico@demo.com', passwordHash: mecPwd, name: 'Mecânico Demo', role: 'PRODUTIVO' } }),
    prisma.user.upsert({ where: { tenantId_email: { tenantId: demoTenant.id, email: 'recepcao@demo.com' } }, update: {}, create: { tenantId: demoTenant.id, email: 'recepcao@demo.com', passwordHash: recPwd, name: 'Recepção Demo', role: 'PRODUTIVO' } }),
  ]);

  console.log('✅ Demo users');

  // ─── Clientes e Veículos Demo ──────────────────────────────────────────────
  const [c1, c2] = await Promise.all([
    prisma.customer.upsert({ where: { id: 'customer-demo-1' }, update: {}, create: { id: 'customer-demo-1', tenantId: demoTenant.id, name: 'João Silva', document: '123.456.789-00', email: 'joao@email.com', phone: '(11) 99999-1111' } }),
    prisma.customer.upsert({ where: { id: 'customer-demo-2' }, update: {}, create: { id: 'customer-demo-2', tenantId: demoTenant.id, name: 'Maria Santos', document: '987.654.321-00', email: 'maria@email.com', phone: '(11) 99999-2222' } }),
  ]);

  await Promise.all([
    prisma.vehicle.upsert({ where: { tenantId_plate: { tenantId: demoTenant.id, plate: 'ABC-1234' } }, update: {}, create: { id: 'vehicle-demo-1', tenantId: demoTenant.id, customerId: c1.id, plate: 'ABC-1234', brand: 'Volkswagen', model: 'Gol', year: 2020, color: 'Preto', km: 45000 } }),
    prisma.vehicle.upsert({ where: { tenantId_plate: { tenantId: demoTenant.id, plate: 'DEF-5678' } }, update: {}, create: { id: 'vehicle-demo-2', tenantId: demoTenant.id, customerId: c2.id, plate: 'DEF-5678', brand: 'Chevrolet', model: 'Onix', year: 2022, color: 'Branco', km: 20000 } }),
  ]);

  console.log('✅ Demo customers + vehicles');

  // ─── Catálogo de Peças ──────────────────────────────────────────────────────
  for (const part of PARTS_CATALOG) {
    await prisma.part.upsert({
      where: { tenantId_sku: { tenantId: demoTenant.id, sku: part.internalCode } },
      update: { unitPrice: part.unitPrice, costPrice: part.costPrice },
      create: {
        tenantId: demoTenant.id,
        name: part.name,
        internalCode: part.internalCode,
        sku: part.internalCode,
        category: part.category,
        unit: part.unit,
        unitPrice: part.unitPrice,
        costPrice: part.costPrice,
        minStock: 5,
        currentStock: 0,
        isActive: true,
      },
    });
  }

  console.log(`✅ ${PARTS_CATALOG.length} peças no catálogo`);

  // ─── Serviços Demo ──────────────────────────────────────────────────────────
  const services = [
    { id: 'svc-001', name: 'Troca de Óleo e Filtro', basePrice: 80.00, category: 'Revisão', tmo: 0.5 },
    { id: 'svc-002', name: 'Alinhamento e Balanceamento', basePrice: 120.00, category: 'Suspensão', tmo: 1.0 },
    { id: 'svc-003', name: 'Revisão de Freios (dianteiro)', basePrice: 150.00, category: 'Freios', tmo: 1.5 },
    { id: 'svc-004', name: 'Revisão de Freios (traseiro)', basePrice: 130.00, category: 'Freios', tmo: 1.0 },
    { id: 'svc-005', name: 'Troca de Correia Dentada', basePrice: 200.00, category: 'Motor', tmo: 2.0 },
    { id: 'svc-006', name: 'Diagnóstico Eletrônico (Scanner)', basePrice: 100.00, category: 'Diagnóstico', tmo: 1.0 },
    { id: 'svc-007', name: 'Higienização do Ar Condicionado', basePrice: 180.00, category: 'Ar Condicionado', tmo: 1.5 },
    { id: 'svc-008', name: 'Troca de Velas de Ignição', basePrice: 80.00, category: 'Motor', tmo: 0.5 },
    { id: 'svc-009', name: 'Regulagem de Motor', basePrice: 250.00, category: 'Motor', tmo: 2.5 },
    { id: 'svc-010', name: 'Troca de Embreagem', basePrice: 300.00, category: 'Transmissão', tmo: 4.0 },
  ];

  for (const svc of services) {
    await prisma.service.upsert({
      where: { id: svc.id }, update: {},
      create: { id: svc.id, tenantId: demoTenant.id, name: svc.name, basePrice: svc.basePrice, category: svc.category, duration: Math.round(svc.tmo * 60), hourlyRate: 120, tmo: svc.tmo },
    });
  }

  console.log(`✅ ${services.length} serviços no catálogo`);

  console.log(`
╔══════════════════════════════════════════════════════════╗
║           🚀  OFICINA360 — SEED COMPLETO  🚀             ║
╠══════════════════════════════════════════════════════════╣
║  PLANOS: START R$97 / PRO R$197 / REDE R$397             ║
║  PEÇAS:  ${String(PARTS_CATALOG.length).padEnd(2)} itens no catálogo (sem estoque inicial)      ║
║  MODELOS: ${String(VEHICLES_CATALOG.length).padEnd(2)} marcas/modelos populares RJ/SP           ║
╠══════════════════════════════════════════════════════════╣
║  DEMO: admin@demo.com / admin123 (PRO — trial 14d)       ║
╚══════════════════════════════════════════════════════════╝
  `);
}

main().catch((e) => { console.error('❌ Seed error:', e); process.exit(1); }).finally(() => prisma.$disconnect());
