const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  reporter_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'User who created the report',
  },
  reported_user_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'User being reported (profile/user)',
  },
  recipe_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Recipe being reported',
  },
  type: {
    type: DataTypes.ENUM('recipe', 'user', 'profile'),
    allowNull: false,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'reviewed', 'resolved', 'dismissed'),
    defaultValue: 'pending',
  }
}, {
  underscored: true,
  tableName: 'reports',
});

module.exports = Report;
