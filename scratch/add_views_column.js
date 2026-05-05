const { sequelize } = require('../models');

async function addColumn() {
  try {
    await sequelize.query('ALTER TABLE recipes ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;');
    console.log('Column views_count added successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error adding column:', error);
    process.exit(1);
  }
}

addColumn();
