import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@example.com';
  const password = 'password123';
  const password_hash = await bcrypt.hash(password, 10);
  const user = await prisma.users.upsert({
    where: { email },
    update: {},
    create: { email, password_hash, email_verified_at: new Date() }
  });
  const template = await prisma.templates.upsert({
    where: { id: 'seed-template' },
    update: {},
    create: { id: 'seed-template', user_id: user.id, name: 'Welcome', subject: 'Hello {{ first_name }}', html: '<p>Hi {{ first_name }}</p>', text: 'Hi {{ first_name }}', variables: ['first_name'] as any }
  });
  console.log('Seeded user:', email, 'template:', template.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});


