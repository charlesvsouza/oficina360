import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const MARKER = '[SEED_BI_35_V1]';

type CatalogService = { name: string; basePrice: number; category?: string };
type CatalogPart = { name: string; unitPrice: number; category?: string; minStock?: number };

const SERVICE_CATALOG: CatalogService[] = [
  { name: 'Diagnostico Eletrico Avancado', basePrice: 280, category: 'Eletrica' },
  { name: 'Reparo de Chicote', basePrice: 350, category: 'Eletrica' },
  { name: 'Alinhamento Tecnico 3D', basePrice: 190, category: 'Suspensao' },
  { name: 'Troca de Embreagem', basePrice: 1250, category: 'Transmissao' },
  { name: 'Reparo de Funilaria Leve', basePrice: 780, category: 'Funilaria' },
  { name: 'Polimento Tecnico', basePrice: 240, category: 'Estetica' },
  { name: 'Lavagem Tecnica de Entrega', basePrice: 90, category: 'Estetica' },
  { name: 'Revisao Preventiva', basePrice: 420, category: 'Revisao' },
  { name: 'Troca de Pastilhas e Discos', basePrice: 680, category: 'Freios' },
  { name: 'Recarga de Ar Condicionado', basePrice: 320, category: 'Climatizacao' },
];

const PART_CATALOG: CatalogPart[] = [
  { name: 'Pastilha de Freio Jogo', unitPrice: 220, category: 'Freios', minStock: 8 },
  { name: 'Disco de Freio Par', unitPrice: 340, category: 'Freios', minStock: 6 },
  { name: 'Kit Embreagem', unitPrice: 890, category: 'Transmissao', minStock: 4 },
  { name: 'Fluido DOT4', unitPrice: 35, category: 'Fluidos', minStock: 20 },
  { name: 'Oleo Sintetico 5W30', unitPrice: 72, category: 'Lubrificante', minStock: 30 },
  { name: 'Filtro de Oleo', unitPrice: 38, category: 'Filtro', minStock: 25 },
  { name: 'Lampada Farol H7', unitPrice: 45, category: 'Eletrica', minStock: 15 },
  { name: 'Conector Chicote', unitPrice: 22, category: 'Eletrica', minStock: 40 },
  { name: 'Massa Poliester', unitPrice: 64, category: 'Funilaria', minStock: 10 },
  { name: 'Lixa Automotiva Kit', unitPrice: 18, category: 'Funilaria', minStock: 30 },
];

const PRODUCTIVE_SPECIALTIES = [
  'Mecanico',
  'Eletricista',
  'Funileiro',
  'Lavador',
  'Alinhador',
  'Pintor',
  'Borracheiro',
  'Montador',
];

type RolesConfig = {
  chiefRole: string;
  productiveRoleA: string;
  productiveRoleB: string;
};

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickMany<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(rand(0, copy.length - 1), 1)[0]);
  }
  return out;
}

