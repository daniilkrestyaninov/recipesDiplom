const { RecipeIngredient, sequelize } = require('./models');

async function testDestroy() {
  const t = await sequelize.transaction();
  try {
    const deleted = await RecipeIngredient.destroy({ where: { recipe_id: 42 }, transaction: t });
    console.log('Deleted count inside transaction:', deleted);
    await t.commit();
    console.log('Committed');
  } catch (e) {
    console.error('Error:', e);
    if (t) await t.rollback();
  }
}

testDestroy();
