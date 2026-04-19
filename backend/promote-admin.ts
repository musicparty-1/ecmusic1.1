import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.log('Uso: npx.cmd ts-node promote-admin.ts <email>');
    return;
  }

  const user = await (prisma as any).dJUser.update({
    where: { email },
    data: { role: 'ADMIN' }
  });

  console.log(`Usuario ${user.email} ahora es ADMIN.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
