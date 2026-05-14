const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DietPlan = sequelize.define('DietPlan', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_private: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  underscored: true,
  tableName: 'diet_plans',
});

module.exports = DietPlan;
