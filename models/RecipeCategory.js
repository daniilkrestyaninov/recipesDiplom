const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RecipeCategory = sequelize.define('RecipeCategory', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  recipe_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  category_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
}, {
  underscored: true,
  tableName: 'recipe_categories',
});

module.exports = RecipeCategory;
