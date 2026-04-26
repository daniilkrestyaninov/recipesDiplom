const { NationalKitchen, Category, Celebration, TypeCooking, Ingredient, Role } = require('../models');
const { Op } = require('sequelize');

const metaController = {
  // GET /categories
  getCategories: async (req, res) => {
    try {
      res.json(await Category.findAll({ order: [['name', 'ASC']] }));
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // GET /national-kitchens
  getKitchens: async (req, res) => {
    try {
      res.json(await NationalKitchen.findAll({ order: [['name', 'ASC']] }));
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // GET /celebrations
  getCelebrations: async (req, res) => {
    try {
      res.json(await Celebration.findAll({ order: [['name', 'ASC']] }));
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // GET /type-cooking
  getTypeCooking: async (req, res) => {
    try {
      res.json(await TypeCooking.findAll({ order: [['name', 'ASC']] }));
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // GET /ingredients?search=...
  getIngredients: async (req, res) => {
    try {
      const { search } = req.query;
      const where = search
        ? { name: { [Op.iLike]: `%${search}%` } }
        : {};
      res.json(await Ingredient.findAll({ where, order: [['name', 'ASC']] }));
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // GET /roles
  getRoles: async (req, res) => {
    try {
      res.json(await Role.findAll());
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },
};

module.exports = metaController;
