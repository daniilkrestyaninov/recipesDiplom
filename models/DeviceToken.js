const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeviceToken = sequelize.define('DeviceToken', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'FCM Device Token'
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Null for guests, ID for logged in users'
  },
  device_type: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'android',
  }
}, {
  underscored: true,
  tableName: 'device_tokens',
  indexes: [
    {
      unique: true,
      fields: ['token']
    }
  ]
});

module.exports = DeviceToken;
