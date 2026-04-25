const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ingredient = sequelize.define('Ingredient', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  unit_of_measurement: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
  },
}, {
  underscored: true,
});

module.exports = Ingredient;
