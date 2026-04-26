const { Recipe, Ingredient, Step, RecipeIngredient, RecipeCategory } = require('../models');
const { Op } = require('sequelize');

const syncController = {
  // GET /sync/delta?since=ISO_DATE
  delta: async (req, res) => {
    try {
      const { since } = req.query;
      if (!since) return res.status(400).json({ message: 'Параметр since обязателен (ISO 8601)' });
      const sinceDate = new Date(since);

      const recipes = await Recipe.findAll({
        where: { user_id: req.user.id, updated_at: { [Op.gt]: sinceDate } },
        include: [
          { model: Ingredient, as: 'Ingredients', through: { attributes: ['quantity', 'note'] } },
          { model: Step, as: 'Steps' },
        ],
      });
      res.json({ updated_since: since, count: recipes.length, recipes });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  // POST /sync/push
  push: async (req, res) => {
    try {
      const { recipes = [] } = req.body;
      const created = [];
      for (const r of recipes) {
        const recipe = await Recipe.create({
          user_id: req.user.id,
          title: r.title, description: r.description, difficulty: r.difficulty,
          image_url: r.image_url, is_private: r.is_private || false,
          kitchen_id: r.kitchen_id, celebration_id: r.celebration_id, cooking_id: r.cooking_id,
          portion: r.portion, calorific: r.calorific, cooking_time: r.cooking_time,
        });
        if (r.ingredients?.length) {
          await RecipeIngredient.bulkCreate(r.ingredients.map(i => ({
            recipe_id: recipe.id, ingredient_id: i.id, quantity: i.quantity, note: i.note,
          })));
        }
        if (r.steps?.length) {
          await Step.bulkCreate(r.steps.map((s, idx) => ({
            recipe_id: recipe.id, step_number: s.step_number || idx + 1,
            description: s.description, image_url: s.image_url,
          })));
        }
        created.push(recipe.id);
      }
      res.status(201).json({ message: `Синхронизировано ${created.length} рецептов`, ids: created });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },
};

module.exports = syncController;
