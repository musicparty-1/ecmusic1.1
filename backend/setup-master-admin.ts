import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'ecmusic@eventos.com';
  const pass = 'ec123456';
  const hashedPassword = await bcrypt.hash(pass, 10);

  const user = await (prisma as any).dJUser.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'ADMIN'
    },
    create: {
      email,
      password: hashedPassword,
      name: 'Master Admin',
      role: 'ADMIN',
      plan: 'PREMIUM',
      subscriptionStatus: 'ACTIVE'
    }
  });

  console.log(`Usuario Maestro ${user.email} configurado con éxito.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
