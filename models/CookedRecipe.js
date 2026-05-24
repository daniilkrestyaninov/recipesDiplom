const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CookedRecipe = sequelize.define('CookedRecipe', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  recipe_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  cooked_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  underscored: true,
  tableName: 'cooked_recipes',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['recipe_id'] },
    { fields: ['user_id', 'recipe_id'] }
  ]
});

module.exports = CookedRecipe;
