import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Criando usuário Charles...');

  // Buscar tenant existente
  let tenant = await prisma.tenant.findFirst({
    where: { name: 'Oficina360' }
  });

  if (!tenant) {
    // Buscar por documento
    tenant = await prisma.tenant.findFirst({
      where: { document: '12.345.678/0001-90' }
    });
  }

  if (!tenant) {
    // Se não existir, criar novo
    tenant = await prisma.tenant.create({
      data: {
        name: 'Oficina360',
        document: '12.345.678/0001-90',
        email: 'contato@oficina360.com.br',
        phone: '(11) 99999-9999',
      }
    });
    console.log('✅ Tenant criado:', tenant.name);

    // Criar subscription trial
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { name: 'BASIC' }
    });
    
    if (plan) {
      const trialEnds = new Date();
      trialEnds.setDate(trialEnds.getDate() + 30);
      
      await prisma.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan.id,
          status: 'TRIALING',
          trialEndsAt: trialEnds,
          currentPeriodEnd: trialEnds,
        }
      });
      console.log('✅ Subscription trial criada');
    }
  } else {
    console.log('✅ Tenant encontrado:', tenant.name);
  }

  // Criar usuário Charles
  const passwordHash = await bcrypt.hash('7331Fg34*a', 10);

  const existingUser = await prisma.user.findFirst({
    where: { email: 'charles@oficina360.com.br' }
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        passwordHash,
        name: 'Charles Vasconcelos de Souza',
        role: 'ADMIN',
        isActive: true,
      }
    });
    console.log('✅ Usuário Charles atualizado');
  } else {
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'charles@oficina360.com.br',
        passwordHash,
        name: 'Charles Vasconcelos de Souza',
        role: 'ADMIN',
        isActive: true,
      }
    });
    console.log('✅ Usuário Charles criado');
  }

  console.log(`
╔════════════════════════════════════════════════════════╗
║           🎉 USUÁRIO CRIADO COM SUCESSO!           ║
╠════════════════════════════════════════════════════════╣
║  Email:    charles@oficina360.com.br               ║
║  Senha:   7331Fg34*a                               ║
║  Perfil:  ADMIN                                    ║
║  Tenant: Oficina360                                ║
╚════════════════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });