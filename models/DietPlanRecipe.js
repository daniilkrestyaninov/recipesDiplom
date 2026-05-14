const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DietPlanRecipe = sequelize.define('DietPlanRecipe', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  diet_plan_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  recipe_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  day_of_week: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '1-7 (Mon-Sun)',
    validate: {
      min: 1,
      max: 7
    }
  },
  meal_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '1-5 (Order of meals in a day)'
  }
}, {
  underscored: true,
  tableName: 'diet_plan_recipes',
});

module.exports = DietPlanRecipe;
