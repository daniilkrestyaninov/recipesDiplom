const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  bio: {
    type: DataTypes.STRING,
  },
  avatar_url: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  is_blocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  password_reset_code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password_reset_expires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verification_code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  underscored: true,
});

module.exports = User;
