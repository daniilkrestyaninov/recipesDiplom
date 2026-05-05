const { fakerRU: faker } = require('@faker-js/faker');
const { 
  sequelize, User, Role, Recipe, Ingredient, RecipeIngredient, 
  Category, Celebration, NationalKitchen, TypeCooking, Step, Unit 
} = require('./models');
const bcrypt = require('bcrypt');

const REAL_RECIPES = [
  {
    title: 'Классический Борщ',
    description: 'Традиционный украинский и русский суп на основе свеклы. Насыщенный, ароматный и очень сытный.',
    difficulty: '3',
    portion: 6,
    calorific: 250,
    cooking_time: 120,
    kitchen: 'Русская',
    category: 'Обеды',
    typeCooking: 'Варка',
    proteins: 10, fats: 12, carbohydrates: 15,
    ingredients: [
      { name: 'Говядина на кости', quantity: '500 г' },
      { name: 'Свекла', quantity: '2 шт.' },
      { name: 'Капуста', quantity: '300 г' },
      { name: 'Картофель', quantity: '3 шт.' },
      { name: 'Морковь', quantity: '1 шт.' },
      { name: 'Лук репчатый', quantity: '1 шт.' },
      { name: 'Томатная паста', quantity: '2 ст. л.' },
      { name: 'Уксус 9%', quantity: '1 ч. л.' },
      { name: 'Чеснок', quantity: '2 зубчика' }
    ],
    steps: [
      'Сварите наваристый бульон из говядины.',
      'Свеклу натрите на терке и обжарьте с томатной пастой и уксусом.',
      'Добавьте в бульон картофель, затем капусту.',
      'Соедините зажарку с бульоном и варите до готовности.',
      'В конце добавьте измельченный чеснок и зелень.'
    ]
  },
  {
    title: 'Домашние Пельмени',
    description: 'Любимое блюдо многих семей. Тонкое тесто и сочная мясная начинка.',
    difficulty: '4',
    portion: 4,
    calorific: 350,
    cooking_time: 90,
    kitchen: 'Русская',
    category: 'Обеды',
    typeCooking: 'Варка',
    proteins: 15, fats: 18, carbohydrates: 30,
    ingredients: [
      { name: 'Мука пшеничная', quantity: '500 г' },
      { name: 'Яйцо куриное', quantity: '1 шт.' },
      { name: 'Фарш (говядина + свинина)', quantity: '600 г' },
      { name: 'Лук репчатый', quantity: '2 шт.' },
      { name: 'Вода', quantity: '200 мл' },
      { name: 'Соль, перец', quantity: 'по вкусу' }
    ],
    steps: [
      'Замесите крутое тесто из муки, воды и яйца.',
      'Приготовьте фарш, добавив мелко нарезанный лук и специи.',
      'Раскатайте тесто и вырежьте кружочки.',
      'Выложите начинку и слепите пельмени.',
      'Варите в кипящей подсоленной воде 5-7 минут после всплытия.'
    ]
  },
  {
    title: 'Салат Оливье',
    description: 'Король праздничного стола. Классический рецепт с вареной колбасой.',
    difficulty: '2',
    portion: 4,
    calorific: 200,
    cooking_time: 40,
    kitchen: 'Русская',
    category: 'Ужины',
    celebration: 'Новый Год',
    typeCooking: 'Нарезка',
    proteins: 8, fats: 15, carbohydrates: 10,
    ingredients: [
      { name: 'Колбаса вареная', quantity: '300 г' },
      { name: 'Картофель вареный', quantity: '3 шт.' },
      { name: 'Морковь вареная', quantity: '1 шт.' },
      { name: 'Яйца вареные', quantity: '4 шт.' },
      { name: 'Огурцы маринованные', quantity: '3 шт.' },
      { name: 'Зеленый горошек', quantity: '1 банка' },
      { name: 'Майонез', quantity: '150 г' }
    ],
    steps: [
      'Нарежьте все ингредиенты мелкими кубиками.',
      'Слейте жидкость из горошка и добавьте к остальным ингредиентам.',
      'Заправьте салат майонезом.',
      'Тщательно перемешайте и охладите перед подачей.'
    ]
  },
  {
    title: 'Сырники из творога',
    description: 'Идеальный завтрак: нежные, воздушные и очень вкусные.',
    difficulty: '2',
    portion: 2,
    calorific: 280,
    cooking_time: 30,
    kitchen: 'Русская',
    category: 'Завтраки',
    typeCooking: 'Жарка',
    proteins: 18, fats: 10, carbohydrates: 20,
    ingredients: [
      { name: 'Творог 9%', quantity: '500 г' },
      { name: 'Яйцо куриное', quantity: '1 шт.' },
      { name: 'Сахар', quantity: '2 ст. л.' },
      { name: 'Мука пшеничная', quantity: '3 ст. л.' },
      { name: 'Ванилин', quantity: '1 щепотка' }
    ],
    steps: [
      'Смешайте творог с яйцом, сахаром и ванилином.',
      'Добавьте муку и замесите однородное тесто.',
      'Сформируйте небольшие шайбочки.',
      'Обжаривайте на сковороде с двух сторон до золотистой корочки.'
    ]
  },
  {
    title: 'Паста Карбонара',
    description: 'Классика итальянской кухни с беконом и сливочным соусом.',
    difficulty: '3',
    portion: 2,
    calorific: 450,
    cooking_time: 25,
    kitchen: 'Итальянская',
    category: 'Ужины',
    typeCooking: 'Варка',
    proteins: 12, fats: 25, carbohydrates: 40,
    ingredients: [
      { name: 'Спагетти', quantity: '200 г' },
      { name: 'Бекон', quantity: '100 г' },
      { name: 'Сливки 20%', quantity: '150 мл' },
      { name: 'Сыр Пармезан', quantity: '50 г' },
      { name: 'Яичный желток', quantity: '2 шт.' }
    ],
    steps: [
      'Отварите спагетти до состояния аль денте.',
      'Обжарьте бекон до хрустящей корочки.',
      'Смешайте сливки, желтки и тертый сыр.',
      'Добавьте спагетти к бекону, влейте соус и быстро перемешайте на слабом огне.'
    ]
  }
];

