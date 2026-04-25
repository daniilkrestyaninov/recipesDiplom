const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  follower_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  following_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Subscription;
