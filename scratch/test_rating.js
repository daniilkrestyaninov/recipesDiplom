const { Comment, Recipe, sequelize } = require('../models');
const { fn, col } = require('sequelize');

async function testRating() {
  const recipeId = 36;
  try {
    console.log(`--- Тест рейтинга для рецепта #${recipeId} ---`);

    // 1. Очистка
    await Comment.destroy({ where: { recipe_id: recipeId } });
    console.log('1. Старые комментарии удалены.');

    // 2. Добавление тестовых данных
    // Оценки: 5, 4, 1. Среднее должно быть 3.33
    await Comment.bulkCreate([
      { user_id: 1, recipe_id: recipeId, content: 'Отлично!', rating: 5 },
      { user_id: 1, recipe_id: recipeId, content: 'Хорошо', rating: 4 },
      { user_id: 1, recipe_id: recipeId, content: 'Плохо', rating: 1 },
    ]);
    console.log('2. Добавлены 3 комментария с оценками 5, 4 и 1.');

    // 3. Выполнение агрегации (как в контроллере)
    const stats = await Comment.findOne({
      where: { recipe_id: recipeId },
      attributes: [
        [fn('AVG', col('rating')), 'avg_rating'],
        [fn('COUNT', col('id')), 'total_reviews']
      ],
      raw: true
    });

    const finalRating = parseFloat(stats.avg_rating || 0).toFixed(1);
    const totalReviews = parseInt(stats.total_reviews || 0);

    console.log('\n--- РЕЗУЛЬТАТ ---');
    console.log(`Средний рейтинг в БД: ${stats.avg_rating}`);
    console.log(`Округленный рейтинг (как в API): ${finalRating}`);
    console.log(`Всего отзывов: ${totalReviews}`);

    if (finalRating === '3.3' && totalReviews === 3) {
      console.log('\n✅ ТЕСТ ПРОЙДЕН: Расчет абсолютно верен!');
    } else {
      console.log('\n❌ ТЕСТ ПРОВАЛЕН: Расчет не совпадает.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Ошибка теста:', error);
    process.exit(1);
  }
}

testRating();
