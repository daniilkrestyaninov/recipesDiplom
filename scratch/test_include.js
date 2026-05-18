const { Recipe, User, Ingredient, RecipeIngredient, RecipeCategory, Step, NationalKitchen, Category, Celebration, TypeCooking, Like, Unit, sequelize } = require('../models');
const { Op } = require('sequelize');

const getFullInclude = () => [
  { model: User, attributes: ['id', 'username', 'name', 'avatar_url', 'is_blocked'] },
  {
    model: Ingredient,
    as: 'Ingredients',
    through: { attributes: ['quantity', 'note'] },
    include: [{ model: Unit, as: 'Unit' }]
  },
  { model: Step, as: 'Steps' },
  { model: NationalKitchen, as: 'Kitchen' },
  { model: Celebration, as: 'Celebration' },
  { model: TypeCooking, as: 'TypeCooking' },
  { model: Category, as: 'Categories' },
  { 
    model: Like, 
    as: 'Likes', 
    attributes: ['user_id']
  },
];

async function test() {
  try {
    const ids = ['1', '2']; // Just some mock IDs
    const recipes = await Recipe.findAll({
      where: { id: { [Op.in]: ids } },
      include: getFullInclude()
    });
    console.log('Query successful, found', recipes.length);
  } catch (err) {
    console.error('ERROR CAUGHT:');
    console.error(err.message);
    console.error(err.stack);
  } finally {
    await sequelize.close();
  }
}

test();
