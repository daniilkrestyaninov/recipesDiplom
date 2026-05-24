const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  follower_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  following_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  subscribed_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: ['follower_id'] },
    { fields: ['following_id'] },
    { fields: ['follower_id', 'following_id'] }
  ]
});

module.exports = Subscription;
