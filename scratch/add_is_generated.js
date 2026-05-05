const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

async function addColumn() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('recipes', 'is_generated', {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    });
    console.log('Колонка is_generated успешно добавлена!');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('Колонка уже существует.');
    } else {
      console.error('Ошибка:', error);
    }
    process.exit(1);
  }
}

addColumn();
