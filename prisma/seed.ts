import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function loadImageAsBuffer(relativePath: string): Buffer | null {
  try {
    // Ищем файл относительно корня проекта
    const possiblePaths = [
      path.join(__dirname, '..', 'public', relativePath),
      path.join(__dirname, '..', relativePath),
    ];
    
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        console.log(`  Загружаю изображение: ${filePath}`);
        return fs.readFileSync(filePath);
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

async function main() {
  console.log('🌱 Seeding database...');

  // Создание пользователя-админа
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gameshop.ru' },
    update: {},
    create: {
      email: 'admin@gameshop.ru',
      password: hashedPassword,
      name: 'Администратор',
      role: 'admin',
    },
  });
  console.log(`Пользователь: ${admin.email} / пароль: admin123`);

  // Категории
  const categoryData = [
    {
      key: 'ps5',
      name: 'Ошибки PS5',
      description: 'Решение проблем с PlayStation 5: коды ошибок, сбои системы, подключение',
      colorClass: 'c-purple',
      borderColor: 'var(--purple-lite)',
      icon: '/images/PS-5.png',
      order: 1,
    },
    {
      key: 'ps4',
      name: 'Ошибки PS4',
      description: 'Решение проблем с PlayStation 4: коды ошибок, неполадки, гайды',
      colorClass: 'c-blue',
      borderColor: 'var(--cyan)',
      icon: '/images/PS-4.png',
      order: 2,
    },
    {
      key: 'network',
      name: 'Сетевые ошибки',
      description: 'Проблемы с подключением к PSN, Wi-Fi, NAT-тип, DNS',
      colorClass: 'c-teal',
      borderColor: 'var(--teal)',
      icon: '/images/Network.png',
      order: 3,
    },
    {
      key: 'account',
      name: 'Аккаунт и PSN',
      description: 'Восстановление аккаунта, двухфакторная аутентификация, подписки',
      colorClass: 'c-orange',
      borderColor: 'var(--orange)',
      icon: '/images/Users.png',
      order: 4,
    },
    {
      key: 'games',
      name: 'Магазин и покупки',
      description: 'Ошибки магазина, оплаты, загрузок и покупок',
      colorClass: 'c-purple',
      borderColor: 'var(--purple)',
      icon: '/images/Shop.png',
      order: 5,
    },
  ];

  const categories = await Promise.all(
    categoryData.map(async (cat) => {
      // Загружаем изображение в БД, если файл существует
      const imageBuffer = loadImageAsBuffer(cat.icon);
      
      const category = await prisma.category.upsert({
        where: { key: cat.key },
        update: {
          imageData: imageBuffer,
        },
        create: {
          ...cat,
          imageData: imageBuffer,
        },
      });
      
      if (imageBuffer) {
        console.log(`  Изображение для "${cat.name}": ${imageBuffer.length} байт`);
      } else {
        console.log(`  Изображение для "${cat.name}": файл не найден (${cat.icon})`);
      }
      
      return category;
    })
  );
  console.log(`Создано ${categories.length} категорий`);

  // Статьи
  const articleData: {
    title: string;
    code: string | null;
    description: string;
    solution: string;
    categoryKey: string;
    order: number;
  }[] = [
    {
      title: 'Ошибка CE-108255-1',
      code: 'CE-108255-1',
      description: 'Ошибка CE-108255-1 возникает при запуске игры или приложения на PlayStation 5 и означает, что произошла непредвиденная ошибка системы.',
      solution: '1. Перезагрузите консоль PS5\n2. Проверьте наличие обновлений системы\n3. Переустановите проблемную игру\n4. Восстановите лицензии\n5. Выполните восстановление базы данных в безопасном режиме',
      categoryKey: 'ps5',
      order: 1,
    },
    {
      title: 'Ошибка CE-34878-0',
      code: 'CE-34878-0',
      description: 'Игра вылетает без предупреждения на главный экран PS4/PS5.',
      solution: '1. Проверьте целостность данных игры\n2. Обновите игру\n3. Переустановите игру\n4. Восстановите БД через безопасный режим',
      categoryKey: 'ps5',
      order: 2,
    },
    {
      title: 'Ошибка SU-41333-4',
      code: 'SU-41333-4',
      description: 'Ошибка при обновлении системного ПО.',
      solution: '1. Загрузитесь в безопасном режиме\n2. Обновите ПО через интернет\n3. Используйте USB-накопитель',
      categoryKey: 'ps4',
      order: 1,
    },
    {
      title: 'PS4 не видит Wi-Fi сеть',
      code: null,
      description: 'Консоль PS4 не находит доступные Wi-Fi сети.',
      solution: '1. Перезагрузите роутер и консоль\n2. Проверьте фильтр MAC-адресов\n3. Попробуйте LAN-кабель',
      categoryKey: 'network',
      order: 1,
    },
    {
      title: 'Ошибка подключения к PSN',
      code: 'NW-102216-2',
      description: 'Ошибка при подключении к PlayStation Network.',
      solution: '1. Перезагрузите роутер и консоль\n2. Измените DNS на 8.8.8.8\n3. Настройте DMZ',
      categoryKey: 'network',
      order: 2,
    },
    {
      title: 'Ошибка NP-31984-9 при оплате',
      code: 'NP-31984-9',
      description: 'Ошибка при попытке оплаты в PlayStation Store.',
      solution: '1. Проверьте баланс карты\n2. Попробуйте другой способ оплаты\n3. Свяжитесь с поддержкой PSN',
      categoryKey: 'account',
      order: 1,
    },
  ];

  const categoryMap = new Map(categories.map((c) => [c.key, c]));
  for (const article of articleData) {
    const category = categoryMap.get(article.categoryKey);
    if (!category) continue;
    const existing = await prisma.article.findFirst({ where: { title: article.title } });
    if (!existing) {
      await prisma.article.create({
        data: {
          title: article.title,
          code: article.code,
          description: article.description,
          solution: article.solution,
          categoryId: category.id,
          order: article.order,
        },
      });
      console.log(`Статья "${article.title}" создана`);
    }
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });