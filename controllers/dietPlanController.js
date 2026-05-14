const { DietPlan, DietPlanRecipe, Recipe, User, sequelize } = require('../models');
const { Op } = require('sequelize');

const dpc = {
  // POST /diet-plans
  create: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { title, description, is_private, recipes } = req.body;
      
      if (!title) return res.status(400).json({ message: 'Title is required' });

      const plan = await DietPlan.create({
        user_id: req.user.id,
        title,
        description,
        is_private: is_private || false
      }, { transaction: t });

      if (recipes && Array.isArray(recipes)) {
        const recipeLinks = recipes.map(r => ({
          diet_plan_id: plan.id,
          recipe_id: r.recipe_id,
          day_of_week: r.day_of_week,
          meal_order: r.meal_order || 1
        }));
        await DietPlanRecipe.bulkCreate(recipeLinks, { transaction: t });
      }

      await t.commit();
      
      const fullPlan = await DietPlan.findByPk(plan.id, {
        include: [
          { 
            model: DietPlanRecipe, 
            as: 'DayRecipes',
            include: [{ model: Recipe, as: 'Recipe', attributes: ['id', 'title', 'image_url'] }]
          }
        ]
      });

      res.status(201).json(fullPlan);
    } catch (e) {
      await t.rollback();
      res.status(500).json({ message: 'Error creating diet plan', error: e.message });
    }
  },

  // GET /diet-plans
  getAll: async (req, res) => {
    try {
      const { search } = req.query;
      const where = { is_private: false };
      
      if (search) {
        where.title = { [Op.iLike]: `%${search}%` };
      }

      const plans = await DietPlan.findAll({
        where,
        include: [
          { model: User, as: 'Author', attributes: ['id', 'username', 'avatar_url'] }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json(plans);
    } catch (e) {
      res.status(500).json({ message: 'Error fetching diet plans', error: e.message });
    }
  },

  // GET /diet-plans/me
  getMe: async (req, res) => {
    try {
      const plans = await DietPlan.findAll({
        where: { user_id: req.user.id },
        order: [['created_at', 'DESC']]
      });
      res.json(plans);
    } catch (e) {
      res.status(500).json({ message: 'Error', error: e.message });
    }
  },

  // GET /diet-plans/:id
  getById: async (req, res) => {
    try {
      const plan = await DietPlan.findByPk(req.params.id, {
        include: [
          { model: User, as: 'Author', attributes: ['id', 'username', 'avatar_url'] },
          { 
            model: DietPlanRecipe, 
            as: 'DayRecipes',
            include: [{ model: Recipe, as: 'Recipe', attributes: ['id', 'title', 'image_url', 'cooking_time'] }]
          }
        ]
      });

      if (!plan) return res.status(404).json({ message: 'Diet plan not found' });
      
      if (plan.is_private && Number(plan.user_id) !== req.user.id && req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'This diet plan is private' });
      }

      res.json(plan);
    } catch (e) {
      res.status(500).json({ message: 'Error', error: e.message });
    }
  },

  // PATCH /diet-plans/:id
  update: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const plan = await DietPlan.findByPk(req.params.id);
      if (!plan) {
        await t.rollback();
        return res.status(404).json({ message: 'Not found' });
      }

      if (Number(plan.user_id) !== req.user.id && req.user.role !== 'Admin') {
        await t.rollback();
        return res.status(403).json({ message: 'No permission' });
      }

      const { title, description, is_private, recipes } = req.body;
      
      await plan.update({
        title: title !== undefined ? title : plan.title,
        description: description !== undefined ? description : plan.description,
        is_private: is_private !== undefined ? is_private : plan.is_private
      }, { transaction: t });

      if (recipes) {
        await DietPlanRecipe.destroy({ where: { diet_plan_id: plan.id }, transaction: t });
        if (Array.isArray(recipes) && recipes.length > 0) {
          const recipeLinks = recipes.map(r => ({
            diet_plan_id: plan.id,
            recipe_id: r.recipe_id,
            day_of_week: r.day_of_week,
            meal_order: r.meal_order || 1
          }));
          await DietPlanRecipe.bulkCreate(recipeLinks, { transaction: t });
        }
      }

      await t.commit();
      res.json(await DietPlan.findByPk(plan.id, {
        include: [{ model: DietPlanRecipe, as: 'DayRecipes', include: ['Recipe'] }]
      }));
    } catch (e) {
      await t.rollback();
      res.status(500).json({ message: 'Error updating', error: e.message });
    }
  },

  // DELETE /diet-plans/:id
  delete: async (req, res) => {
    try {
      const plan = await DietPlan.findByPk(req.params.id);
      if (!plan) return res.status(404).json({ message: 'Not found' });
      
      if (Number(plan.user_id) !== req.user.id && req.user.role !== 'Admin' && req.user.role !== 'Moderator') {
        return res.status(403).json({ message: 'No permission' });
      }

      await plan.destroy(); // Cascade will handle DietPlanRecipe
      res.json({ message: 'Diet plan deleted' });
    } catch (e) {
      res.status(500).json({ message: 'Error deleting', error: e.message });
    }
  }
};

module.exports = dpc;
