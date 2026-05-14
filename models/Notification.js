const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Кому пришло уведомление'
  },
  actor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Кто совершил действие (null для системных)'
  },
  type: {
    type: DataTypes.ENUM('LIKE', 'FOLLOW', 'NEW_POST', 'COMMENT', 'REPLY', 'SYSTEM'),
    allowNull: false,
  },
  recipe_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  comment_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'notifications',
  underscored: true,
});

module.exports = Notification;
