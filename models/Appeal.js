const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appeal = sequelize.define('Appeal', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'reviewed', 'resolved'),
    defaultValue: 'pending',
  },
  admin_notes: {
    type: DataTypes.TEXT,
  },
}, {
  underscored: true,
});

module.exports = Appeal;
