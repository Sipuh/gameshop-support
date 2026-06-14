import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('❌ Использование: npx tsx prisma/create-user.ts email@example.com mypassword [Имя] [admin]');
    console.log('');
    console.log('Примеры:');
    console.log('  npx tsx prisma/create-user.ts admin@gameshop.ru admin123');
    console.log('  npx tsx prisma/create-user.ts ivan@mail.ru 123456 Иван admin');
    process.exit(1);
  }

  const email = args[0];
  const password = args[1];
  const name = args[2] || 'Пользователь';
  const role = args[3] || 'admin';

  // Хэшируем пароль
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });
    console.log(`✅ Пользователь создан:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Пароль: ${password}`);
    console.log(`   Имя: ${user.name}`);
    console.log(`   Роль: ${user.role}`);
  } catch (error) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'P2002') {
      console.error(`❌ Пользователь с email "${email}" уже существует!`);
    } else {
      console.error('❌ Ошибка:', err.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
