const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CommentLike = sequelize.define('CommentLike', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  comment_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
}, {
  underscored: true,
  tableName: 'comment_likes',
});

module.exports = CommentLike;
