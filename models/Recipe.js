const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Recipe = sequelize.define('Recipe', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  difficulty: {
    type: DataTypes.STRING,
    validate: {
      isIn: [['1', '2', '3', '4', '5']],
    },
  },
  image_url: {
    type: DataTypes.STRING,
  },
  is_private: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  kitchen_id: {
    type: DataTypes.BIGINT,
  },
  celebration_id: {
    type: DataTypes.BIGINT,
  },
  cooking_id: {
    type: DataTypes.BIGINT,
  },
  portion: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  calorific: {
    type: DataTypes.INTEGER,
  },
  cooking_time: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  first_step_id: {
    type: DataTypes.BIGINT,
  },
}, {
  underscored: true,
});

module.exports = Recipe;
