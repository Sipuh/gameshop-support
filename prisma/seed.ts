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
      name: 'На двоих (Кооператив)',
      description: 'Игры для совместного прохождения',
      colorClass: 'c-purple',
      borderColor: '#a855f7',
      icon: '/images/coop.png',
      order: 6,
      subCategories: [
        { name: 'Экшн-кооператив', games: 'ARK Survival Ascended\nBorderlands 3\nResident Evil 5/6\nTiny Tina\'s PS4\nSplit Fiction PS5\nContra Operation Galuga', order: 1 },
        { name: 'Приключения', games: 'Baldurs Gate 3\nA Way Out\nIt Takes Two\nBrothers: A Tale of Two Sons PS5', order: 2 },
        { name: 'Файтинги / Спорт', games: 'UFC 4/5\nMortal Kombat 11/1\nInjustice 2\nFIFA 24\nGran Turismo 7\nNBA 24\nTekken 7/8', order: 3 },
        { name: 'Платформеры / Казуальные', games: 'SpongeBob (только кооператив)\nSackboy\nOvercooked\nCrash Bandicoot Trilogy + CTR Nitro Fueled\nCuphead\nUnravel Two', order: 4 },
        { name: 'Гонки', games: 'WRC 10\nCARS 3\nTeam Sonic Racing', order: 5 },
      ],
    },
    {
      key: 'racing',
      name: 'Гонки',
      description: 'Гоночные симуляторы и аркады',
      colorClass: 'c-orange',
      borderColor: '#f97316',
      icon: '/images/racing.png',
      order: 7,
      subCategories: [
        { name: 'Симуляторы', games: 'Assetto Corsa Competizione\nGran Turismo 7\nEA Sports WRC\nF1 2023\nWRC 10', order: 1 },
        { name: 'Аркадные гонки', games: 'The Crew Motorsport\nNFS Unbound\nNeed for Speed (2015)\nNFS Heat\nNFS Payback\nThe Crew 2 Gold/Special Ed', order: 2 },
        { name: 'Внедорожники', games: 'Dirt 5\nSnowRunner\nMudRunner\nWreckfest\nCars 3', order: 3 },
        { name: 'Мотоциклы', games: 'MotoGP 23/22', order: 4 },
        { name: 'Казуальные', games: 'Hot Wheels Unleashed 1/2\nKayak VR Mirage\nTeam Sonic Racing', order: 5 },
      ],
    },
    {
      key: 'four_players',
      name: 'На четверых',
      description: 'Игры для компании до 4 человек',
      colorClass: 'c-pink',
      borderColor: '#ec4899',
      icon: '/images/four.png',
      order: 8,
      subCategories: [
        { name: 'Кооператив', games: 'Overcooked\nSackboy\nMinecraft\nGoat Simulator\nCrash Bandicoot (серия)\nDirt 5', order: 1 },
        { name: 'Приключения', games: 'Cars 3\nTiny Tina\'s Wonderland (PS5)', order: 2 },
      ],
    },
    {
      key: 'strategy',
      name: 'Стратегии',
      description: 'Тактические и стратегические игры',
      colorClass: 'c-teal',
      borderColor: '#14b8a6',
      icon: '/images/strategy.png',
      order: 9,
      subCategories: [
        { name: 'Тактика', games: 'Aliens: Dark Descent\nWorms Battlegrounds + WMD\nPlants vs Zombies: Garden Warfare', order: 1 },
        { name: 'Глобальные', games: 'Anno 1800\nSid Meier\'s Civilization\nMount & Blade 2', order: 2 },
        { name: 'Варгеймы', games: 'Warhammer 40000: Rogue Trader\nWarhammer Age of Sigmar: Realms of Ruin', order: 3 },
        { name: 'Симуляторы', games: 'MudRunner\nSnowRunner', order: 4 },
      ],
    },
    {
      key: 'adventure',
      name: 'Приключения / Одиночка',
      description: 'Сюжетные одиночные приключения',
      colorClass: 'c-blue',
      borderColor: '#3b82f6',
      icon: '/images/adventure.png',
      order: 10,
      subCategories: [
        { name: 'Сюжетные блокбастеры', games: 'Alan Wake 1/2\nAssassin\'s Creed (Odyssey/Valhalla/Mirage)\nCyberpunk 2077\nDeath Stranding\nSpider-Man (все части)\nStar Wars Jedi (оба)', order: 1 },
        { name: 'Хорроры', games: 'Bloodborne\nDead Space\nDemon Souls\nAmnesia\nThe Invincible\nChernobylite', order: 2 },
        { name: 'Экшн', games: 'Atomic Heart\nВедьмак 3\nDead Island 2\nDying Light 2\nElden Ring\nEvil West\nGhostrunner 2\nRoboCop', order: 3 },
        { name: 'Метроидвании', games: 'Blasphemous 2\nTunic\nPrince of Persia', order: 4 },
        { name: 'Головоломки', games: 'The Talos Principle 2\nDEATHLOOP\nWolfenstein', order: 5 },
      ],
    },
    {
      key: 'simulator',
      name: 'Симулятор',
      description: 'Симуляторы жизни, техники и физики',
      colorClass: 'c-yellow',
      borderColor: '#eab308',
      icon: '/images/simulator.png',
      order: 11,
      subCategories: [
        { name: 'Техника', games: 'Farming Tractor Simulator\nMudRunner\nSnowRunner', order: 1 },
        { name: 'Животные', games: 'Goat Simulator\nWobbledogs\nWay of the Hunter', order: 2 },
        { name: 'Физика', games: 'Human Fall Flat\nJob Simulator', order: 3 },
        { name: 'Парк', games: 'Jurassic World Evolution 2', order: 4 },
      ],
    },
    {
      key: 'stealth',
      name: 'Стелс-Экшн',
      description: 'Скрытные прохождения и тактические операции',
      colorClass: 'c-purple',
      borderColor: '#8b5cf6',
      icon: '/images/stealth.png',
      order: 12,
      subCategories: [
        { name: 'Стелс', games: 'Dishonored 2\nHitman 3\nSniper Elite 4/5\nGhost of Tsushima\nAliens: Dark Descent', order: 1 },
        { name: 'Экшн-стелс', games: 'A Plague Tale (обе части)\nBatman: Arkham Collection\nMetro (Exodus/Saga)', order: 2 },
      ],
    },
    {
      key: 'shooter',
      name: 'Шутер',
      description: 'Шутеры от первого и третьего лица',
      colorClass: 'c-orange',
      borderColor: '#f97316',
      icon: '/images/shooter.png',
      order: 13,
      subCategories: [
        { name: 'Тактические', games: 'Rainbow Six Siege\nInsurgency: Sandstorm\nPayDay 3\nBack 4 Blood', order: 1 },
        { name: 'Сюжетные', games: 'Atomic Heart\nAvatar\nCall of Duty (серия)\nBattlefield (серия)\nFar Cry 5/6\nSkull and Bones', order: 2 },
        { name: 'Выживание', games: 'DayZ\nDays Gone\nChernobylite\nA Plague Tale: Requiem', order: 3 },
        { name: 'Экшн-шутеры', games: 'Armored Core VI\nRatchet & Clank\nTiny Tina\'s Wonderlands', order: 4 },
      ],
    },
    {
      key: 'action_adventure',
      name: 'Приключенческий Боевик',
      description: 'Экшн-приключения с открытым миром',
      colorClass: 'c-purple',
      borderColor: '#a855f7',
      icon: '/images/action.png',
      order: 14,
      subCategories: [
        { name: 'Открытый мир', games: 'Cyberpunk 2077\nGTA V/Trilogy\nRed Dead Redemption 1/2\nHorizon\nWatch Dogs\nDays Gone\nHogwarts Legacy', order: 1 },
        { name: 'Сюжетные', games: 'Assassin\'s Creed (серия)\nGod of War (все части)\nUncharted\nMafia Trilogy\nA Way Out\nDetroit\nPrince of Persia\nBatman', order: 2 },
        { name: 'Ролевые', games: 'Borderlands 3\nAtomic Heart\nAlan Wake\nDevil May Cry 5', order: 3 },
      ],
    },
    {
      key: 'horror',
      name: 'Ужасы / Выживание',
      description: 'Хорроры на выживание',
      colorClass: 'c-pink',
      borderColor: '#d946ef',
      icon: '/images/horror.png',
      order: 15,
      subCategories: [
        { name: 'Классические', games: 'Resident Evil (серия)\nDead Space\nThe Callisto Protocol\nAlan Wake 2', order: 1 },
        { name: 'Кооперативные', games: 'Back 4 Blood\nDead Island 2\nDying Light 2\nThe Forest\nTexas Chain Saw Massacre', order: 2 },
        { name: 'Сюжетные', games: 'Dark Pictures (серия)\nThe Quarry\nLittle Nightmares\nScorn\nAmong Us\nMetro', order: 3 },
        { name: 'Выживание', games: 'Chernobylite\nDayZ', order: 4 },
      ],
    },
    {
      key: 'platformer',
      name: 'Платформер',
      description: 'Платформеры всех видов',
      colorClass: 'c-blue',
      borderColor: '#60a5fa',
      icon: '/images/platformer.png',
      order: 16,
      subCategories: [
        { name: '3D-платформеры', games: 'Sackboy\nSonic (Frontiers/Forces/Superstars)\nSpongeBob\nCrash Bandicoot 4\nRatchet & Clank\nKena: Bridge of Spirits', order: 1 },
        { name: '2D-платформеры', games: 'Cuphead\nUnravel Bundle\nLittle Big Planet 3', order: 2 },
        { name: 'Экшн-платформеры', games: 'Prince of Persia\nReturnal', order: 3 },
      ],
    },
    {
      key: 'rpg',
      name: 'Ролевая игра (RPG)',
      description: 'Ролевые игры всех поджанров',
      colorClass: 'c-teal',
      borderColor: '#2dd4bf',
      icon: '/images/rpg.png',
      order: 17,
      subCategories: [
        { name: 'JRPG', games: 'Final Fantasy 16\nTales of Arise', order: 1 },
        { name: 'Action RPG', games: 'Bloodborne\nCyberpunk 2077\nElden Ring\nWo Long\nSekiro\nLies of P\nLords of the Fallen\nRemnant 2', order: 2 },
        { name: 'CRPG', games: 'Baldur\'s Gate 3\nDiablo 2/4', order: 3 },
        { name: 'Открытый мир RPG', games: 'Skyrim\nHogwarts Legacy\nHorizon\nAtomic Heart\nDayZ\nForspoken', order: 4 },
        { name: 'Стелс-RPG', games: 'Among Us', order: 5 },
      ],
    },
    {
      key: 'bundles',
      name: 'Паки с играми',
      description: 'Сборники и комплекты игр',
      colorClass: 'c-yellow',
      borderColor: '#eab308',
      icon: '/images/bundles.png',
      order: 18,
      subCategories: [
        { name: 'Экшн-паки', games: 'Assassin\'s Creed Triple Pack\nBatman: Arkham Collection\nCrash Bandicoot Quadrilogy\nCuphead Bundle\nDevil May Cry 5 + Vergil\nEA Star Wars Triple\nFar Cry 5 + New Dawn\nGTA Trilogy', order: 1 },
        { name: 'Приключенческие паки', games: 'It Takes Two & A Way Out\nLittle Nightmares 1+2\nMafia Trilogy\nMetro Saga\nMiddle-earth Bundle\nSherlock Holmes Bundle\nTomb Raider Trilogy', order: 2 },
        { name: 'Семейные паки', games: 'LEGO DC Heroes/Villains\nMonopoly Pack\nOvercooked Bundle\nWorms Bundle', order: 3 },
        { name: 'Хоррор-паки', games: 'Resident Evil (разные сборники)', order: 4 },
        { name: 'Спортивные паки', games: 'Unravel Bundle', order: 5 },
      ],
    },
    {
      key: 'openworld',
      name: 'Открытый Мир',
      description: 'Игры с огромными открытыми мирами',
      colorClass: 'c-teal',
      borderColor: '#14b8a6',
      icon: '/images/openworld.png',
      order: 19,
      subCategories: [
        { name: 'Экшн-приключения', games: 'GTA V\nWatch Dogs\nAssassin\'s Creed (Одиссея/Вальгалла/Мираж)\nCyberpunk 2077\nHorizon\nRed Dead Redemption\nDays Gone', order: 1 },
        { name: 'RPG', games: 'Ведьмак 3\nSkyrim\nHogwarts Legacy\nBiomutant', order: 2 },
        { name: 'Хоррор', games: 'Death Stranding\nFar Cry 5/6\nDying Light 2', order: 3 },
      ],
    },
    {
      key: 'music_fighting_sandbox',
      name: 'Музыка / Файтинг / Песочница',
      description: 'Музыкальные, файтинги и песочницы',
      colorClass: 'c-pink',
      borderColor: '#ec4899',
      icon: '/images/music.png',
      order: 20,
      subCategories: [
        { name: 'Музыка', games: 'Beat Saber', order: 1 },
        { name: 'Файтинги', games: 'Mortal Kombat\nStreet Fighter\nTekken\nUFC', order: 2 },
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

  // Новые категории: Гайды, P2/P3 форматы, Деактивация Кик
  const extraCategories = [
    {
      key: 'guides',
      name: 'Гайды',
      description: 'Полезные гайды и инструкции',
      colorClass: 'c-blue',
      borderColor: '#3b82f6',
      icon: '/images/guides.png',
      order: 21,
    },
    {
      key: 'p2p3',
      name: 'P2/P3 форматы',
      description: 'Информация о форматах P2 и P3',
      colorClass: 'c-teal',
      borderColor: '#14b8a6',
      icon: '/images/p2p3.png',
      order: 22,
    },
    {
      key: 'deactivation',
      name: 'Деактивация Кик',
      description: 'Инструкции по деактивации и кику',
      colorClass: 'c-orange',
      borderColor: '#f97316',
      icon: '/images/deactivation.png',
      order: 23,
    },
  ];

  for (const cat of extraCategories) {
    await prisma.category.upsert({
      where: { key: cat.key },
      update: { name: cat.name, description: cat.description, colorClass: cat.colorClass, borderColor: cat.borderColor, icon: cat.icon, order: cat.order },
      create: { key: cat.key, name: cat.name, description: cat.description, colorClass: cat.colorClass, borderColor: cat.borderColor, icon: cat.icon, order: cat.order },
    });
    console.log(`Категория "${cat.name}" создана`);
  }

  // Гайды (isGuide = true)
  const guideData = [
    {
      title: 'Как настроить P2 формат на PS4/PS5',
      code: null,
      description: 'Пошаговая инструкция по настройке P2 формата для совместной игры.',
      solution: '1. Зайдите в настройки сети\n2. Выберите Настроить подключение\n3. Выберите P2P (Peer-to-Peer)\n4. Подтвердите изменения\n5. Перезагрузите консоль',
      categoryKey: 'p2p3',
      isGuide: true,
    },
    {
      title: 'Что такое P3 формат и как его использовать',
      code: null,
      description: 'Объяснение формата P3 и его преимущества для мультиплеера.',
      solution: 'P3 формат — это режим подключения через выделенный сервер.\n\nПреимущества:\n• Стабильное соединение\n• Меньше лагов\n• Лучшая синхронизация',
      categoryKey: 'p2p3',
      isGuide: true,
    },
    {
      title: 'Деактивация приставки (Кик)',
      code: null,
      description: 'Инструкция по деактивации PlayStation для освобождения активации.',
      solution: '1. Зайдите в Настройки\n2. Выберите Управление аккаунтом\n3. Активировать как основную\n4. Нажмите Деактивировать\n5. Подтвердите действие',
      categoryKey: 'deactivation',
      isGuide: true,
    },
    {
      title: 'Как форматировать HDD на PS4',
      code: null,
      description: 'Гайд по форматированию жёсткого диска на PS4.',
      solution: '1. Выключите консоль\n2. Зажмите кнопку питания 7 секунд (до 2-го писка)\n3. Подключите геймпад через USB\n4. Выберите Initialize PS4\n5. Выберите Full Format\nВнимание: все данные будут удалены!',
      categoryKey: 'guides',
      isGuide: true,
    },
    {
      title: 'Перенос данных с PS4 на PS5',
      code: null,
      description: 'Как перенести сохранения и игры с PS4 на PS5.',
      solution: '1. Убедитесь, что обе консоли подключены к одной сети\n2. На PS5 зайдите в Настройки > Система > Перенос данных\n3. Следуйте инструкциям на экране\n4. Перенос может занять до 1 часа',
      categoryKey: 'guides',
      isGuide: true,
    },
  ];

  for (const guide of guideData) {
    const cat = await prisma.category.findUnique({ where: { key: guide.categoryKey } });
    if (!cat) continue;
    const existing = await prisma.article.findFirst({ where: { title: guide.title } });
    if (!existing) {
      await prisma.article.create({
        data: {
          title: guide.title,
          code: guide.code,
          description: guide.description,
          solution: guide.solution,
          categoryId: cat.id,
          isGuide: true,
          order: 1,
        },
      });
      console.log(`Гайд "${guide.title}" создан`);
    }
  }

  console.log(`Создано ${extraCategories.length} дополнительных категорий`);

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