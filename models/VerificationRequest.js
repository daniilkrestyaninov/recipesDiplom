const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VerificationRequest = sequelize.define('VerificationRequest', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  info: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  underscored: true,
  tableName: 'verification_requests',
});

module.exports = VerificationRequest;
