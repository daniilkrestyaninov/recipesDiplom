const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RecipeIngredient = sequelize.define('RecipeIngredient', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  recipe_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  ingredient_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  note: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'recipe_ingredients',
  underscored: true,
  indexes: [
    { fields: ['recipe_id'] },
    { fields: ['ingredient_id'] }
  ]
});

module.exports = RecipeIngredient;
