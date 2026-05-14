const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  admin_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'e.g. DELETE_RECIPE, BLOCK_USER, BROADCAST_NOTIFICATION'
  },
  entity: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'e.g. Recipe, User'
  },
  entity_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
  }
}, {
  underscored: true,
  tableName: 'audit_logs',
});

module.exports = AuditLog;
