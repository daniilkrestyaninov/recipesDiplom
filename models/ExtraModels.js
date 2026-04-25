const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING },
}, { underscored: true });

const Celebration = sequelize.define('Celebration', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
}, { underscored: true });

const NationalKitchen = sequelize.define('NationalKitchen', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
}, { underscored: true, tableName: 'national_kitchens' });

const TypeCooking = sequelize.define('TypeCooking', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
}, { underscored: true, tableName: 'type_cooking' });

const Step = sequelize.define('Step', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  recipe_id: { type: DataTypes.BIGINT, allowNull: false },
  step_number: { type: DataTypes.INTEGER, allowNull: false },
  image_url: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT, allowNull: false },
}, { underscored: true });

module.exports = { Category, Celebration, NationalKitchen, TypeCooking, Step };
