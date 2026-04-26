const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PersonalNote = sequelize.define('PersonalNote', {
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
  note: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  underscored: true,
  tableName: 'personal_notes',
});

module.exports = PersonalNote;
