const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Favorite = sequelize.define('Favorite', {
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
  is_downloaded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  underscored: true,
  tableName: 'favorites',
  indexes: [
    { fields: ['recipe_id'] },
    { fields: ['user_id'] },
    { fields: ['user_id', 'recipe_id'] }
  ]
});

module.exports = Favorite;
