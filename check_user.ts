import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log(`Всего пользователей: ${users.length}`);
  
  for (const u of users) {
    console.log(`- ${u.email} / role: ${u.role} / hash: ${u.password.substring(0, 20)}...`);
    const match = await bcrypt.compare('admin123', u.password);
    console.log(`  Пароль "admin123" совпадает: ${match}`);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);