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

  // ── Categories ──────────────────────────────────────────────
  createCategory: async (req, res) => {
    try {
      const category = await Category.create(req.body);
      res.status(201).json(category);
    } catch (err) { res.status(500).json({ message: 'Ошибка создания', error: err.message }); }
  },
  updateCategory: async (req, res) => {
    try {
      const item = await Category.findByPk(req.params.id);
      if (!item) return res.status(404).json({ message: 'Не найдено' });
      await item.update(req.body);
      res.json(item);
    } catch (err) { res.status(500).json({ message: 'Ошибка обновления', error: err.message }); }
  },
  deleteCategory: async (req, res) => {
    try {
      const item = await Category.findByPk(req.params.id);
      if (!item) return res.status(404).json({ message: 'Не найдено' });
      await item.destroy();
      res.json({ message: 'Удалено' });
    } catch (err) { res.status(500).json({ message: 'Ошибка удаления', error: err.message }); }
  },

  // ── Kitchens ────────────────────────────────────────────────
  createKitchen: async (req, res) => {
    try {
      const kitchen = await NationalKitchen.create(req.body);
      res.status(201).json(kitchen);
    } catch (err) { res.status(500).json({ message: 'Ошибка создания', error: err.message }); }
  },
  updateKitchen: async (req, res) => {
    try {
      const item = await NationalKitchen.findByPk(req.params.id);
      if (!item) return res.status(404).json({ message: 'Не найдено' });
      await item.update(req.body);
      res.json(item);
    } catch (err) { res.status(500).json({ message: 'Ошибка обновления', error: err.message }); }
  },
  deleteKitchen: async (req, res) => {
    try {
      const item = await NationalKitchen.findByPk(req.params.id);
      if (!item) return res.status(404).json({ message: 'Не найдено' });
      await item.destroy();
      res.json({ message: 'Удалено' });
    } catch (err) { res.status(500).json({ message: 'Ошибка удаления', error: err.message }); }
  },

  // ── Celebrations ────────────────────────────────────────────
  createCelebration: async (req, res) => {
    try {
      const celebration = await Celebration.create(req.body);
      res.status(201).json(celebration);
    } catch (err) { res.status(500).json({ message: 'Ошибка создания', error: err.message }); }
  },
  updateCelebration: async (req, res) => {
    try {
      const item = await Celebration.findByPk(req.params.id);
      if (!item) return res.status(404).json({ message: 'Не найдено' });
      await item.update(req.body);
      res.json(item);
    } catch (err) { res.status(500).json({ message: 'Ошибка обновления', error: err.message }); }
  },
  deleteCelebration: async (req, res) => {
    try {
      const item = await Celebration.findByPk(req.params.id);
      if (!item) return res.status(404).json({ message: 'Не найдено' });
      await item.destroy();
      res.json({ message: 'Удалено' });
    } catch (err) { res.status(500).json({ message: 'Ошибка удаления', error: err.message }); }
  },

  // ── Cooking Types ───────────────────────────────────────────
  createTypeCooking: async (req, res) => {
    try {
      const item = await TypeCooking.create(req.body);
      res.status(201).json(item);
    } catch (err) { res.status(500).json({ message: 'Ошибка создания', error: err.message }); }
  },
  updateTypeCooking: async (req, res) => {
    try {
      const item = await TypeCooking.findByPk(req.params.id);
      if (!item) return res.status(404).json({ message: 'Не найдено' });
      await item.update(req.body);
      res.json(item);
    } catch (err) { res.status(500).json({ message: 'Ошибка обновления', error: err.message }); }
  },
  deleteTypeCooking: async (req, res) => {
    try {
      const item = await TypeCooking.findByPk(req.params.id);
      if (!item) return res.status(404).json({ message: 'Не найдено' });
      await item.destroy();
      res.json({ message: 'Удалено' });
    } catch (err) { res.status(500).json({ message: 'Ошибка удаления', error: err.message }); }
  },

  // ── Units ───────────────────────────────────────────────────
  createUnit: async (req, res) => {
    try {
      const item = await Unit.create(req.body);
      res.status(201).json(item);
    } catch (err) { res.status(500).json({ message: 'Ошибка создания', error: err.message }); }
  },
  updateUnit: async (req, res) => {
    try {
      const item = await Unit.findByPk(req.params.id);
      if (!item) return res.status(404).json({ message: 'Не найдено' });
      await item.update(req.body);
      res.json(item);
    } catch (err) { res.status(500).json({ message: 'Ошибка обновления', error: err.message }); }
  },
  deleteUnit: async (req, res) => {
    try {
      const item = await Unit.findByPk(req.params.id);
      if (!item) return res.status(404).json({ message: 'Не найдено' });
      await item.destroy();
      res.json({ message: 'Удалено' });
    } catch (err) { res.status(500).json({ message: 'Ошибка удаления', error: err.message }); }
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
