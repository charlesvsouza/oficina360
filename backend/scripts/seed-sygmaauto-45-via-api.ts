import axios from 'axios';
import { JobFunction, UserRole, WorkshopArea } from '@prisma/client';

const API_URL = process.env.BACKEND_URL || 'https://sygmaauto-api-production.up.railway.app';
const MASTER_EMAIL = process.env.MASTER_EMAIL;
const MASTER_PASSWORD = process.env.MASTER_PASSWORD;
const TENANT_EXPECTED = 'sygma auto';
const MARKER = 'AUTOLOAD45API';
let LEGACY_MODE = false;

if (!MASTER_EMAIL || !MASTER_PASSWORD) {
  throw new Error('Defina MASTER_EMAIL e MASTER_PASSWORD para executar este script.');
}

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
  { name: 'Carlos Mendes', email: 'carlos.chefe.mecanica@sygmaauto.local', role: 'CHEFE_OFICINA', jobFunction: 'CHEFE_OFICINA', workshopArea: 'MECANICA', commissionPercent: 2.5 },
  { name: 'Mariana Rocha', email: 'mariana.chefe.funilaria@sygmaauto.local', role: 'CHEFE_OFICINA', jobFunction: 'CHEFE_OFICINA', workshopArea: 'FUNILARIA_PINTURA', commissionPercent: 2.5 },
  { name: 'Eduardo Lima', email: 'eduardo.chefe.higienizacao@sygmaauto.local', role: 'CHEFE_OFICINA', jobFunction: 'CHEFE_OFICINA', workshopArea: 'HIGIENIZACAO_EMBELEZAMENTO', commissionPercent: 2.5 },
  { name: 'Joao Ferreira', email: 'joao.mecanico@sygmaauto.local', role: 'MECANICO', jobFunction: 'MECANICO', workshopArea: 'MECANICA', chiefEmail: 'carlos.chefe.mecanica@sygmaauto.local' },
  { name: 'Paulo Henrique', email: 'paulo.eletricista@sygmaauto.local', role: 'MECANICO', jobFunction: 'ELETRICISTA', workshopArea: 'ELETRICA', chiefEmail: 'carlos.chefe.mecanica@sygmaauto.local' },
  { name: 'Rafael Souza', email: 'rafael.aprendiz@sygmaauto.local', role: 'MECANICO', jobFunction: 'APRENDIZ', workshopArea: 'MECANICA', chiefEmail: 'carlos.chefe.mecanica@sygmaauto.local' },
  { name: 'Fabio Nunes', email: 'fabio.funileiro@sygmaauto.local', role: 'MECANICO', jobFunction: 'FUNILEIRO', workshopArea: 'FUNILARIA_PINTURA', chiefEmail: 'mariana.chefe.funilaria@sygmaauto.local' },
  { name: 'Aline Prado', email: 'aline.pintora@sygmaauto.local', role: 'MECANICO', jobFunction: 'PINTOR', workshopArea: 'FUNILARIA_PINTURA', chiefEmail: 'mariana.chefe.funilaria@sygmaauto.local' },
  { name: 'Renata Alves', email: 'renata.preparadora@sygmaauto.local', role: 'MECANICO', jobFunction: 'PREPARADOR', workshopArea: 'FUNILARIA_PINTURA', chiefEmail: 'mariana.chefe.funilaria@sygmaauto.local' },
  { name: 'Bruno Cardoso', email: 'bruno.lavador@sygmaauto.local', role: 'MECANICO', jobFunction: 'LAVADOR', workshopArea: 'LAVACAO', chiefEmail: 'eduardo.chefe.higienizacao@sygmaauto.local' },
  { name: 'Tiago Ramos', email: 'tiago.martelinho@sygmaauto.local', role: 'MECANICO', jobFunction: 'MARTELINHO_OURO', workshopArea: 'FUNILARIA_PINTURA', chiefEmail: 'mariana.chefe.funilaria@sygmaauto.local' },
  { name: 'Juliana Costa', email: 'juliana.embelezadora@sygmaauto.local', role: 'MECANICO', jobFunction: 'EMBELEZADOR_AUTOMOTIVO', workshopArea: 'HIGIENIZACAO_EMBELEZAMENTO', chiefEmail: 'eduardo.chefe.higienizacao@sygmaauto.local' },
  { name: 'Diego Silva', email: 'diego.servicos.gerais@sygmaauto.local', role: 'MECANICO', jobFunction: 'COLABORADOR_SERVICOS_GERAIS', workshopArea: 'MECANICA', chiefEmail: 'carlos.chefe.mecanica@sygmaauto.local' },
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

