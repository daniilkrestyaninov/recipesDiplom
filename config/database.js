const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'diplom',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASS || 'root',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'postgres',
    logging: console.log,
  }
);

module.exports = sequelize;