async function seed() {
  try {
    console.log('Cleaning up existing data...');
    await sequelize.query('TRUNCATE recipe_ingredients, steps, recipes, ingredients, users, roles, categories, celebrations, national_kitchens, type_cooking, units RESTART IDENTITY CASCADE');

    console.log('Seeding Roles...');
    const roles = await Role.bulkCreate([
      { name: 'Admin' },
      { name: 'User' },
      { name: 'Moderator' }
    ]);

    console.log('Seeding Users...');
    const hashedPassword = await bcrypt.hash('root', 10);
    const usersData = [];
    
    // Admin user
    usersData.push({
      username: 'admin',
      name: 'Администратор',
      bio: 'Главный по рецептам',
      avatar_url: faker.image.avatar(),
      email: 'admin@vkusno.ru',
      password: hashedPassword,
      role_id: roles[0].id,
      is_verified: true
    });

    for (let i = 0; i < 15; i++) {
      usersData.push({
        username: faker.internet.username(),
        name: faker.person.fullName(),
        bio: faker.lorem.sentence(),
        avatar_url: faker.image.avatar(),
        email: faker.internet.email(),
        password: hashedPassword,
        role_id: roles[1].id,
        is_verified: true
      });
    }
    const users = await User.bulkCreate(usersData);
    
    console.log('Seeding Units...');
    const unitsMap = {};
    const unitsList = [
      { name: 'Грамм', short_name: 'г' },
      { name: 'Миллилитр', short_name: 'мл' },
      { name: 'Штука', short_name: 'шт.' },
      { name: 'Столовая ложка', short_name: 'ст. л.' },
      { name: 'Чайная ложка', short_name: 'ч. л.' },
      { name: 'По вкусу', short_name: 'по вкусу' },
      { name: 'Стакан', short_name: 'стак.' },
      { name: 'Зубчик', short_name: 'зуб.' },
      { name: 'Щепотка', short_name: 'щеп.' },
      { name: 'Банка', short_name: 'банк.' }
    ];
    for (const u of unitsList) {
      const created = await Unit.create(u);
      unitsMap[u.short_name] = created.id;
    }

    console.log('Seeding Meta Tables...');
    const kitchens = await NationalKitchen.bulkCreate([
      { name: 'Русская', image_url: 'https://img.freepik.com/free-photo/traditional-russian-borscht-with-sour-cream_2829-19812.jpg' }, 
      { name: 'Итальянская', image_url: 'https://img.freepik.com/free-photo/delicious-italian-food-composition_23-2148161514.jpg' }, 
      { name: 'Грузинская', image_url: 'https://img.freepik.com/free-photo/khinkali-with-meat-herbs_2829-13589.jpg' }, 
      { name: 'Французская', image_url: 'https://img.freepik.com/free-photo/french-food-composition-with-croissants_23-2148161510.jpg' },
      { name: 'Японская', image_url: 'https://img.freepik.com/free-photo/top-view-sushi-set-with-soy-sauce-ginger_23-2148821815.jpg' }
    ]);
    const celebrations = await Celebration.bulkCreate([
      { name: 'День Рождения', image_url: 'https://img.freepik.com/free-photo/birthday-cake-with-candles_23-2148161517.jpg' }, 
      { name: 'Новый Год', image_url: 'https://img.freepik.com/free-photo/christmas-table-setting-with-sparklers_23-2148764032.jpg' }, 
      { name: 'Пасха', image_url: 'https://img.freepik.com/free-photo/easter-eggs-with-flowers_23-2148842617.jpg' },
      { name: 'Романтический ужин', image_url: 'https://img.freepik.com/free-photo/romantic-dinner-table-setting_23-2148821810.jpg' }
    ]);
    const typeCooking = await TypeCooking.bulkCreate([
      { name: 'Варка', image_url: 'https://img.freepik.com/free-photo/boiling-water-pot_23-2148161520.jpg' }, 
      { name: 'Жарка', image_url: 'https://img.freepik.com/free-photo/frying-meat-pan_23-2148161525.jpg' }, 
      { name: 'Запекание', image_url: 'https://img.freepik.com/free-photo/baking-tray-with-cookies_23-2148161530.jpg' },
      { name: 'Нарезка', image_url: 'https://img.freepik.com/free-photo/chef-cutting-vegetables_23-2148161535.jpg' }
    ]);
    const categories = await Category.bulkCreate([
      { name: 'Завтраки', description: 'Лучшее начало дня', image_url: 'https://img.freepik.com/free-photo/breakfast-table-with-pancakes-eggs_23-2148161540.jpg' },
      { name: 'Обеды', description: 'Сытные и полезные блюда', image_url: 'https://img.freepik.com/free-photo/lunch-table-with-soup-salad_23-2148161545.jpg' },
      { name: 'Ужины', description: 'Легкие и вкусные блюда для завершения дня', image_url: 'https://img.freepik.com/free-photo/dinner-table-with-pasta-wine_23-2148161550.jpg' },
      { name: 'Десерты', description: 'Сладкие моменты радости', image_url: 'https://img.freepik.com/free-photo/delicious-chocolate-cake_23-2148161555.jpg' },
      { name: 'Закуски', description: 'Для быстрого перекуса', image_url: 'https://img.freepik.com/free-photo/appetizers-table-with-cheese-olives_23-2148161560.jpg' }
    ]);

    console.log('Seeding Real Recipes...');
    for (const real of REAL_RECIPES) {
      const kitchenId = kitchens.find(k => k.name === real.kitchen)?.id;
      const categoryId = categories.find(c => c.name === real.category)?.id;
      const cookingId = typeCooking.find(t => t.name === real.typeCooking)?.id;
      const celebrationId = real.celebration ? celebrations.find(c => c.name === real.celebration)?.id : null;

      const recipe = await Recipe.create({
        user_id: faker.helpers.arrayElement(users).id,
        title: real.title,
        description: real.description,
        difficulty: real.difficulty,
        image_url: faker.image.urlLoremFlickr({ category: 'food,cooking' }),
        is_private: false,
        kitchen_id: kitchenId,
        celebration_id: celebrationId,
        cooking_id: cookingId,
        portion: real.portion,
        calorific: real.calorific,
        cooking_time: real.cooking_time,
        proteins: real.proteins,
        fats: real.fats,
        carbohydrates: real.carbohydrates
      });

      // Ingredients for this recipe
      for (const ingData of real.ingredients) {
        // Extract quantity and unit
        let quantity = '1';
        let unitShort = 'шт.';
        
        const match = ingData.quantity.match(/^([\d.,/-]+)\s*(.*)$/);
        if (match) {
          quantity = match[1];
          unitShort = match[2].trim() || 'шт.';
        }

        let ingredient = await Ingredient.findOne({ where: { name: ingData.name } });
        if (!ingredient) {
          ingredient = await Ingredient.create({
            name: ingData.name,
            unit_id: unitsMap[unitShort] || unitsMap['шт.']
          });
        }

        await RecipeIngredient.create({
          recipe_id: recipe.id,
          ingredient_id: ingredient.id,
          quantity: quantity,
          note: ''
        });
      }

      // Steps
      for (let i = 0; i < real.steps.length; i++) {
        await Step.create({
          recipe_id: recipe.id,
          step_number: i + 1,
          description: real.steps[i],
          image_url: faker.image.urlLoremFlickr({ category: 'cooking,process' })
        });
      }

      // Link Category
      if (categoryId) {
        await recipe.addCategory(categoryId);
      }
    }

    console.log('Seeding Randomized Recipes...');
    // Create more randomized ingredients
    const commonIngredients = [
      'Соль', 'Перец', 'Сахар', 'Мука', 'Масло растительное', 'Сливочное масло',
      'Молоко', 'Сметана', 'Курица', 'Свинина', 'Говядина', 'Рыба',
      'Рис', 'Гречка', 'Макароны', 'Помидоры', 'Огурцы', 'Зелень',
      'Яблоки', 'Бананы', 'Лимон', 'Мед', 'Орехи'
    ];

    for (const name of commonIngredients) {
      if (!await Ingredient.findOne({ where: { name } })) {
        await Ingredient.create({
          name,
          unit_id: faker.helpers.arrayElement(Object.values(unitsMap))
        });
      }
    }

    const allIngredients = await Ingredient.findAll();

    for (let i = 0; i < 30; i++) {
      const recipe = await Recipe.create({
        user_id: faker.helpers.arrayElement(users).id,
        title: faker.food.dish(),
        description: faker.food.description(),
        difficulty: faker.helpers.arrayElement(['1', '2', '3', '4', '5']),
        image_url: faker.image.urlLoremFlickr({ category: 'food' }),
        is_private: false,
        kitchen_id: faker.helpers.arrayElement(kitchens).id,
        celebration_id: faker.helpers.arrayElement([null, ...celebrations.map(c => c.id)]),
        cooking_id: faker.helpers.arrayElement(typeCooking).id,
        portion: faker.number.int({ min: 1, max: 8 }),
        calorific: faker.number.int({ min: 50, max: 1200 }),
        cooking_time: faker.number.int({ min: 10, max: 240 }),
        proteins: faker.number.float({ min: 1, max: 50, fractionDigits: 1 }),
        fats: faker.number.float({ min: 1, max: 50, fractionDigits: 1 }),
        carbohydrates: faker.number.float({ min: 1, max: 100, fractionDigits: 1 }),
      });

      // Categories
      const numCats = faker.number.int({ min: 1, max: 2 });
      const chosenCats = faker.helpers.arrayElements(categories, numCats);
      for (const cat of chosenCats) {
        await recipe.addCategory(cat.id);
      }

      // Ingredients
      const numIngs = faker.number.int({ min: 3, max: 10 });
      const chosenIngs = faker.helpers.arrayElements(allIngredients, numIngs);
      for (const ing of chosenIngs) {
        await RecipeIngredient.create({
          recipe_id: recipe.id,
          ingredient_id: ing.id,
          quantity: faker.number.int({ min: 1, max: 500 }).toString(),
          note: faker.helpers.arrayElement(['', 'мелко нарезать', 'по желанию', 'свежий'])
        });
      }

      // Steps
      const numSteps = faker.number.int({ min: 3, max: 7 });
      for (let s = 1; s <= numSteps; s++) {
        await Step.create({
          recipe_id: recipe.id,
          step_number: s,
          description: faker.lorem.paragraph(),
          image_url: faker.image.urlLoremFlickr({ category: 'cooking' })
        });
      }
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();