function areaLabel(area: WorkshopArea) {
  return String(area);
}

function mapLegacyRole(role: UserRole): UserRole {
  if (role === 'CHEFE_OFICINA') return 'GERENTE';
  return role;
}

async function main() {
  const loginRes = await axios.post(`${API_URL}/auth/login`, {
    email: MASTER_EMAIL,
    password: MASTER_PASSWORD,
  });

  const token = loginRes.data?.accessToken;
  const tenantName = String(loginRes.data?.tenant?.name || '');

  if (!token) {
    throw new Error('Falha no login: accessToken nao retornado.');
  }

  if (!tenantName.toLowerCase().includes(TENANT_EXPECTED)) {
    throw new Error(`Tenant autenticado nao e Sygma Auto. Tenant atual: ${tenantName}`);
  }

  const api = axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // Em alguns ambientes, este campo pode ainda nao estar exposto no DTO remoto.
  try {
    const meTenant = await api.get('/tenants/me');
    if (Object.prototype.hasOwnProperty.call(meTenant.data || {}, 'defaultCommissionPercent')) {
      await api.patch('/tenants/me', { defaultCommissionPercent: 1.5 });
    } else {
      console.log('Aviso: defaultCommissionPercent nao exposto em /tenants/me neste ambiente.');
    }
  } catch {
    console.log('Aviso: nao foi possivel atualizar defaultCommissionPercent via API neste ambiente.');
  }

  const usersRes = await api.get('/users');
  const users: any[] = Array.isArray(usersRes.data) ? usersRes.data : [];
  const userByEmail = new Map(users.map((u) => [String(u.email).toLowerCase(), u]));

  for (const member of TEAM_SEED) {
    const existing = userByEmail.get(member.email.toLowerCase());
    if (!existing) {
      let created: any;
      try {
        created = await api.post('/users', {
          name: member.name,
          email: member.email,
          password: 'Sygma@12345',
          role: member.role,
          jobFunction: member.jobFunction,
          workshopArea: member.workshopArea,
          commissionPercent: member.commissionPercent,
          isActive: true,
        });
      } catch {
        LEGACY_MODE = true;
        created = await api.post('/users', {
          name: member.name,
          email: member.email,
          password: 'Sygma@12345',
          role: mapLegacyRole(member.role),
          isActive: true,
        });
      }
      userByEmail.set(member.email.toLowerCase(), created.data);
    } else {
      try {
        await api.patch(`/users/${existing.id}`, {
          name: member.name,
          role: member.role,
          jobFunction: member.jobFunction,
          workshopArea: member.workshopArea,
          commissionPercent: member.commissionPercent,
          isActive: true,
        });
      } catch {
        LEGACY_MODE = true;
        await api.patch(`/users/${existing.id}`, {
          name: member.name,
          role: mapLegacyRole(member.role),
          isActive: true,
        });
      }
    }
  }

  // Refresh users and apply chief relationships.
  const usersRes2 = await api.get('/users');
  const users2: any[] = Array.isArray(usersRes2.data) ? usersRes2.data : [];
  const userByEmail2 = new Map(users2.map((u) => [String(u.email).toLowerCase(), u]));

  for (const member of TEAM_SEED) {
    if (LEGACY_MODE) break;
    const current = userByEmail2.get(member.email.toLowerCase());
    if (!current) continue;

    const chiefId = member.chiefEmail
      ? userByEmail2.get(member.chiefEmail.toLowerCase())?.id || null
      : null;

    await api.patch(`/users/${current.id}`, {
      name: member.name,
      role: member.role,
      jobFunction: member.jobFunction,
      workshopArea: member.workshopArea,
      commissionPercent: member.commissionPercent,
      chiefId,
      isActive: true,
    });
  }

  const servicesRes = await api.get('/services');
  const existingServices: any[] = Array.isArray(servicesRes.data) ? servicesRes.data : [];
  const serviceByName = new Map(existingServices.map((s) => [String(s.name), s]));

  for (const svc of SERVICES_SEED) {
    if (!serviceByName.has(svc.name)) {
      const created = await api.post('/services', svc);
      serviceByName.set(svc.name, created.data);
    }
  }

  const partsRes = await api.get('/inventory/parts');
  const existingParts: any[] = Array.isArray(partsRes.data) ? partsRes.data : [];
  const partBySku = new Map(existingParts.map((p) => [String(p.sku || ''), p]));

  for (const part of PARTS_SEED) {
    if (!partBySku.has(part.sku)) {
      const created = await api.post('/inventory/parts', {
        name: part.name,
        sku: part.sku,
        category: part.category,
        unitPrice: part.unitPrice,
        costPrice: part.costPrice,
        currentStock: 100,
        minStock: 5,
      });
      partBySku.set(part.sku, created.data);
    }
  }

  const customersRes = await api.get('/customers');
  const existingCustomers: any[] = Array.isArray(customersRes.data) ? customersRes.data : [];
  const customerByName = new Map(existingCustomers.map((c) => [String(c.name), c]));

  const vehiclesRes = await api.get('/vehicles');
  const existingVehicles: any[] = Array.isArray(vehiclesRes.data) ? vehiclesRes.data : [];
  const vehicleByPlate = new Map(existingVehicles.map((v) => [String(v.plate), v]));

  const ordersRes = await api.get('/service-orders');
  const existingOrders: any[] = Array.isArray(ordersRes.data) ? ordersRes.data : [];
  const orderByMarker = new Map<string, any>();
  for (const o of existingOrders) {
    const notes = String(o.notes || '');
    if (notes.includes(MARKER)) {
      const key = notes.split('-')[1]?.trim();
      if (key) orderByMarker.set(key, o);
    }
  }

  const usersRes3 = await api.get('/users');
  const allUsers: any[] = Array.isArray(usersRes3.data) ? usersRes3.data : [];
  const executors = allUsers.filter((u) => ['CHEFE_OFICINA', 'MECANICO', 'PRODUTIVO', 'GERENTE'].includes(String(u.role || '')));

  const executorsByArea = new Map<string, any[]>();
  for (const ex of executors) {
    const key = String(ex.workshopArea || 'MECANICA');
    const list = executorsByArea.get(key) || [];
    list.push(ex);
    executorsByArea.set(key, list);
  }

  const areaCycle: WorkshopArea[] = ['MECANICA', 'ELETRICA', 'FUNILARIA_PINTURA', 'LAVACAO', 'HIGIENIZACAO_EMBELEZAMENTO'];

  let createdCount = 0;

  for (let i = 1; i <= 45; i++) {
    const idx = String(i).padStart(3, '0');
    const processKey = `${MARKER}-${idx}`;

    if (orderByMarker.has(idx)) {
      continue;
    }

    const customerName = `Cliente Processo ${idx}`;
    let customer = customerByName.get(customerName);
    if (!customer) {
      const cRes = await api.post('/customers', {
        name: customerName,
        email: `cliente.processo.${idx}@example.com`,
        phone: `+55219999${String(1000 + i).slice(-4)}`,
        notes: processKey,
      });
      customer = cRes.data;
      customerByName.set(customerName, customer);
    }

    const plate = `SGA${String(1000 + i)}`;
    let vehicle = vehicleByPlate.get(plate);
    if (!vehicle) {
      const vRes = await api.post('/vehicles', {
        customerId: customer.id,
        plate,
        brand: ['Fiat', 'VW', 'Chevrolet', 'Toyota', 'Honda'][(i - 1) % 5],
        model: ['Uno', 'Gol', 'Onix', 'Corolla', 'Civic'][(i - 1) % 5],
        year: 2016 + ((i - 1) % 9),
        color: ['Preto', 'Branco', 'Prata', 'Vermelho', 'Cinza'][(i - 1) % 5],
        km: 45000 + i * 1200,
        notes: processKey,
      });
      vehicle = vRes.data;
      vehicleByPlate.set(plate, vehicle);
    }

    const area = areaCycle[(i - 1) % areaCycle.length];
    const areaServices = SERVICES_SEED.filter((s) => s.category === areaLabel(area));
    const areaParts = PARTS_SEED.filter((p) => p.category === areaLabel(area));

    const svcA = serviceByName.get(areaServices[0]?.name || SERVICES_SEED[0].name);
    const svcB = serviceByName.get(areaServices[1]?.name || SERVICES_SEED[1].name);
    const partA = partBySku.get(areaParts[0]?.sku || PARTS_SEED[0].sku);

    const areaUsers = executorsByArea.get(area) || executors;
    const assigneeA = areaUsers[(i - 1) % areaUsers.length];
    const assigneeB = areaUsers[i % areaUsers.length];
    const qtySvcA = Math.max(1, Math.round(Number(svcA.tmo || 1.5)));
    const qtySvcB = Math.max(1, Math.round(Number(svcB.tmo || 1.0)));

    let orderCreateRes: any;
    try {
      orderCreateRes = await api.post('/service-orders', {
        customerId: customer.id,
        vehicleId: vehicle.id,
        orderType: 'ORDEM_SERVICO',
        complaint: `Processo ${idx} - demanda na area ${area}`,
        notes: processKey,
        reserveStock: false,
        items: [
          {
            type: 'service',
            serviceId: svcA.id,
            assignedUserId: assigneeA?.id,
            description: `Servico principal ${processKey}`,
            quantity: qtySvcA,
            unitPrice: Number(svcA.hourlyRate || svcA.basePrice || 150),
          },
          {
            type: 'service',
            serviceId: svcB.id,
            assignedUserId: assigneeB?.id,
            description: `Servico complementar ${processKey}`,
            quantity: qtySvcB,
            unitPrice: Number(svcB.hourlyRate || svcB.basePrice || 120),
          },
          {
            type: 'part',
            partId: partA.id,
            description: `Peca aplicada ${processKey}`,
            quantity: 1 + (i % 2),
            unitPrice: Number(partA.unitPrice || 0),
          },
        ],
      });
    } catch {
      LEGACY_MODE = true;
      orderCreateRes = await api.post('/service-orders', {
        customerId: customer.id,
        vehicleId: vehicle.id,
        complaint: `Processo ${idx} - demanda na area ${area}`,
        notes: processKey,
        items: [
          {
            type: 'service',
            serviceId: svcA.id,
            description: `Servico principal ${processKey}`,
            quantity: qtySvcA,
            unitPrice: Number(svcA.hourlyRate || svcA.basePrice || 150),
          },
          {
            type: 'service',
            serviceId: svcB.id,
            description: `Servico complementar ${processKey}`,
            quantity: qtySvcB,
            unitPrice: Number(svcB.hourlyRate || svcB.basePrice || 120),
          },
          {
            type: 'part',
            partId: partA.id,
            description: `Peca aplicada ${processKey}`,
            quantity: 1 + (i % 2),
            unitPrice: Number(partA.unitPrice || 0),
          },
        ],
      });
    }

    const orderId = orderCreateRes.data?.id;
    if (!orderId) {
      throw new Error(`Falha ao criar ordem ${processKey}: id nao retornado`);
    }

    try {
      await api.patch(`/service-orders/${orderId}/status`, {
        status: 'APROVADO',
        adminOverride: true,
        notes: `Orcamento autorizado automaticamente ${processKey}`,
      });
    } catch {
      await api.patch(`/service-orders/${orderId}/status`, {
        status: 'APROVADO',
        adminOverride: true,
      });
    }

    createdCount++;
    console.log(`Processo criado: ${processKey}`);
  }

  const finalOrdersRes = await api.get('/service-orders');
  const finalOrders: any[] = Array.isArray(finalOrdersRes.data) ? finalOrdersRes.data : [];
  const approvedAuto = finalOrders.filter((o) => String(o.notes || '').includes(MARKER) && o.status === 'APROVADO').length;

  console.log('------------------------------------------');
  console.log(`Tenant validado: ${tenantName}`);
  console.log('Comissao global configurada: 1.5%');
  console.log(LEGACY_MODE ? 'Ambiente legado detectado: chefes mapeados para GERENTE e campos novos ignorados.' : 'Chefes de oficina comissao individual: 2.5%');
  console.log(`Novos processos criados nesta execucao: ${createdCount}`);
  console.log(`Total processos ${MARKER} em APROVADO: ${approvedAuto}`);
  console.log('------------------------------------------');
}

main().catch((err) => {
  console.error(err?.response?.data || err);
  process.exit(1);
});
