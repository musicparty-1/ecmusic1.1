const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('dj123456', 10);
  try {
    const dj = await prisma.dJUser.upsert({
      where: { email: 'dj@ecmusic.com' },
      update: { password: hashedPassword },
      create: {
        email: 'dj@ecmusic.com',
        name: 'DJ Demo',
        password: hashedPassword,
        plan: 'DEMO',
        subscriptionStatus: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    console.log('DJ creado exitosamente en Neon:', dj.email);
  } catch (e) {
    console.error('Error creando DJ:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
