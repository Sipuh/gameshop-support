import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

  // Категории (техподдержка)
  const supportCategoryData = [
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
    supportCategoryData.map(async (cat) => {
      const category = await prisma.category.upsert({
        where: { key: cat.key },
        update: {},
        create: { ...cat },
      });
      return category;
    })
  );
  console.log(`Создано ${categories.length} категорий поддержки`);

  // Создаём новые игровые категории с подкатегориями
  const gameCategories: {
    key: string;
    name: string;
    description: string;
    colorClass: string;
    borderColor: string;
    icon: string;
    order: number;
    subCategories: { name: string; games: string; order: number }[];
  }[] = [
    {
      key: 'coop',
      name: '🎮 На двоих (Кооператив)',
      description: 'Лучшие игры для совместного прохождения',
      colorClass: 'c-purple',
      borderColor: '#a855f7',
      icon: '/images/coop.png',
      order: 6,
      subCategories: [
        { name: 'Экшн-кооператив', games: 'ARK Survival Ascended, Borderlands 3, Resident Evil 5/6, Tiny Tina\'s PS4, Split Fiction PS5, Contra Operation Galuga', order: 1 },
        { name: 'Приключения', games: 'Baldurs Gate 3, A Way Out, It Takes Two, Brothers: A Tale of Two Sons PS5', order: 2 },
        { name: 'Файтинги / Спорт', games: 'UFC 4/5, Mortal Kombat 11/1, Injustice 2, FIFA 24, Gran Turismo 7, NBA 24, Tekken 7/8', order: 3 },
        { name: 'Платформеры / Казуальные', games: 'SpongeBob (только кооператив), Sackboy, Overcooked, Crash Bandicoot Trilogy + CTR Nitro Fueled, Cuphead, Unravel Two', order: 4 },
        { name: 'Гонки', games: 'WRC 10, CARS 3, Team Sonic Racing', order: 5 },
      ],
    },
    {
      key: 'racing',
      name: '🏎 Гонки',
      description: 'Гоночные симуляторы и аркады',
      colorClass: 'c-orange',
      borderColor: '#f97316',
      icon: '/images/racing.png',
      order: 7,
      subCategories: [
        { name: 'Симуляторы', games: 'Assetto Corsa Competizione, Gran Turismo 7, EA Sports WRC, F1 2023, WRC 10', order: 1 },
        { name: 'Аркадные гонки', games: 'The Crew Motorsport, NFS Unbound, Need for Speed (2015), NFS Heat, NFS Payback, The Crew 2 Gold/Special Ed', order: 2 },
        { name: 'Внедорожники', games: 'Dirt 5, SnowRunner, MudRunner, Wreckfest, Cars 3', order: 3 },
        { name: 'Мотоциклы', games: 'MotoGP 23/22', order: 4 },
        { name: 'Казуальные', games: 'Hot Wheels Unleashed 1/2, Kayak VR Mirage, Team Sonic Racing', order: 5 },
      ],
    },
    {
      key: 'four_players',
      name: '👥 На четверых',
      description: 'Игры для компании до 4 человек',
      colorClass: 'c-pink',
      borderColor: '#ec4899',
      icon: '/images/four.png',
      order: 8,
      subCategories: [
        { name: 'Кооператив', games: 'Overcooked, Sackboy, Minecraft, Goat Simulator, Crash Bandicoot (серия), Dirt 5', order: 1 },
        { name: 'Приключения', games: 'Cars 3, Tiny Tina\'s Wonderland (PS5)', order: 2 },
      ],
    },
    {
      key: 'strategy',
      name: '⚔️ Стратегии',
      description: 'Тактические и стратегические игры',
      colorClass: 'c-teal',
      borderColor: '#14b8a6',
      icon: '/images/strategy.png',
      order: 9,
      subCategories: [
        { name: 'Тактика', games: 'Aliens: Dark Descent, Worms Battlegrounds + WMD, Plants vs Zombies: Garden Warfare', order: 1 },
        { name: 'Глобальные', games: 'Anno 1800, Sid Meier\'s Civilization, Mount & Blade 2', order: 2 },
        { name: 'Варгеймы', games: 'Warhammer 40000: Rogue Trader, Warhammer Age of Sigmar: Realms of Ruin', order: 3 },
        { name: 'Симуляторы', games: 'MudRunner, SnowRunner', order: 4 },
      ],
    },
    {
      key: 'adventure',
      name: '🕵️ Приключения / Одиночка',
      description: 'Сюжетные одиночные приключения',
      colorClass: 'c-blue',
      borderColor: '#3b82f6',
      icon: '/images/adventure.png',
      order: 10,
      subCategories: [
        { name: 'Сюжетные блокбастеры', games: 'Alan Wake 1/2, Assassin\'s Creed (Odyssey/Valhalla/Mirage), Cyberpunk 2077, Death Stranding, Spider-Man (все части), Star Wars Jedi (оба)', order: 1 },
        { name: 'Хорроры', games: 'Bloodborne, Dead Space, Demon Souls, The Invincible, Chernobylite', order: 2 },
        { name: 'Экшн', games: 'Atomic Heart, Ведьмак 3, Dead Island 2, Dying Light 2, Elden Ring, Evil West, Ghostrunner 2, RoboCop', order: 3 },
        { name: 'Метроидвании', games: 'Blasphemous 2, Tunic, Prince of Persia', order: 4 },
        { name: 'Головоломки', games: 'The Talos Principle 2, DEATHLOOP, Wolfenstein', order: 5 },
      ],
    },
    {
      key: 'simulator',
      name: '🚜 Симулятор',
      description: 'Симуляторы жизни, техники и физики',
      colorClass: 'c-yellow',
      borderColor: '#eab308',
      icon: '/images/simulator.png',
      order: 11,
      subCategories: [
        { name: 'Техника', games: 'Farming Tractor Simulator, MudRunner, SnowRunner', order: 1 },
        { name: 'Животные', games: 'Goat Simulator, Wobbledogs, Way of the Hunter', order: 2 },
        { name: 'Физика', games: 'Human Fall Flat, Job Simulator', order: 3 },
        { name: 'Парк', games: 'Jurassic World Evolution 2', order: 4 },
      ],
    },
    {
      key: 'stealth',
      name: '🥷 Стелс-Экшн',
      description: 'Скрытные прохождения и тактические операции',
      colorClass: 'c-purple',
      borderColor: '#8b5cf6',
      icon: '/images/stealth.png',
      order: 12,
      subCategories: [
        { name: 'Стелс', games: 'Dishonored 2, Hitman 3, Sniper Elite 4/5, Ghost of Tsushima, Aliens: Dark Descent', order: 1 },
        { name: 'Экшн-стелс', games: 'A Plague Tale (обе части), Batman: Arkham Collection, Metro (Exodus/Saga)', order: 2 },
      ],
    },
    {
      key: 'shooter',
      name: '🔫 Шутер',
      description: 'Шутеры от первого и третьего лица',
      colorClass: 'c-orange',
      borderColor: '#f97316',
      icon: '/images/shooter.png',
      order: 13,
      subCategories: [
        { name: 'Тактические', games: 'Rainbow Six Siege, Insurgency: Sandstorm, PayDay 3, Back 4 Blood', order: 1 },
        { name: 'Сюжетные', games: 'Atomic Heart, Avatar, Call of Duty (серия), Battlefield (серия), Far Cry 5/6, Skull and Bones', order: 2 },
        { name: 'Выживание', games: 'DayZ, Days Gone, Chernobylite, A Plague Tale: Requiem', order: 3 },
        { name: 'Экшн-шутеры', games: 'Armored Core VI, Ratchet & Clank, Tiny Tina\'s Wonderlands', order: 4 },
      ],
    },
    {
      key: 'action_adventure',
      name: '🗡 Приключенческий Боевик',
      description: 'Экшн-приключения с открытым миром',
      colorClass: 'c-purple',
      borderColor: '#a855f7',
      icon: '/images/action.png',
      order: 14,
      subCategories: [
        { name: 'Открытый мир', games: 'Cyberpunk 2077, GTA V/Trilogy, Red Dead Redemption 1/2, Horizon, Watch Dogs, Days Gone, Hogwarts Legacy', order: 1 },
        { name: 'Сюжетные', games: 'Assassin\'s Creed (серия), God of War (все части), Uncharted, Mafia Trilogy, A Way Out, Detroit, Prince of Persia, Batman', order: 2 },
        { name: 'Ролевые', games: 'Borderlands 3, Atomic Heart, Alan Wake, Devil May Cry 5', order: 3 },
      ],
    },
    {
      key: 'horror',
      name: '😱 Ужасы / Выживание',
      description: 'Хорроры на выживание',
      colorClass: 'c-pink',
      borderColor: '#d946ef',
      icon: '/images/horror.png',
      order: 15,
      subCategories: [
        { name: 'Классические', games: 'Resident Evil (серия), Dead Space, The Callisto Protocol, Alan Wake 2', order: 1 },
        { name: 'Кооперативные', games: 'Back 4 Blood, Dead Island 2, Dying Light 2, The Forest, Texas Chain Saw Massacre', order: 2 },
        { name: 'Сюжетные', games: 'Dark Pictures (серия), The Quarry, Little Nightmares, Scorn, Among Us, Metro', order: 3 },
        { name: 'Выживание', games: 'Chernobylite, DayZ', order: 4 },
      ],
    },
    {
      key: 'platformer',
      name: '🎮 Платформер',
      description: 'Платформеры всех видов',
      colorClass: 'c-blue',
      borderColor: '#60a5fa',
      icon: '/images/platformer.png',
      order: 16,
      subCategories: [
        { name: '3D-платформеры', games: 'Sackboy, Sonic (Frontiers/Forces/Superstars), SpongeBob, Crash Bandicoot 4, Ratchet & Clank, Kena: Bridge of Spirits', order: 1 },
        { name: '2D-платформеры', games: 'Cuphead, Unravel Bundle, Little Big Planet 3', order: 2 },
        { name: 'Экшн-платформеры', games: 'Prince of Persia, Returnal', order: 3 },
      ],
    },
    {
      key: 'rpg',
      name: '🧙 Ролевая игра (RPG)',
      description: 'Ролевые игры всех поджанров',
      colorClass: 'c-teal',
      borderColor: '#2dd4bf',
      icon: '/images/rpg.png',
      order: 17,
      subCategories: [
        { name: 'JRPG', games: 'Final Fantasy 16, Tales of Arise', order: 1 },
        { name: 'Action RPG', games: 'Bloodborne, Cyberpunk 2077, Elden Ring, Wo Long, Sekiro, Lies of P, Lords of the Fallen, Remnant 2', order: 2 },
        { name: 'CRPG', games: 'Baldur\'s Gate 3, Diablo 2/4', order: 3 },
        { name: 'Открытый мир RPG', games: 'Skyrim, Hogwarts Legacy, Horizon, Atomic Heart, DayZ, Forspoken', order: 4 },
        { name: 'Стелс-RPG', games: 'Among Us, Atomic Heart', order: 5 },
      ],
    },
    {
      key: 'bundles',
      name: '📦 Паки с играми',
      description: 'Сборники и комплекты игр',
      colorClass: 'c-yellow',
      borderColor: '#eab308',
      icon: '/images/bundles.png',
      order: 18,
      subCategories: [
        { name: 'Экшн-паки', games: 'Assassin\'s Creed Triple Pack, Batman: Arkham Collection, Crash Bandicoot Quadrilogy, Cuphead Bundle, Devil May Cry 5 + Vergil, EA Star Wars Triple, Far Cry 5 + New Dawn, GTA Trilogy', order: 1 },
        { name: 'Приключенческие паки', games: 'It Takes Two & A Way Out, Little Nightmares 1+2, Mafia Trilogy, Metro Saga, Middle-earth Bundle, Sherlock Holmes Bundle, Tomb Raider Trilogy', order: 2 },
        { name: 'Семейные паки', games: 'LEGO DC Heroes/Villains, Monopoly Pack, Overcooked Bundle, Worms Bundle', order: 3 },
        { name: 'Хоррор-паки', games: 'Resident Evil (разные сборники)', order: 4 },
        { name: 'Спортивные паки', games: 'Unravel Bundle', order: 5 },
      ],
    },
    {
      key: 'openworld',
      name: '🌍 Открытый Мир',
      description: 'Игры с огромными открытыми мирами',
      colorClass: 'c-teal',
      borderColor: '#14b8a6',
      icon: '/images/openworld.png',
      order: 19,
      subCategories: [
        { name: 'Экшн-приключения', games: 'GTA V, Watch Dogs, Assassin\'s Creed (Одиссея/Вальгалла/Мираж), Cyberpunk 2077, Horizon, Red Dead Redemption, Days Gone', order: 1 },
        { name: 'RPG', games: 'Ведьмак 3, Skyrim, Hogwarts Legacy, Biomutant', order: 2 },
        { name: 'Хоррор', games: 'Death Stranding, Far Cry 5/6, Dying Light 2', order: 3 },
      ],
    },
    {
      key: 'music_fighting_sandbox',
      name: '🎸 Музыка / Файтинг / Песочница',
      description: 'Музыкальные, файтинги и песочницы',
      colorClass: 'c-pink',
      borderColor: '#ec4899',
      icon: '/images/music.png',
      order: 20,
      subCategories: [
        { name: 'Музыка', games: 'Beat Saber', order: 1 },
        { name: 'Файтинги', games: 'Mortal Kombat, Street Fighter, Tekken, UFC', order: 2 },
        { name: 'Песочница', games: 'Minecraft', order: 3 },
      ],
    },
  ];

  for (const catData of gameCategories) {
    const category = await prisma.category.upsert({
      where: { key: catData.key },
      update: { name: catData.name, description: catData.description, colorClass: catData.colorClass, borderColor: catData.borderColor, icon: catData.icon, order: catData.order },
      create: { key: catData.key, name: catData.name, description: catData.description, colorClass: catData.colorClass, borderColor: catData.borderColor, icon: catData.icon, order: catData.order },
    });
    console.log(`Категория "${catData.name}" создана`);

    // Удаляем старые подкатегории и создаём новые
    await prisma.subCategory.deleteMany({ where: { categoryId: category.id } });
    for (const sub of catData.subCategories) {
      await prisma.subCategory.create({
        data: { name: sub.name, games: sub.games, categoryId: category.id, order: sub.order },
      });
    }
    console.log(`  Создано ${catData.subCategories.length} подкатегорий`);
  }

  console.log(`Создано ${gameCategories.length} игровых категорий`);

  // Статьи (примеры)
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

  const categoryMap = new Map(supportCategoryData.map((c) => [c.key, null as any]));
  for (const c of await prisma.category.findMany()) categoryMap.set(c.key, c);
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