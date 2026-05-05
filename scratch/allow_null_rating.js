const sequelize = require('../config/database');

async function fixRatingColumn() {
  try {
    console.log('Изменяем колонку rating: убираем ограничение NOT NULL...');
    
    // Используем чистый SQL, так как Sequelize queryInterface.changeColumn 
    // иногда капризничает с PostgreSQL при смене allowNull
    await sequelize.query('ALTER TABLE "comments" ALTER COLUMN "rating" DROP NOT NULL;');
    
    console.log('✅ Ограничение NOT NULL успешно удалено! Теперь можно оставлять комментарии без рейтинга.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при обновлении таблицы:', error.message);
    process.exit(1);
  }
}

fixRatingColumn();
