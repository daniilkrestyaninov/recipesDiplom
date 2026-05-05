const { NationalKitchen, Category, Celebration, TypeCooking, Ingredient, Role, Unit } = require('../models');
const { Op } = require('sequelize');

const metaController = {
  // GET /meta/categories
  getCategories: async (req, res) => {
    try {
      res.json(await Category.findAll({ order: [['name', 'ASC']] }));
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // GET /meta/kitchens
  getKitchens: async (req, res) => {
    try {
      res.json(await NationalKitchen.findAll({ order: [['name', 'ASC']] }));
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // GET /meta/celebrations
  getCelebrations: async (req, res) => {
    try {
      res.json(await Celebration.findAll({ order: [['name', 'ASC']] }));
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // GET /meta/cooking-types
  getTypeCooking: async (req, res) => {
    try {
      res.json(await TypeCooking.findAll({ order: [['name', 'ASC']] }));
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // GET /meta/units
  getUnits: async (req, res) => {
    try {
      res.json(await Unit.findAll({ order: [['name', 'ASC']] }));
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // GET /meta/ingredients?search=...
  getIngredients: async (req, res) => {
    try {
      const { search } = req.query;
      const where = search
        ? { name: { [Op.iLike]: `%${search}%` } }
        : {};
      res.json(await Ingredient.findAll({ 
        where, 
        include: [{ model: Unit, as: 'Unit' }],
        order: [['name', 'ASC']] 
      }));
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // POST /meta/ingredients
  createIngredient: async (req, res) => {
    try {
      const { name, unit_id, description } = req.body;
      const ingredient = await Ingredient.create({ name, unit_id, description });
      res.status(201).json(await Ingredient.findByPk(ingredient.id, { include: [{ model: Unit, as: 'Unit' }] }));
    } catch (err) {
      res.status(500).json({ message: 'Ошибка создания', error: err.message });
    }
  },

  // PUT /meta/ingredients/:id
  updateIngredient: async (req, res) => {
    try {
      const ingredient = await Ingredient.findByPk(req.params.id);
      if (!ingredient) return res.status(404).json({ message: 'Ингредиент не найден' });
      await ingredient.update(req.body);
      res.json(await Ingredient.findByPk(ingredient.id, { include: [{ model: Unit, as: 'Unit' }] }));
    } catch (err) {
      res.status(500).json({ message: 'Ошибка обновления', error: err.message });
    }
  },

  // DELETE /meta/ingredients/:id
  deleteIngredient: async (req, res) => {
    try {
      const ingredient = await Ingredient.findByPk(req.params.id);
      if (!ingredient) return res.status(404).json({ message: 'Ингредиент не найден' });
      await ingredient.destroy();
      res.json({ message: 'Ингредиент удален' });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка удаления', error: err.message });
    }
  },

  // GET /meta/roles
  getRoles: async (req, res) => {
    try {
      res.json(await Role.findAll());
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },
};

module.exports = metaController;
