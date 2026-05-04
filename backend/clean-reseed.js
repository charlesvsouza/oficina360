/**
 * clean-reseed.js
 *
 * 1. Remove todos os dados demo gerados automaticamente
 *    (clientes/veículos/OSs dos seeds anteriores, usuários .local e .demo)
 * 2. Recria:
 *    - 2 colaboradores por área (MECANICA, ELETRICA, FUNILARIA_PINTURA,
 *      HIGIENIZACAO_EMBELEZAMENTO, LAVACAO) → 10 técnicos no total
 *    - 5 serviços por área → 25 serviços
 *    - 10 OSs completas distribuídas pelas áreas com itens, executores e comissões
 *
 * Ativado pelo release.js quando CLEAN_RESEED=true ou pelo comando direto:
 *   node clean-reseed.js
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// ─── helpers ───────────────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (d) => { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt; };

// ─── Colaboradores: 2 por área ─────────────────────────────────────────────
const COLABORADORES = [
  // MECÂNICA
  { name: 'João Mecânico',     email: 'joao.mecanico@oficina.demo',     role: 'MECANICO', jobFunction: 'MECANICO',    workshopArea: 'MECANICA' },
  { name: 'Pedro Mecânico',    email: 'pedro.mecanico@oficina.demo',    role: 'MECANICO', jobFunction: 'MECANICO',    workshopArea: 'MECANICA' },
  // ELÉTRICA
  { name: 'André Eletricista', email: 'andre.eletricista@oficina.demo', role: 'MECANICO', jobFunction: 'ELETRICISTA', workshopArea: 'ELETRICA' },
  { name: 'Lucas Eletricista', email: 'lucas.eletricista@oficina.demo', role: 'MECANICO', jobFunction: 'ELETRICISTA', workshopArea: 'ELETRICA' },
  // FUNILARIA / PINTURA
  { name: 'Marcos Funileiro',  email: 'marcos.funileiro@oficina.demo',  role: 'MECANICO', jobFunction: 'FUNILEIRO',   workshopArea: 'FUNILARIA_PINTURA' },
  { name: 'Diego Pintor',      email: 'diego.pintor@oficina.demo',      role: 'MECANICO', jobFunction: 'PINTOR',      workshopArea: 'FUNILARIA_PINTURA' },
  // HIGIENIZAÇÃO / EMBELEZAMENTO
  { name: 'Rafael Embelezador', email: 'rafael.embelezador@oficina.demo', role: 'MECANICO', jobFunction: 'EMBELEZADOR_AUTOMOTIVO', workshopArea: 'HIGIENIZACAO_EMBELEZAMENTO' },
  { name: 'Camila Embelezadora', email: 'camila.embelezadora@oficina.demo', role: 'MECANICO', jobFunction: 'EMBELEZADOR_AUTOMOTIVO', workshopArea: 'HIGIENIZACAO_EMBELEZAMENTO' },
  // LAVAÇÃO
  { name: 'Bruno Lavador',     email: 'bruno.lavador@oficina.demo',     role: 'MECANICO', jobFunction: 'LAVADOR',     workshopArea: 'LAVACAO' },
  { name: 'Mateus Lavador',    email: 'mateus.lavador@oficina.demo',    role: 'MECANICO', jobFunction: 'LAVADOR',     workshopArea: 'LAVACAO' },
];

// ─── Serviços: 5 por área ──────────────────────────────────────────────────
const SERVICOS = [
  // MECÂNICA
  { name: 'Troca de Óleo e Filtro',          area: 'MECANICA',                   price: 120,  category: 'preventiva' },
  { name: 'Alinhamento e Balanceamento',      area: 'MECANICA',                   price: 160,  category: 'preventiva' },
  { name: 'Revisão de Freios',                area: 'MECANICA',                   price: 220,  category: 'corretiva'  },
  { name: 'Troca de Correia Dentada',         area: 'MECANICA',                   price: 450,  category: 'preventiva' },
  { name: 'Diagnóstico Eletrônico Motor',     area: 'MECANICA',                   price: 180,  category: 'diagnostico'},
  // ELÉTRICA
  { name: 'Verificação do Sistema Elétrico',  area: 'ELETRICA',                   price: 150,  category: 'diagnostico'},
  { name: 'Troca de Bateria',                 area: 'ELETRICA',                   price: 80,   category: 'corretiva'  },
  { name: 'Instalação de Som Automotivo',     area: 'ELETRICA',                   price: 200,  category: 'acessorio'  },
  { name: 'Reparo no Chicote Elétrico',       area: 'ELETRICA',                   price: 320,  category: 'corretiva'  },
  { name: 'Revisão do Sistema de Injeção',    area: 'ELETRICA',                   price: 280,  category: 'preventiva' },
  // FUNILARIA / PINTURA
  { name: 'Reparo de Amassado (Martelinho)',  area: 'FUNILARIA_PINTURA',          price: 350,  category: 'corretiva'  },
  { name: 'Pintura de Painel Traseiro',       area: 'FUNILARIA_PINTURA',          price: 900,  category: 'corretiva'  },
  { name: 'Troca de Para-choque',             area: 'FUNILARIA_PINTURA',          price: 600,  category: 'corretiva'  },
  { name: 'Polimento Técnico',                area: 'FUNILARIA_PINTURA',          price: 400,  category: 'estetica'   },
  { name: 'Revitalização de Faróis',          area: 'FUNILARIA_PINTURA',          price: 180,  category: 'estetica'   },
  // HIGIENIZAÇÃO / EMBELEZAMENTO
  { name: 'Higienização Interna Completa',    area: 'HIGIENIZACAO_EMBELEZAMENTO', price: 300,  category: 'estetica'   },
  { name: 'Cristalização da Pintura',         area: 'HIGIENIZACAO_EMBELEZAMENTO', price: 500,  category: 'estetica'   },
  { name: 'Aplicação de Coating Cerâmico',    area: 'HIGIENIZACAO_EMBELEZAMENTO', price: 1500, category: 'estetica'   },
  { name: 'Limpeza de Motor',                 area: 'HIGIENIZACAO_EMBELEZAMENTO', price: 250,  category: 'preventiva' },
  { name: 'Revitalização de Plásticos',       area: 'HIGIENIZACAO_EMBELEZAMENTO', price: 150,  category: 'estetica'   },
  // LAVAÇÃO
  { name: 'Lavagem Completa',                 area: 'LAVACAO',                    price: 80,   category: 'limpeza'    },
  { name: 'Lavagem a Seco',                   area: 'LAVACAO',                    price: 100,  category: 'limpeza'    },
  { name: 'Lavagem de Motor',                 area: 'LAVACAO',                    price: 120,  category: 'limpeza'    },
  { name: 'Lavagem de Estofados',             area: 'LAVACAO',                    price: 200,  category: 'limpeza'    },
  { name: 'Lavagem Detalhada (Detailing)',     area: 'LAVACAO',                    price: 350,  category: 'limpeza'    },
];

// ─── Clientes demo ─────────────────────────────────────────────────────────
const CLIENTES = [
  { name: 'Fábio Andrade',   phone: '11912340001', email: 'fabio.andrade@demo.oficina'  },
  { name: 'Sônia Barros',    phone: '11912340002', email: 'sonia.barros@demo.oficina'   },
  { name: 'Gustavo Pires',   phone: '11912340003', email: 'gustavo.pires@demo.oficina'  },
  { name: 'Letícia Moura',   phone: '11912340004', email: 'leticia.moura@demo.oficina'  },
  { name: 'Henrique Lima',   phone: '11912340005', email: 'henrique.lima@demo.oficina'  },
  { name: 'Vanessa Rocha',   phone: '11912340006', email: 'vanessa.rocha@demo.oficina'  },
  { name: 'Marcelo Teles',   phone: '11912340007', email: 'marcelo.teles@demo.oficina'  },
  { name: 'Patrícia Cunha',  phone: '11912340008', email: 'patricia.cunha@demo.oficina' },
  { name: 'Roberto Fonseca', phone: '11912340009', email: 'roberto.fonseca@demo.oficina'},
  { name: 'Aline Vasconcelos', phone: '11912340010', email: 'aline.vasconcelos@demo.oficina'},
];

const VEICULOS = [
  { brand: 'Volkswagen', model: 'Golf',      year: 2020, color: 'Cinza',    plate: 'OSA0A01' },
  { brand: 'Fiat',       model: 'Pulse',     year: 2022, color: 'Branco',   plate: 'OSA0A02' },
  { brand: 'Chevrolet',  model: 'Tracker',   year: 2021, color: 'Preto',    plate: 'OSA0A03' },
  { brand: 'Toyota',     model: 'Yaris',     year: 2019, color: 'Prata',    plate: 'OSA0A04' },
  { brand: 'Honda',      model: 'Fit',       year: 2018, color: 'Vermelho', plate: 'OSA0A05' },
  { brand: 'Ford',       model: 'Territory', year: 2023, color: 'Azul',     plate: 'OSA0A06' },
  { brand: 'Hyundai',    model: 'Creta',     year: 2022, color: 'Branco',   plate: 'OSA0A07' },
  { brand: 'Renault',    model: 'Duster',    year: 2021, color: 'Laranja',  plate: 'OSA0A08' },
  { brand: 'Jeep',       model: 'Renegade',  year: 2020, color: 'Prata',    plate: 'OSA0A09' },
  { brand: 'Nissan',     model: 'Versa',     year: 2023, color: 'Cinza',    plate: 'OSA0A10' },
];

// 10 OSs: cada uma vinculada a uma área e com 2 serviços + 1 peça
const OS_TEMPLATES = [
  { area: 'MECANICA',                   complaint: 'Motor fazendo barulho ao acelerar',          services: ['Troca de Óleo e Filtro', 'Diagnóstico Eletrônico Motor'],         status: 'ENTREGUE',             daysBack: 20 },
  { area: 'ELETRICA',                   complaint: 'Carro não liga pela manhã',                  services: ['Verificação do Sistema Elétrico', 'Troca de Bateria'],             status: 'ENTREGUE',             daysBack: 15 },
  { area: 'FUNILARIA_PINTURA',           complaint: 'Amassado no para-lama traseiro',             services: ['Reparo de Amassado (Martelinho)', 'Polimento Técnico'],            status: 'PRONTO_ENTREGA',       daysBack: 5  },
  { area: 'HIGIENIZACAO_EMBELEZAMENTO', complaint: 'Higienização completa após enchente',        services: ['Higienização Interna Completa', 'Limpeza de Motor'],               status: 'EM_EXECUCAO',          daysBack: 3  },
  { area: 'LAVACAO',                    complaint: 'Lavagem semanal completa',                   services: ['Lavagem Completa', 'Lavagem de Estofados'],                        status: 'FATURADO',             daysBack: 10 },
  { area: 'MECANICA',                   complaint: 'Freios rangendo ao frear',                   services: ['Revisão de Freios', 'Alinhamento e Balanceamento'],               status: 'AGUARDANDO_PECAS',     daysBack: 7  },
  { area: 'ELETRICA',                   complaint: 'Painel elétrico com falhas intermitentes',   services: ['Revisão do Sistema de Injeção', 'Reparo no Chicote Elétrico'],     status: 'APROVADO',             daysBack: 4  },
  { area: 'FUNILARIA_PINTURA',           complaint: 'Faróis opacos e para-choque quebrado',      services: ['Revitalização de Faróis', 'Troca de Para-choque'],                status: 'AGUARDANDO_APROVACAO', daysBack: 2  },
  { area: 'HIGIENIZACAO_EMBELEZAMENTO', complaint: 'Pintura sem brilho, cliente quer coating',  services: ['Cristalização da Pintura', 'Aplicação de Coating Cerâmico'],       status: 'EM_DIAGNOSTICO',       daysBack: 1  },
  { area: 'LAVACAO',                    complaint: 'Odor ruim no interior do veículo',           services: ['Higienização Interna Completa', 'Lavagem de Estofados'],           status: 'ABERTA',               daysBack: 0  },
];

// ─── Limpeza ───────────────────────────────────────────────────────────────
async function cleanDemoData(tenantId) {
  console.log('[clean] Removendo dados demo antigos...');

  // Emails dos seeds antigos (padrões conhecidos)
  const demoEmailPatterns = [
    '%@demo.com', '%@cliente.com', '%@sygmaauto.local',
    '%@oficina.demo', // nosso novo padrão também (caso rode novamente)
  ];

  // Remover comissões, timelines, checklists, itens e OSs dos clientes demo
  const demoCustomers = await prisma.customer.findMany({
    where: {
      tenantId,
      OR: demoEmailPatterns.map(p => ({ email: { contains: p.replace('%', '').replace('%', '') } })),
    },
    select: { id: true },
  });

  // busca mais abrangente por nome (Processo 001..045, demo clientes)
  const demoByName = await prisma.customer.findMany({
    where: {
      tenantId,
      OR: [
        { name: { contains: 'Processo' } },
        { name: { contains: 'Demo' } },
        { name: { endsWith: '.demo' } },
      ],
    },
    select: { id: true },
  });

  const allDemoIds = [...new Set([...demoCustomers, ...demoByName].map(c => c.id))];
  console.log(`[clean] ${allDemoIds.length} clientes demo encontrados`);

  if (allDemoIds.length > 0) {
    // Buscar OSs desses clientes
    const demoOS = await prisma.serviceOrder.findMany({
      where: { tenantId, customerId: { in: allDemoIds } },
      select: { id: true },
    });
    const demoOSIds = demoOS.map(o => o.id);

    if (demoOSIds.length > 0) {
      await prisma.commission.deleteMany({ where: { tenantId, serviceOrderId: { in: demoOSIds } } });
      await prisma.serviceOrderTimeline.deleteMany({ where: { serviceOrderId: { in: demoOSIds } } });
      await prisma.vehicleChecklist.deleteMany({ where: { serviceOrderId: { in: demoOSIds } } });
      await prisma.serviceOrderItem.deleteMany({ where: { serviceOrderId: { in: demoOSIds } } });
      await prisma.serviceOrder.deleteMany({ where: { id: { in: demoOSIds } } });
      console.log(`[clean] ${demoOSIds.length} OSs demo removidas`);
    }

    // Remover veículos e clientes
    await prisma.vehicle.deleteMany({ where: { tenantId, customerId: { in: allDemoIds } } });
    await prisma.customer.deleteMany({ where: { id: { in: allDemoIds } } });
    console.log(`[clean] Clientes e veículos demo removidos`);
  }

  // Remover usuários demo (emails @demo.com, @sygmaauto.local, @oficina.demo)
  const demoUsers = await prisma.user.findMany({
    where: {
      tenantId,
      OR: [
        { email: { contains: '@demo.com' } },
        { email: { contains: '@sygmaauto.local' } },
        { email: { contains: '@oficina.demo' } },
      ],
    },
    select: { id: true },
  });
  if (demoUsers.length > 0) {
    const demoUserIds = demoUsers.map(u => u.id);
    await prisma.commissionRate.deleteMany({ where: { tenantId, userId: { in: demoUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: demoUserIds } } });
    console.log(`[clean] ${demoUsers.length} usuários demo removidos`);
  }

  // Remover serviços demo (que não tenham sido usados em OSs reais)
  const demoServices = await prisma.service.findMany({ where: { tenantId }, select: { id: true, name: true } });
  const demoParts    = await prisma.part.findMany({ where: { tenantId }, select: { id: true } });
  const usedSvcIds   = (await prisma.serviceOrderItem.findMany({
    where: { serviceOrderId: { in: (await prisma.serviceOrder.findMany({ where: { tenantId }, select: { id: true } })).map(o => o.id) } },
    select: { serviceId: true },
  })).map(i => i.serviceId).filter(Boolean);

  const unusedSvcs = demoServices.filter(s => !usedSvcIds.includes(s.id));
  if (unusedSvcs.length > 0) {
    await prisma.service.deleteMany({ where: { id: { in: unusedSvcs.map(s => s.id) } } });
    console.log(`[clean] ${unusedSvcs.length} serviços sem uso removidos`);
  }

  console.log('[clean] Limpeza concluída.');
}

// ─── Seed principal ────────────────────────────────────────────────────────
async function runCleanReseed() {
  const tenant = await prisma.tenant.findFirst({ where: { status: 'ACTIVE' } });
  if (!tenant) { console.log('[clean-reseed] Nenhum tenant ACTIVE. Abortando.'); return; }
  const tenantId = tenant.id;
  console.log(`[clean-reseed] Tenant: ${tenant.name} (${tenantId})`);

  await cleanDemoData(tenantId);

  // ── Criar colaboradores ──────────────────────────────────────────────────
  const userMap = {};
  const defaultPass = await bcrypt.hash('Senha@2026!', 10);
  for (const c of COLABORADORES) {
    let u = await prisma.user.findFirst({ where: { tenantId, email: c.email } });
    if (!u) {
      u = await prisma.user.create({
        data: {
          tenantId, name: c.name, email: c.email,
          passwordHash: defaultPass,
          role: c.role,
          jobFunction: c.jobFunction,
          workshopArea: c.workshopArea,
          isActive: true,
        },
      });
      console.log(`[seed] Colaborador criado: ${c.name}`);
    }
    userMap[c.workshopArea] = userMap[c.workshopArea] || [];
    userMap[c.workshopArea].push(u.id);
  }
  console.log('[seed] Colaboradores OK');

  // ── Criar comission rates ────────────────────────────────────────────────
  for (const area of Object.keys(userMap)) {
    for (const uid of userMap[area]) {
      const exists = await prisma.commissionRate.findFirst({ where: { tenantId, userId: uid } });
      if (!exists) {
        await prisma.commissionRate.create({ data: { tenantId, userId: uid, rate: 5.0 } });
      }
    }
  }

  // ── Criar serviços ───────────────────────────────────────────────────────
  const svcMap = {};
  for (const s of SERVICOS) {
    let svc = await prisma.service.findFirst({ where: { tenantId, name: s.name } });
    if (!svc) {
      svc = await prisma.service.create({
        data: { tenantId, name: s.name, category: s.category, basePrice: s.price, isActive: true },
      });
    }
    svcMap[s.name] = svc.id;
  }
  console.log('[seed] Serviços OK (25 no total, 5 por área)');

  // ── Criar clientes e veículos ────────────────────────────────────────────
  const pairs = [];
  for (let i = 0; i < CLIENTES.length; i++) {
    const c = CLIENTES[i];
    const v = VEICULOS[i];
    let cliente = await prisma.customer.findFirst({ where: { tenantId, email: c.email } });
    if (!cliente) {
      cliente = await prisma.customer.create({ data: { tenantId, name: c.name, phone: c.phone, email: c.email } });
    }
    let veiculo = await prisma.vehicle.findFirst({ where: { tenantId, plate: v.plate } });
    if (!veiculo) {
      veiculo = await prisma.vehicle.create({
        data: { tenantId, customerId: cliente.id, plate: v.plate, brand: v.brand, model: v.model, year: v.year, color: v.color },
      });
    }
    pairs.push({ customerId: cliente.id, vehicleId: veiculo.id });
  }
  console.log('[seed] Clientes e veículos OK');

  // ── Criar 10 OSs ─────────────────────────────────────────────────────────
  // Buscar o usuário MASTER para authorId
  const masterUser = await prisma.user.findFirst({ where: { tenantId, role: 'MASTER' } });
  const authorId = masterUser?.id || null;

  let osCount = 0;
  for (let i = 0; i < OS_TEMPLATES.length; i++) {
    const tpl = OS_TEMPLATES[i];
    const { customerId, vehicleId } = pairs[i];
    const executores = userMap[tpl.area] || [];
    const executor1 = executores[0] || null;
    const executor2 = executores[1] || null;

    // Montar itens de serviço (2 por OS, alternando executores)
    const itemsData = [];
    for (let si = 0; si < tpl.services.length; si++) {
      const svcName = tpl.services[si];
      const svc = SERVICOS.find(s => s.name === svcName);
      if (!svc || !svcMap[svcName]) continue;
      const executor = si % 2 === 0 ? executor1 : (executor2 || executor1);
      itemsData.push({
        serviceId: svcMap[svcName],
        description: svcName,
        quantity: 1,
        unitPrice: svc.price,
        discount: 0,
        totalPrice: svc.price,
        type: 'service',
        applied: ['FATURADO', 'ENTREGUE', 'PRONTO_ENTREGA', 'EM_EXECUCAO'].includes(tpl.status),
        assignedUserId: executor,
      });
    }

    if (itemsData.length === 0) continue;

    const totalServices = itemsData.reduce((s, x) => s + x.totalPrice, 0);
    const createdAt = daysAgo(tpl.daysBack);

    // Datas condicionais por status
    const startedAt = ['EM_EXECUCAO', 'PRONTO_ENTREGA', 'FATURADO', 'ENTREGUE'].includes(tpl.status)
      ? new Date(createdAt.getTime() + 3600_000) : null;
    const completedAt = ['PRONTO_ENTREGA', 'FATURADO', 'ENTREGUE'].includes(tpl.status)
      ? new Date(createdAt.getTime() + 86400_000 * 2) : null;
    const paidAt = ['FATURADO', 'ENTREGUE'].includes(tpl.status)
      ? new Date(createdAt.getTime() + 86400_000 * 3) : null;
    const deliveredAt = tpl.status === 'ENTREGUE'
      ? new Date(createdAt.getTime() + 86400_000 * 4) : null;

    const order = await prisma.serviceOrder.create({
      data: {
        tenantId,
        customerId,
        vehicleId,
        orderType: 'ORDEM_SERVICO',
        status: tpl.status,
        statusChangedAt: new Date(createdAt.getTime() + 1800_000),
        complaint: tpl.complaint,
        totalParts: 0,
        totalServices,
        totalLabor: 0,
        totalCost: totalServices,
        createdAt,
        updatedAt: createdAt,
        startedAt,
        completedAt,
        paidAt,
        deliveredAt,
        paymentMethod: paidAt ? pick(['PIX', 'Cartão de Crédito', 'Dinheiro']) : null,
        approvalToken: uuidv4(),
        approvalTokenExpires: new Date(Date.now() + 7 * 86400_000),
        items: { create: itemsData },
      },
    });

    // Timeline
    const tlEvents = [{ status: 'ABERTA', note: 'O.S. aberta' }];
    if (!['ABERTA'].includes(tpl.status)) tlEvents.push({ status: 'EM_DIAGNOSTICO',  note: 'Diagnóstico iniciado' });
    if (['AGUARDANDO_APROVACAO','APROVADO','AGUARDANDO_PECAS','EM_EXECUCAO','PRONTO_ENTREGA','FATURADO','ENTREGUE'].includes(tpl.status))
      tlEvents.push({ status: 'AGUARDANDO_APROVACAO', note: 'Orçamento enviado ao cliente' });
    if (['APROVADO','AGUARDANDO_PECAS','EM_EXECUCAO','PRONTO_ENTREGA','FATURADO','ENTREGUE'].includes(tpl.status))
      tlEvents.push({ status: 'APROVADO', note: 'Orçamento aprovado' });
    if (['AGUARDANDO_PECAS'].includes(tpl.status))
      tlEvents.push({ status: 'AGUARDANDO_PECAS', note: 'Aguardando chegada de peças' });
    if (['EM_EXECUCAO','PRONTO_ENTREGA','FATURADO','ENTREGUE'].includes(tpl.status))
      tlEvents.push({ status: 'EM_EXECUCAO', note: 'Execução iniciada' });
    if (['PRONTO_ENTREGA','FATURADO','ENTREGUE'].includes(tpl.status))
      tlEvents.push({ status: 'PRONTO_ENTREGA', note: 'Serviço concluído' });
    if (['FATURADO','ENTREGUE'].includes(tpl.status))
      tlEvents.push({ status: 'FATURADO', note: 'Pagamento registrado' });
    if (tpl.status === 'ENTREGUE')
      tlEvents.push({ status: 'ENTREGUE', note: 'Veículo entregue ao cliente' });

    for (const ev of tlEvents) {
      await prisma.serviceOrderTimeline.create({
        data: {
          serviceOrderId: order.id,
          status: ev.status,
          notes: ev.note,
          createdBy: authorId,
          createdAt,
        },
      });
    }

    // Comissões para itens com assignedUserId
    const osItems = await prisma.serviceOrderItem.findMany({ where: { serviceOrderId: order.id } });
    for (const item of osItems) {
      if (!item.assignedUserId) continue;
      const rate = await prisma.commissionRate.findFirst({ where: { tenantId, userId: item.assignedUserId } });
      if (!rate) continue;
      await prisma.commission.create({
        data: {
          tenantId,
          serviceOrderId: order.id,
          serviceOrderItemId: item.id,
          userId: item.assignedUserId,
          baseValue: item.totalPrice,
          commissionPercent: rate.rate,
          commissionValue: (item.totalPrice * rate.rate) / 100,
          status: paidAt ? 'PAGO' : 'PENDENTE',
          paidAt,
        },
      });
    }

    osCount++;
    console.log(`[seed] OS ${osCount}/10 criada: ${tpl.complaint.slice(0, 50)} → ${tpl.status}`);
  }

  console.log(`\n✅ Clean-reseed concluído: 10 colaboradores · 25 serviços · ${osCount} OSs`);
}

// ─── Entry point ───────────────────────────────────────────────────────────
if (require.main === module) {
  runCleanReseed()
    .catch((e) => { console.error('[clean-reseed] Erro:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}

module.exports = { runCleanReseed };
