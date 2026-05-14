const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MenuOfTheWeek = sequelize.define('MenuOfTheWeek', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  day_of_week: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 7
    },
    comment: '1=Monday, ..., 7=Sunday'
  },
  recipe_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  }
}, {
  underscored: true,
  tableName: 'menu_of_the_week',
});

module.exports = MenuOfTheWeek;