async function resolveRolesConfig(): Promise<RolesConfig> {
  const rows = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
    SELECT e.enumlabel
    FROM pg_enum e
    INNER JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'UserRole'
  `;

  const available = new Set(rows.map((r) => r.enumlabel));
  const chiefRole = available.has('CHEFE_OFICINA')
    ? 'CHEFE_OFICINA'
    : available.has('GERENTE')
      ? 'GERENTE'
      : 'ADMIN';

  const productiveRoleA = available.has('MECANICO')
    ? 'MECANICO'
    : available.has('PRODUTIVO')
      ? 'PRODUTIVO'
      : 'ADMIN';

  const productiveRoleB = available.has('PRODUTIVO')
    ? 'PRODUTIVO'
    : available.has('MECANICO')
      ? 'MECANICO'
      : 'ADMIN';

  return { chiefRole, productiveRoleA, productiveRoleB };
}

async function ensureUsers(tenantId: string, rolesConfig: RolesConfig) {
  const chiefsSeed = [
    { name: 'Chefe Oficina Norte', email: 'chefe.norte@seed.bi' },
    { name: 'Chefe Oficina Sul', email: 'chefe.sul@seed.bi' },
    { name: 'Chefe Oficina Centro', email: 'chefe.centro@seed.bi' },
  ];

  const chiefs = [] as Array<{ id: string; name: string; email: string }>;
  for (const c of chiefsSeed) {
    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId, email: c.email } },
      update: { name: c.name, role: rolesConfig.chiefRole as any, isActive: true },
      create: {
        tenantId,
        email: c.email,
        passwordHash: await bcrypt.hash('Sygma@1234', 10),
        name: c.name,
        role: rolesConfig.chiefRole as any,
        isActive: true,
      },
      select: { id: true, name: true, email: true },
    });
    chiefs.push(user);
  }

  const productiveUsers = [] as Array<{ id: string; name: string; role: UserRole }>;
  for (let i = 0; i < PRODUCTIVE_SPECIALTIES.length; i++) {
    const specialty = PRODUCTIVE_SPECIALTIES[i];
    const role = i % 2 === 0 ? rolesConfig.productiveRoleA : rolesConfig.productiveRoleB;
    const name = `${specialty} ${i + 1}`;
    const email = `${specialty.toLowerCase()}.${i + 1}@seed.bi`.replace(/[^a-z0-9.@]/g, '');

    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId, email } },
      update: { name, role: role as any, isActive: true },
      create: {
        tenantId,
        email,
        passwordHash: await bcrypt.hash('Sygma@1234', 10),
        name,
        role: role as any,
        isActive: true,
      },
      select: { id: true, name: true, role: true },
    });

    productiveUsers.push(user);
  }

  return { chiefs, productiveUsers };
}

async function ensureCatalog(tenantId: string) {
  for (const s of SERVICE_CATALOG) {
    const found = await prisma.service.findFirst({ where: { tenantId, name: s.name } });
    if (!found) {
      await prisma.service.create({
        data: {
          tenantId,
          name: s.name,
          description: `${s.name} - ${MARKER}`,
          basePrice: s.basePrice,
          category: s.category,
          duration: rand(30, 180),
          isActive: true,
          hourlyRate: Math.max(120, Math.round(s.basePrice / 2)),
          tmo: Number((s.basePrice / 300).toFixed(1)),
        },
      });
    }
  }

  for (const p of PART_CATALOG) {
    const found = await prisma.part.findFirst({ where: { tenantId, name: p.name } });
    if (!found) {
      await prisma.part.create({
        data: {
          tenantId,
          name: p.name,
          description: `${p.name} - ${MARKER}`,
          unitPrice: p.unitPrice,
          category: p.category,
          unit: 'un',
          minStock: p.minStock ?? 5,
          currentStock: Math.max((p.minStock ?? 5) * 6, 40),
          isActive: true,
        },
      });
    }
  }
}

async function ensureCustomersAndVehicles(tenantId: string) {
  const needed = 35;
  const currentCustomers = await prisma.customer.findMany({ where: { tenantId } });

  if (currentCustomers.length < needed) {
    const missing = needed - currentCustomers.length;
    for (let i = 0; i < missing; i++) {
      await prisma.customer.create({
        data: {
          tenantId,
          name: `Cliente BI ${i + 1}`,
          document: `BI${String(i + 1).padStart(6, '0')}`,
          phone: `(11) 9${String(10000000 + i).slice(0, 8)}`,
          email: `cliente.bi.${i + 1}@seed.local`,
          cidade: 'Sao Paulo',
          estado: 'SP',
          notes: MARKER,
        },
      });
    }
  }

  const customers = await prisma.customer.findMany({ where: { tenantId }, orderBy: { createdAt: 'asc' } });

  const vehicles = await prisma.vehicle.findMany({
    where: { tenantId },
    select: { id: true, customerId: true, plate: true, createdAt: true },
  });
  if (vehicles.length < needed) {
    const missing = needed - vehicles.length;
    for (let i = 0; i < missing; i++) {
      const customer = customers[i % customers.length];
      await prisma.vehicle.create({
        data: {
          tenantId,
          customerId: customer.id,
          plate: `BI${String(1000 + i).slice(-4)}X`,
          brand: ['Toyota', 'Volkswagen', 'Chevrolet', 'Honda'][i % 4],
          model: ['Corolla', 'Gol', 'Onix', 'Civic'][i % 4],
          year: 2018 + (i % 8),
          color: ['Preto', 'Branco', 'Prata', 'Cinza'][i % 4],
          km: rand(12000, 160000),
          notes: MARKER,
        },
      });
    }
  }

  return {
    customers: await prisma.customer.findMany({ where: { tenantId }, orderBy: { createdAt: 'asc' } }),
    vehicles: await prisma.vehicle.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, customerId: true, plate: true, createdAt: true },
    }),
    services: await prisma.service.findMany({ where: { tenantId, isActive: true } }),
    parts: await prisma.part.findMany({ where: { tenantId, isActive: true } }),
  };
}

function statusesFor35() {
  return [
    ...Array(10).fill('ENTREGUE'),
    ...Array(8).fill('FATURADO'),
    ...Array(6).fill('PRONTO_ENTREGA'),
    ...Array(5).fill('EM_EXECUCAO'),
    ...Array(3).fill('AGUARDANDO_APROVACAO'),
    ...Array(3).fill('ABERTA'),
  ] as string[];
}

function buildRemainingStatuses(existingByStatus: Record<string, number>) {
  const target: Record<string, number> = {
    ENTREGUE: 10,
    FATURADO: 8,
    PRONTO_ENTREGA: 6,
    EM_EXECUCAO: 5,
    AGUARDANDO_APROVACAO: 3,
    ABERTA: 3,
  };

  const remaining: string[] = [];
  for (const [status, qty] of Object.entries(target)) {
    const already = existingByStatus[status] ?? 0;
    const missing = Math.max(qty - already, 0);
    for (let i = 0; i < missing; i++) remaining.push(status);
  }

  return remaining;
}

async function main() {
  console.log('Iniciando seed de 35 O.S para BI...');

  const tenant = await prisma.tenant.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true },
  });

  if (!tenant) {
    throw new Error('Nenhum tenant encontrado para seed.');
  }

  const existing = await prisma.serviceOrder.count({
    where: { tenantId: tenant.id, notes: { contains: MARKER } },
  });

  if (existing >= 35) {
    console.log(`Ja existem ${existing} O.S com marker ${MARKER}. Seed nao sera duplicado.`);
    return;
  }

  await ensureCatalog(tenant.id);
  const rolesConfig = await resolveRolesConfig();
  const { chiefs, productiveUsers } = await ensureUsers(tenant.id, rolesConfig);
  const { customers, vehicles, services, parts } = await ensureCustomersAndVehicles(tenant.id);

  const grouped = await prisma.serviceOrder.groupBy({
    by: ['status'],
    where: { tenantId: tenant.id, notes: { contains: MARKER } },
    _count: { _all: true },
  });
  const existingByStatus = grouped.reduce<Record<string, number>>((acc, g) => {
    acc[g.status] = g._count._all;
    return acc;
  }, {});

  const statuses = buildRemainingStatuses(existingByStatus);
  if (!statuses.length) {
    console.log('Distribuicao de 35 O.S ja esta completa para o marker.');
    return;
  }

  const startIndex = existing;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 75);

  let created = 0;
  for (let n = 0; n < statuses.length; n++) {
    const i = startIndex + n;
    const chief = chiefs[Math.floor(i / 15)] ?? chiefs[chiefs.length - 1];
    const customer = customers[i % customers.length];
    const vehicle = vehicles[i % vehicles.length];
    const status = statuses[n];

    const teamSize = rand(2, 4);
    const team = pickMany(productiveUsers, teamSize);
    const serviceItems = pickMany(services, rand(1, 2));
    const partItems = pickMany(parts, rand(1, 3));

    let totalServices = 0;
    let totalParts = 0;

    const createdAt = new Date(startDate.getTime() + i * 86400000 * 2);
    const startedAt = ['EM_EXECUCAO', 'PRONTO_ENTREGA', 'FATURADO', 'ENTREGUE'].includes(status)
      ? new Date(createdAt.getTime() + rand(2, 36) * 3600000)
      : null;
    const completedAt = ['PRONTO_ENTREGA', 'FATURADO', 'ENTREGUE'].includes(status) && startedAt
      ? new Date(startedAt.getTime() + rand(3, 18) * 3600000)
      : null;
    const paidAt = ['FATURADO', 'ENTREGUE'].includes(status) && completedAt
      ? new Date(completedAt.getTime() + rand(2, 48) * 3600000)
      : null;
    const deliveredAt = status === 'ENTREGUE' && paidAt
      ? new Date(paidAt.getTime() + rand(2, 24) * 3600000)
      : null;

    const os = await prisma.serviceOrder.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        vehicleId: vehicle.id,
        orderType: i % 6 === 0 ? 'ORCAMENTO' : 'ORDEM_SERVICO',
        status,
        complaint: `Processo ${i + 1} - falha reportada pelo cliente`,
        diagnosis: status === 'ABERTA' ? null : 'Diagnostico tecnico executado pela equipe',
        observations: `Equipe produtiva mesclada para BI. ${MARKER}`,
        mechanicId: chief.id,
        kmEntrada: rand(25000, 180000),
        kmSaida: deliveredAt ? rand(25000, 180500) : null,
        testeRodagem: Boolean(deliveredAt),
        totalParts: 0,
        totalServices: 0,
        totalLabor: 0,
        totalDiscount: 0,
        totalCost: 0,
        createdAt,
        startedAt,
        completedAt,
        paidAt,
        deliveredAt,
        notes: `${MARKER} | Chefe: ${chief.name} | Equipe: ${team.map((t) => t.name).join(', ')}`,
      },
    });

    for (const s of serviceItems) {
      const qty = rand(1, 2);
      const unit = Number((s.basePrice * (0.9 + Math.random() * 0.4)).toFixed(2));
      const total = Number((qty * unit).toFixed(2));
      totalServices += total;

      await prisma.serviceOrderItem.create({
        data: {
          serviceOrderId: os.id,
          serviceId: s.id,
          description: s.name,
          quantity: qty,
          unitPrice: unit,
          totalPrice: total,
          discount: 0,
          type: 'service',
          applied: false,
        },
      });
    }

    for (const p of partItems) {
      const qty = rand(1, 3);
      const unit = Number((p.unitPrice * (0.95 + Math.random() * 0.2)).toFixed(2));
      const total = Number((qty * unit).toFixed(2));
      totalParts += total;
      const shouldApply = ['PRONTO_ENTREGA', 'FATURADO', 'ENTREGUE', 'EM_EXECUCAO'].includes(status);

      await prisma.serviceOrderItem.create({
        data: {
          serviceOrderId: os.id,
          partId: p.id,
          description: p.name,
          quantity: qty,
          unitPrice: unit,
          totalPrice: total,
          discount: 0,
          type: 'part',
          applied: shouldApply,
        },
      });

      if (shouldApply) {
        await prisma.part.update({
          where: { id: p.id },
          data: { currentStock: { decrement: qty } },
        });

        await prisma.inventoryMovement.create({
          data: {
            tenantId: tenant.id,
            partId: p.id,
            type: 'EXIT',
            quantity: Math.trunc(qty),
            note: `${MARKER} baixa OS ${os.id.slice(0, 8)}`,
            createdAt: paidAt ?? completedAt ?? startedAt ?? createdAt,
          },
        });
      }
    }

    const labor = Number((totalServices * 0.18).toFixed(2));
    const discount = Number((Math.random() > 0.7 ? totalServices * 0.03 : 0).toFixed(2));
    const totalCost = Number((totalParts + totalServices + labor - discount).toFixed(2));

    await prisma.serviceOrder.update({
      where: { id: os.id },
      data: {
        totalParts,
        totalServices,
        totalLabor: labor,
        totalDiscount: discount,
        totalCost,
        paymentMethod: ['PIX', 'CARTAO', 'DINHEIRO', 'BOLETO'][i % 4],
      },
    });

    await prisma.serviceOrderTimeline.create({
      data: {
        serviceOrderId: os.id,
        status: 'ABERTA',
        eventType: 'status',
        description: `${MARKER} O.S aberta`,
        createdBy: chief.id,
        createdAt,
      },
    });

    if (status !== 'ABERTA') {
      await prisma.serviceOrderTimeline.create({
        data: {
          serviceOrderId: os.id,
          status,
          eventType: 'status',
          description: `${MARKER} alterada para ${status}`,
          createdBy: chief.id,
          createdAt: paidAt ?? completedAt ?? startedAt ?? createdAt,
        },
      });
    }

    await prisma.serviceOrderTimeline.create({
      data: {
        serviceOrderId: os.id,
        status,
        eventType: 'note',
        description: `${MARKER} equipe produtiva: ${team.map((t) => t.name).join(', ')}`,
        createdBy: chief.id,
        createdAt: createdAt,
      },
    });

    if (['FATURADO', 'ENTREGUE'].includes(status)) {
      await prisma.financialTransaction.create({
        data: {
          tenantId: tenant.id,
          type: 'INCOME',
          amount: totalCost,
          description: `${MARKER} Receita OS ${os.id.slice(0, 8)}`,
          category: 'servicos',
          referenceId: os.id,
          referenceType: 'service_order',
          date: paidAt ?? new Date(),
        },
      });

      // Como o modulo de comissoes foi removido do schema, registramos comissao estimada no financeiro
      // para suportar visualizacao no BI por categoria.
      const commissionValue = Number((Math.max(totalServices + labor, 0) * 0.08).toFixed(2));
      await prisma.financialTransaction.create({
        data: {
          tenantId: tenant.id,
          type: 'EXPENSE',
          amount: commissionValue,
          description: `${MARKER} Comissao estimada equipe OS ${os.id.slice(0, 8)}`,
          category: 'comissao_equipe',
          referenceId: os.id,
          referenceType: 'service_order',
          date: paidAt ?? new Date(),
        },
      });
    }

    created++;
  }

  const countByChief = await Promise.all(
    chiefs.map(async (chief) => {
      const count = await prisma.serviceOrder.count({
        where: { tenantId: tenant.id, mechanicId: chief.id, notes: { contains: MARKER } },
      });
      return { chief: chief.name, count };
    }),
  );

  console.log(`\nSeed concluido no tenant ${tenant.name}`);
  console.log(`Roles usados -> chefe: ${rolesConfig.chiefRole}; produtivos: ${rolesConfig.productiveRoleA}/${rolesConfig.productiveRoleB}`);
  console.log(`O.S criadas nesta execucao: ${created}`);
  console.log(`O.S com marker no total: ${existing + created}`);
  for (const item of countByChief) {
    console.log(` - ${item.chief}: ${item.count} O.S`);
  }
  console.log(`Marker utilizado: ${MARKER}`);
}

main()
  .catch((error) => {
    console.error('Erro no seed BI 35:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
