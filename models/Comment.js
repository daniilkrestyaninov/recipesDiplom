const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  recipe_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  rating: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  parent_comment_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  taste_sweet: { type: DataTypes.SMALLINT, validate: { min: 1, max: 5 } },
  taste_sour: { type: DataTypes.SMALLINT, validate: { min: 1, max: 5 } },
  taste_salty: { type: DataTypes.SMALLINT, validate: { min: 1, max: 5 } },
  taste_spicy: { type: DataTypes.SMALLINT, validate: { min: 1, max: 5 } },
  taste_umami: { type: DataTypes.SMALLINT, validate: { min: 1, max: 5 } },
}, {
  underscored: true,
  tableName: 'comments',
});

module.exports = Comment;
