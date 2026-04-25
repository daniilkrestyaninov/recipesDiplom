const { faker } = require('@faker-js/faker');
const { 
  sequelize, User, Role, Recipe, Ingredient, RecipeIngredient, 
  Category, Celebration, NationalKitchen, TypeCooking, Step 
} = require('./models');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    console.log('Cleaning up existing data...');
    // Clear in specific order to avoid FK issues
    await sequelize.query('TRUNCATE recipe_ingredients, steps, recipes, ingredients, users, roles, categories, celebrations, national_kitchens, type_cooking RESTART IDENTITY CASCADE');

    console.log('Seeding Roles...');
    const roles = await Role.bulkCreate([
      { name: 'Admin' },
      { name: 'User' },
      { name: 'Moderator' }
    ]);

    console.log('Seeding Users...');
    const hashedPassword = await bcrypt.hash('root', 10);
    const usersData = [];
    for (let i = 0; i < 5; i++) {
      usersData.push({
        username: faker.internet.username(),
        name: faker.person.fullName(),
        bio: faker.lorem.sentence(),
        avatar_url: faker.image.avatar(),
        email: faker.internet.email(),
        password: hashedPassword,
        role_id: roles[1].id
      });
    }
    const users = await User.bulkCreate(usersData);

    console.log('Seeding Meta Tables...');
    const kitchens = await NationalKitchen.bulkCreate([
      { name: 'Итальянская' }, { name: 'Русская' }, { name: 'Грузинская' }, { name: 'Французская' }
    ]);
    const celebrations = await Celebration.bulkCreate([
      { name: 'День Рождения' }, { name: 'Новый Год' }, { name: 'Пасха' }
    ]);
    const typeCooking = await TypeCooking.bulkCreate([
      { name: 'Варка' }, { name: 'Жарка' }, { name: 'Запекание' }
    ]);
    const categories = await Category.bulkCreate([
      { name: 'Завтраки', description: 'Лучшее начало дня' },
      { name: 'Обеды', description: 'Сытные блюда' },
      { name: 'Ужины', description: 'Легкие блюда' }
    ]);

    console.log('Seeding Ingredients...');
    const units = ['г', 'мл', 'шт.', 'ст. ложка', 'ч. ложка', 'по вкусу'];
    const ingredientsData = [];
    for (let i = 0; i < 30; i++) {
      ingredientsData.push({
        name: faker.food.ingredient(),
        unit_of_measurement: faker.helpers.arrayElement(units),
        description: faker.lorem.words(3)
      });
    }
    const ingredients = await Ingredient.bulkCreate(ingredientsData);

    console.log('Seeding Recipes...');
    for (let i = 0; i < 10; i++) {
      const recipe = await Recipe.create({
        user_id: faker.helpers.arrayElement(users).id,
        title: faker.food.dish(),
        description: faker.food.description(),
        difficulty: faker.helpers.arrayElement(['1', '2', '3', '4', '5']),
        image_url: faker.image.urlLoremFlickr({ category: 'food' }),
        is_private: false,
        kitchen_id: faker.helpers.arrayElement(kitchens).id,
        celebration_id: faker.helpers.arrayElement(celebrations).id,
        cooking_id: faker.helpers.arrayElement(typeCooking).id,
        portion: faker.number.int({ min: 1, max: 6 }),
        calorific: faker.number.int({ min: 100, max: 1000 }),
        cooking_time: faker.number.int({ min: 15, max: 180 }),
      });

      // Recipe Ingredients
      const recipeIngs = [];
      const numIngs = faker.number.int({ min: 3, max: 7 });
      const chosenIngs = faker.helpers.arrayElements(ingredients, numIngs);
      for (const ing of chosenIngs) {
        recipeIngs.push({
          recipe_id: recipe.id,
          ingredient_id: ing.id,
          quantity: faker.number.int({ min: 1, max: 500 }),
          note: faker.lorem.word()
        });
      }
      await RecipeIngredient.bulkCreate(recipeIngs);

      // Steps
      const stepsData = [];
      const numSteps = faker.number.int({ min: 2, max: 5 });
      for (let s = 1; s <= numSteps; s++) {
        stepsData.push({
          recipe_id: recipe.id,
          step_number: s,
          description: faker.lorem.paragraph(),
          image_url: faker.image.urlLoremFlickr({ category: 'cooking' })
        });
      }
      await Step.bulkCreate(stepsData);
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
