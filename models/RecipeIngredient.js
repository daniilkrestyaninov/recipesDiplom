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
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  note: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'recipe_ingredients',
  underscored: true,
});

module.exports = RecipeIngredient;
