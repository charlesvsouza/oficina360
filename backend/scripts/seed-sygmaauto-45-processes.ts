import { PrismaClient, JobFunction, WorkshopArea, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const MARKER = 'AUTOLOAD45_SYGMA';
const TENANT_NAME_TARGET = 'sygma auto';

type TeamMemberSeed = {
  name: string;
  email: string;
  role: UserRole;
  jobFunction: JobFunction;
  workshopArea: WorkshopArea;
  chiefEmail?: string;
  commissionPercent?: number;
};

const TEAM_SEED: TeamMemberSeed[] = [
  {
    name: 'Carlos Mendes',
    email: 'carlos.chefe.mecanica@sygmaauto.local',
    role: 'CHEFE_OFICINA',
    jobFunction: 'CHEFE_OFICINA',
    workshopArea: 'MECANICA',
    commissionPercent: 2.5,
  },
  {
    name: 'Mariana Rocha',
    email: 'mariana.chefe.funilaria@sygmaauto.local',
    role: 'CHEFE_OFICINA',
    jobFunction: 'CHEFE_OFICINA',
    workshopArea: 'FUNILARIA_PINTURA',
    commissionPercent: 2.5,
  },
  {
    name: 'Eduardo Lima',
    email: 'eduardo.chefe.higienizacao@sygmaauto.local',
    role: 'CHEFE_OFICINA',
    jobFunction: 'CHEFE_OFICINA',
    workshopArea: 'HIGIENIZACAO_EMBELEZAMENTO',
    commissionPercent: 2.5,
  },
  {
    name: 'Joao Ferreira',
    email: 'joao.mecanico@sygmaauto.local',
    role: 'MECANICO',
    jobFunction: 'MECANICO',
    workshopArea: 'MECANICA',
    chiefEmail: 'carlos.chefe.mecanica@sygmaauto.local',
  },
  {
    name: 'Paulo Henrique',
    email: 'paulo.eletricista@sygmaauto.local',
    role: 'MECANICO',
    jobFunction: 'ELETRICISTA',
    workshopArea: 'ELETRICA',
    chiefEmail: 'carlos.chefe.mecanica@sygmaauto.local',
  },
  {
    name: 'Rafael Souza',
    email: 'rafael.aprendiz@sygmaauto.local',
    role: 'MECANICO',
    jobFunction: 'APRENDIZ',
    workshopArea: 'MECANICA',
    chiefEmail: 'carlos.chefe.mecanica@sygmaauto.local',
  },
  {
    name: 'Fabio Nunes',
    email: 'fabio.funileiro@sygmaauto.local',
    role: 'MECANICO',
    jobFunction: 'FUNILEIRO',
    workshopArea: 'FUNILARIA_PINTURA',
    chiefEmail: 'mariana.chefe.funilaria@sygmaauto.local',
  },
  {
    name: 'Aline Prado',
    email: 'aline.pintora@sygmaauto.local',
    role: 'MECANICO',
    jobFunction: 'PINTOR',
    workshopArea: 'FUNILARIA_PINTURA',
    chiefEmail: 'mariana.chefe.funilaria@sygmaauto.local',
  },
  {
    name: 'Renata Alves',
    email: 'renata.preparadora@sygmaauto.local',
    role: 'MECANICO',
    jobFunction: 'PREPARADOR',
    workshopArea: 'FUNILARIA_PINTURA',
    chiefEmail: 'mariana.chefe.funilaria@sygmaauto.local',
  },
  {
    name: 'Bruno Cardoso',
    email: 'bruno.lavador@sygmaauto.local',
    role: 'MECANICO',
    jobFunction: 'LAVADOR',
    workshopArea: 'LAVACAO',
    chiefEmail: 'eduardo.chefe.higienizacao@sygmaauto.local',
  },
  {
    name: 'Tiago Ramos',
    email: 'tiago.martelinho@sygmaauto.local',
    role: 'MECANICO',
    jobFunction: 'MARTELINHO_OURO',
    workshopArea: 'FUNILARIA_PINTURA',
    chiefEmail: 'mariana.chefe.funilaria@sygmaauto.local',
  },
  {
    name: 'Juliana Costa',
    email: 'juliana.embelezadora@sygmaauto.local',
    role: 'MECANICO',
    jobFunction: 'EMBELEZADOR_AUTOMOTIVO',
    workshopArea: 'HIGIENIZACAO_EMBELEZAMENTO',
    chiefEmail: 'eduardo.chefe.higienizacao@sygmaauto.local',
  },
  {
    name: 'Diego Silva',
    email: 'diego.servicos.gerais@sygmaauto.local',
    role: 'MECANICO',
    jobFunction: 'COLABORADOR_SERVICOS_GERAIS',
    workshopArea: 'MECANICA',
    chiefEmail: 'carlos.chefe.mecanica@sygmaauto.local',
  },
];

const SERVICES_SEED = [
  { name: `Troca de Oleo ${MARKER}`, category: 'MECANICA', hourlyRate: 180, tmo: 1.2, basePrice: 216 },
  { name: `Revisao Completa ${MARKER}`, category: 'MECANICA', hourlyRate: 220, tmo: 3.0, basePrice: 660 },
  { name: `Diagnostico Eletrico ${MARKER}`, category: 'ELETRICA', hourlyRate: 200, tmo: 1.5, basePrice: 300 },
  { name: `Reparo Chicote ${MARKER}`, category: 'ELETRICA', hourlyRate: 240, tmo: 2.5, basePrice: 600 },
  { name: `Funilaria Leve ${MARKER}`, category: 'FUNILARIA_PINTURA', hourlyRate: 260, tmo: 4.0, basePrice: 1040 },
  { name: `Pintura Parcial ${MARKER}`, category: 'FUNILARIA_PINTURA', hourlyRate: 280, tmo: 3.5, basePrice: 980 },
  { name: `Martelinho de Ouro ${MARKER}`, category: 'FUNILARIA_PINTURA', hourlyRate: 300, tmo: 2.0, basePrice: 600 },
  { name: `Lavacao Tecnica ${MARKER}`, category: 'LAVACAO', hourlyRate: 120, tmo: 1.0, basePrice: 120 },
  { name: `Higienizacao Interna ${MARKER}`, category: 'HIGIENIZACAO_EMBELEZAMENTO', hourlyRate: 180, tmo: 2.0, basePrice: 360 },
  { name: `Embelezamento Premium ${MARKER}`, category: 'HIGIENIZACAO_EMBELEZAMENTO', hourlyRate: 250, tmo: 2.5, basePrice: 625 },
];

const PARTS_SEED = [
  { name: `Filtro de Oleo ${MARKER}`, unitPrice: 45, costPrice: 28, category: 'MECANICA', sku: `${MARKER}-P001` },
  { name: `Oleo 5W30 1L ${MARKER}`, unitPrice: 55, costPrice: 35, category: 'MECANICA', sku: `${MARKER}-P002` },
  { name: `Pastilha de Freio ${MARKER}`, unitPrice: 190, costPrice: 130, category: 'MECANICA', sku: `${MARKER}-P003` },
  { name: `Lampada H7 ${MARKER}`, unitPrice: 65, costPrice: 40, category: 'ELETRICA', sku: `${MARKER}-P004` },
  { name: `Fita Isolante Premium ${MARKER}`, unitPrice: 18, costPrice: 10, category: 'ELETRICA', sku: `${MARKER}-P005` },
  { name: `Massa Plastica ${MARKER}`, unitPrice: 42, costPrice: 25, category: 'FUNILARIA_PINTURA', sku: `${MARKER}-P006` },
  { name: `Tinta Automotiva 900ml ${MARKER}`, unitPrice: 180, costPrice: 120, category: 'FUNILARIA_PINTURA', sku: `${MARKER}-P007` },
  { name: `Shampoo Automotivo ${MARKER}`, unitPrice: 35, costPrice: 20, category: 'LAVACAO', sku: `${MARKER}-P008` },
  { name: `Cera Liquida ${MARKER}`, unitPrice: 48, costPrice: 30, category: 'HIGIENIZACAO_EMBELEZAMENTO', sku: `${MARKER}-P009` },
  { name: `Aromatizante Premium ${MARKER}`, unitPrice: 22, costPrice: 12, category: 'HIGIENIZACAO_EMBELEZAMENTO', sku: `${MARKER}-P010` },
];

function pickByArea<T extends { category: string | null }>(arr: T[], area: WorkshopArea): T[] {
  const map: Record<WorkshopArea, string> = {
    MECANICA: 'MECANICA',
    ELETRICA: 'ELETRICA',
    FUNILARIA_PINTURA: 'FUNILARIA_PINTURA',
    LAVACAO: 'LAVACAO',
    HIGIENIZACAO_EMBELEZAMENTO: 'HIGIENIZACAO_EMBELEZAMENTO',
  };
  return arr.filter((x) => x.category === map[area]);
}

async function main() {
  const tenant = await prisma.tenant.findFirst({
    where: { name: { contains: TENANT_NAME_TARGET, mode: 'insensitive' } },
    select: { id: true, name: true },
  });

  if (!tenant) {
    throw new Error('Tenant Sygma Auto nao encontrado. Nenhum dado foi criado.');
  }

  console.log(`Tenant alvo: ${tenant.name} (${tenant.id})`);

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { defaultCommissionPercent: 1.5 },
  });

  const passwordHash = await bcrypt.hash('Sygma@12345', 10);

  const usersByEmail = new Map<string, string>();

  for (const member of TEAM_SEED.filter((m) => m.role === 'CHEFE_OFICINA')) {
    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: member.email } },
      create: {
        tenantId: tenant.id,
        email: member.email,
        name: member.name,
        passwordHash,
        role: member.role,
        jobFunction: member.jobFunction,
        workshopArea: member.workshopArea,
        commissionPercent: member.commissionPercent ?? null,
        isActive: true,
        invitedBy: MARKER,
        passwordUpdatedAt: new Date(),
      },
      update: {
        name: member.name,
        role: member.role,
        jobFunction: member.jobFunction,
        workshopArea: member.workshopArea,
        commissionPercent: member.commissionPercent ?? null,
        isActive: true,
      },
      select: { id: true, email: true },
    });
    usersByEmail.set(user.email, user.id);
  }

  for (const member of TEAM_SEED.filter((m) => m.role !== 'CHEFE_OFICINA')) {
    const chiefId = member.chiefEmail ? usersByEmail.get(member.chiefEmail) : null;
    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: member.email } },
      create: {
        tenantId: tenant.id,
        email: member.email,
        name: member.name,
        passwordHash,
        role: member.role,
        jobFunction: member.jobFunction,
        workshopArea: member.workshopArea,
        commissionPercent: member.commissionPercent ?? null,
        chiefId: chiefId ?? null,
        isActive: true,
        invitedBy: MARKER,
        passwordUpdatedAt: new Date(),
      },
      update: {
        name: member.name,
        role: member.role,
        jobFunction: member.jobFunction,
        workshopArea: member.workshopArea,
        commissionPercent: member.commissionPercent ?? null,
        chiefId: chiefId ?? null,
        isActive: true,
      },
      select: { id: true, email: true },
    });
    usersByEmail.set(user.email, user.id);
  }

  const services = [] as Array<{ id: string; category: string | null; hourlyRate: number | null; tmo: number | null; basePrice: number }>;
  for (const svc of SERVICES_SEED) {
    const existing = await prisma.service.findFirst({
      where: { tenantId: tenant.id, name: svc.name },
    });

    const service = existing
      ? await prisma.service.update({
          where: { id: existing.id },
          data: {
            category: svc.category,
            basePrice: svc.basePrice,
            hourlyRate: svc.hourlyRate,
            tmo: svc.tmo,
            isActive: true,
          },
        })
      : await prisma.service.create({
          data: {
            tenantId: tenant.id,
            name: svc.name,
            category: svc.category,
            basePrice: svc.basePrice,
            hourlyRate: svc.hourlyRate,
            tmo: svc.tmo,
            description: `Servico de carga automatica ${MARKER}`,
          },
        });
    services.push({
      id: service.id,
      category: service.category,
      hourlyRate: service.hourlyRate,
      tmo: service.tmo,
      basePrice: service.basePrice,
    });
  }

  const parts = [] as Array<{ id: string; category: string | null; unitPrice: number }>;
  for (const partSeed of PARTS_SEED) {
    const part = await prisma.part.upsert({
      where: { tenantId_sku: { tenantId: tenant.id, sku: partSeed.sku } },
      create: {
        tenantId: tenant.id,
        sku: partSeed.sku,
        name: partSeed.name,
        category: partSeed.category,
        unitPrice: partSeed.unitPrice,
        costPrice: partSeed.costPrice,
        currentStock: 100,
        minStock: 5,
      },
      update: {
        name: partSeed.name,
        category: partSeed.category,
        unitPrice: partSeed.unitPrice,
        costPrice: partSeed.costPrice,
        currentStock: { increment: 0 },
        isActive: true,
      },
      select: { id: true, category: true, unitPrice: true },
    });
    parts.push(part);
  }

  const ordersToDelete = await prisma.serviceOrder.findMany({
    where: {
      tenantId: tenant.id,
      notes: { contains: MARKER },
    },
    select: { id: true },
  });
  const orderIds = ordersToDelete.map((o) => o.id);
  if (orderIds.length > 0) {
    await prisma.mechanicCommission.deleteMany({ where: { serviceOrderId: { in: orderIds } } });
    await prisma.vehicleChecklist.deleteMany({ where: { serviceOrderId: { in: orderIds } } });
    await prisma.serviceOrderTimeline.deleteMany({ where: { serviceOrderId: { in: orderIds } } });
    await prisma.serviceOrderItem.deleteMany({ where: { serviceOrderId: { in: orderIds } } });
    await prisma.serviceOrder.deleteMany({ where: { id: { in: orderIds } } });
  }

  const generatedVehicles = await prisma.vehicle.findMany({
    where: { tenantId: tenant.id, notes: { contains: MARKER } },
    select: { id: true },
  });
  const generatedVehicleIds = generatedVehicles.map((v) => v.id);
  if (generatedVehicleIds.length > 0) {
    await prisma.vehicle.deleteMany({ where: { id: { in: generatedVehicleIds } } });
  }

  await prisma.customer.deleteMany({
    where: { tenantId: tenant.id, notes: { contains: MARKER } },
  });

  const executors = await prisma.user.findMany({
    where: {
      tenantId: tenant.id,
      isActive: true,
      workshopArea: { not: null },
      jobFunction: { not: null },
      role: { in: ['CHEFE_OFICINA', 'MECANICO', 'PRODUTIVO'] },
    },
    select: { id: true, workshopArea: true, jobFunction: true, name: true },
  });

  const byArea = new Map<WorkshopArea, Array<{ id: string; workshopArea: WorkshopArea; jobFunction: JobFunction | null; name: string }>>();
  for (const ex of executors as Array<{ id: string; workshopArea: WorkshopArea; jobFunction: JobFunction | null; name: string }>) {
    const list = byArea.get(ex.workshopArea) || [];
    list.push(ex);
    byArea.set(ex.workshopArea, list);
  }

  const areaCycle: WorkshopArea[] = [
    'MECANICA',
    'ELETRICA',
    'FUNILARIA_PINTURA',
    'LAVACAO',
    'HIGIENIZACAO_EMBELEZAMENTO',
  ];

  const createdOrderIds: string[] = [];

  for (let i = 1; i <= 45; i++) {
    const idx = String(i).padStart(3, '0');
    const customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        name: `Cliente Processo ${idx}`,
        phone: `+55219999${String(1000 + i).slice(-4)}`,
        email: `cliente.processo.${idx}@example.com`,
        notes: MARKER,
      },
      select: { id: true },
    });

    const area = areaCycle[(i - 1) % areaCycle.length];

    const vehicle = await prisma.vehicle.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        plate: `SGA${String(1000 + i)}`,
        brand: ['Fiat', 'VW', 'Chevrolet', 'Toyota', 'Honda'][(i - 1) % 5],
        model: ['Uno', 'Gol', 'Onix', 'Corolla', 'Civic'][(i - 1) % 5],
        year: 2016 + ((i - 1) % 9),
        color: ['Preto', 'Branco', 'Prata', 'Vermelho', 'Cinza'][(i - 1) % 5],
        km: 45000 + i * 1200,
        notes: MARKER,
      },
      select: { id: true },
    });

    const areaUsers = byArea.get(area) || [];
    const fallbackUsers = executors;
    const assigneeA = areaUsers[i % Math.max(1, areaUsers.length)] || fallbackUsers[i % fallbackUsers.length];
    const assigneeB = areaUsers[(i + 1) % Math.max(1, areaUsers.length)] || fallbackUsers[(i + 1) % fallbackUsers.length];

    const areaServices = pickByArea(services, area);
    const areaParts = pickByArea(parts, area);

    const service1 = areaServices[0] || services[(i - 1) % services.length];
    const service2 = areaServices[1] || services[(i + 1) % services.length];
    const part1 = areaParts[0] || parts[(i - 1) % parts.length];

    const qtyService1 = Number(service1.tmo || 1.5);
    const qtyService2 = Number(service2.tmo || 1.0);
    const unitService1 = Number(service1.hourlyRate || service1.basePrice || 150);
    const unitService2 = Number(service2.hourlyRate || service2.basePrice || 150);
    const qtyPart = 1 + (i % 2);

    const totalService1 = unitService1 * qtyService1;
    const totalService2 = unitService2 * qtyService2;
    const totalPart = Number(part1.unitPrice || 0) * qtyPart;

    const totalServices = totalService1 + totalService2;
    const totalParts = totalPart;
    const totalCost = totalServices + totalParts;

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - ((45 - i) % 14));

    const order = await prisma.serviceOrder.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        vehicleId: vehicle.id,
        orderType: 'ORDEM_SERVICO',
        status: 'APROVADO',
        complaint: `Processo ${idx} - necessidade de servico na area ${area}`,
        diagnosis: `Diagnostico inicial automatizado ${MARKER}`,
        technicalReport: `Relatorio tecnico automatizado ${MARKER}`,
        observations: `OS criada para validacao de dashboards e produtividade ${MARKER}`,
        notes: `${MARKER} - Processo ${idx}`,
        approvedAt: createdAt,
        approvalStatus: 'APPROVED',
        reserveStock: false,
        totalParts,
        totalServices,
        totalLabor: 0,
        totalDiscount: 0,
        totalCost,
        mechanicId: assigneeA.id,
        createdAt,
        updatedAt: createdAt,
        items: {
          create: [
            {
              serviceId: service1.id,
              assignedUserId: assigneeA.id,
              description: `Servico principal ${MARKER}`,
              quantity: qtyService1,
              unitPrice: unitService1,
              totalPrice: totalService1,
              discount: 0,
              type: 'service',
              applied: false,
              createdAt,
            },
            {
              serviceId: service2.id,
              assignedUserId: assigneeB.id,
              description: `Servico complementar ${MARKER}`,
              quantity: qtyService2,
              unitPrice: unitService2,
              totalPrice: totalService2,
              discount: 0,
              type: 'service',
              applied: false,
              createdAt,
            },
            {
              partId: part1.id,
              description: `Peca aplicada ${MARKER}`,
              quantity: qtyPart,
              unitPrice: Number(part1.unitPrice || 0),
              totalPrice: totalPart,
              discount: 0,
              type: 'part',
              applied: false,
              createdAt,
            },
          ],
        },
        timeline: {
          create: [
            {
              status: 'ABERTA',
              eventType: 'status',
              description: `OS aberta automaticamente ${MARKER}`,
              createdBy: assigneeA.id,
              createdAt,
            },
            {
              status: 'AGUARDANDO_APROVACAO',
              eventType: 'status',
              description: `Orcamento enviado automaticamente ${MARKER}`,
              createdBy: assigneeA.id,
              createdAt,
            },
            {
              status: 'APROVADO',
              eventType: 'status',
              description: `Orcamento autorizado automaticamente ${MARKER}`,
              createdBy: assigneeA.id,
              createdAt,
            },
          ],
        },
      },
      select: { id: true },
    });

    createdOrderIds.push(order.id);
  }

  const chiefs = await prisma.user.count({
    where: {
      tenantId: tenant.id,
      role: 'CHEFE_OFICINA',
    },
  });

  const generatedOrders = await prisma.serviceOrder.count({
    where: {
      tenantId: tenant.id,
      notes: { contains: MARKER },
      status: 'APROVADO',
    },
  });

  console.log('------------------------------------------');
  console.log(`Tenant: ${tenant.name}`);
  console.log('Comissao global definida: 1.5%');
  console.log(`Chefes de oficina encontrados/criados: ${chiefs}`);
  console.log(`Processos em orcamento autorizado criados: ${generatedOrders}`);
  console.log(`Clientes criados: 45`);
  console.log(`Veiculos criados: 45`);
  console.log('------------------------------------------');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
