const { Recipe, User, Ingredient, RecipeIngredient, RecipeCategory,
  Step, NationalKitchen, Category, Celebration, TypeCooking, Like, Subscription } = require('../models');
const { Op } = require('sequelize');

// Стандартный include для полной карточки рецепта
const fullRecipeInclude = [
  { model: User, attributes: ['id', 'username', 'name', 'avatar_url'] },
  { model: Ingredient, as: 'Ingredients', through: { attributes: ['quantity', 'note'] } },
  { model: Step, as: 'Steps', order: [['step_number', 'ASC']] },
  { model: NationalKitchen, as: 'Kitchen' },
  { model: Celebration, as: 'Celebration' },
  { model: TypeCooking, as: 'TypeCooking' },
  { model: Category, as: 'Categories' },
  { model: Like, as: 'Likes', attributes: ['user_id'] },
];

const recipeController = {
  // GET /recipes
  getAll: async (req, res) => {
    try {
      const { kitchen_id, celebration_id, cooking_id, difficulty, is_private } = req.query;
      const where = {};
      if (kitchen_id) where.kitchen_id = kitchen_id;
      if (celebration_id) where.celebration_id = celebration_id;
      if (cooking_id) where.cooking_id = cooking_id;
      if (difficulty) where.difficulty = difficulty;
      if (is_private !== undefined) where.is_private = is_private === 'true';

      const recipes = await Recipe.findAll({
        where,
        include: [
          { model: User, attributes: ['id', 'username', 'name', 'avatar_url'] },
          { model: NationalKitchen, as: 'Kitchen' },
          { model: Category, as: 'Categories' },
          { model: Like, as: 'Likes', attributes: ['user_id'] },
        ],
        order: [['created_at', 'DESC']],
      });
      res.json(recipes);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка при получении рецептов', error: err.message });
    }
  },

  // GET /recipes/feed
  getFeed: async (req, res) => {
    try {
      // IDs пользователей, на которых текущий пользователь подписан
      const subscriptions = await Subscription.findAll({
        where: { follower_id: req.user.id },
        attributes: ['following_id'],
      });
      const followingIds = subscriptions.map((s) => s.following_id);

      if (followingIds.length === 0) {
        return res.json([]);
      }

      const recipes = await Recipe.findAll({
        where: { user_id: { [Op.in]: followingIds }, is_private: false },
        include: [
          { model: User, attributes: ['id', 'username', 'name', 'avatar_url'] },
          { model: Like, as: 'Likes', attributes: ['user_id'] },
        ],
        order: [['created_at', 'DESC']],
      });
      res.json(recipes);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка при получении ленты', error: err.message });
    }
  },

  // GET /recipes/:id
  getById: async (req, res) => {
    try {
      const recipe = await Recipe.findByPk(req.params.id, { include: fullRecipeInclude });
      if (!recipe) return res.status(404).json({ message: 'Рецепт не найден' });
      res.json(recipe);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // POST /recipes
  create: async (req, res) => {
    try {
      const {
        title, description, difficulty, image_url, is_private,
        kitchen_id, celebration_id, cooking_id, portion, calorific,
        cooking_time, ingredients = [], steps = [], categories = [],
      } = req.body;

      const recipe = await Recipe.create({
        user_id: req.user.id,
        title, description, difficulty, image_url,
        is_private: is_private || false,
        kitchen_id, celebration_id, cooking_id,
        portion, calorific, cooking_time,
      });

      // Ингредиенты
      if (ingredients.length > 0) {
        await RecipeIngredient.bulkCreate(
          ingredients.map((i) => ({
            recipe_id: recipe.id,
            ingredient_id: i.id,
            quantity: i.quantity,
            note: i.note,
          }))
        );
      }

      // Шаги
      if (steps.length > 0) {
        await Step.bulkCreate(
          steps.map((s, idx) => ({
            recipe_id: recipe.id,
            step_number: s.step_number || idx + 1,
            description: s.description,
            image_url: s.image_url,
          }))
        );
      }

      // Категории
      if (categories.length > 0) {
        await RecipeCategory.bulkCreate(
          categories.map((catId) => ({ recipe_id: recipe.id, category_id: catId }))
        );
      }

      const full = await Recipe.findByPk(recipe.id, { include: fullRecipeInclude });
      res.status(201).json(full);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка при создании', error: err.message });
    }
  },

  // PUT /recipes/:id
  update: async (req, res) => {
    try {
      const recipe = await Recipe.findByPk(req.params.id);
      if (!recipe) return res.status(404).json({ message: 'Рецепт не найден' });
      if (recipe.user_id !== req.user.id && req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Нет прав для редактирования' });
      }
      await recipe.update(req.body);
      const full = await Recipe.findByPk(recipe.id, { include: fullRecipeInclude });
      res.json(full);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка обновления', error: err.message });
    }
  },

  // DELETE /recipes/:id
  delete: async (req, res) => {
    try {
      const recipe = await Recipe.findByPk(req.params.id);
      if (!recipe) return res.status(404).json({ message: 'Рецепт не найден' });
      if (recipe.user_id !== req.user.id && req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Нет прав для удаления' });
      }
      await recipe.destroy();
      res.json({ message: 'Рецепт удален' });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка удаления', error: err.message });
    }
  },

  // PATCH /recipes/:id/steps/:step_id
  updateStep: async (req, res) => {
    try {
      const step = await Step.findOne({
        where: { id: req.params.step_id, recipe_id: req.params.id },
      });
      if (!step) return res.status(404).json({ message: 'Шаг не найден' });
      await step.update(req.body);
      res.json(step);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка обновления шага', error: err.message });
    }
  },

  // DELETE /recipes/:id/ingredients/:ing_id
  removeIngredient: async (req, res) => {
    try {
      const row = await RecipeIngredient.findOne({
        where: { recipe_id: req.params.id, ingredient_id: req.params.ing_id },
      });
      if (!row) return res.status(404).json({ message: 'Ингредиент не найден в рецепте' });
      await row.destroy();
      res.json({ message: 'Ингредиент удален из рецепта' });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка удаления ингредиента', error: err.message });
    }
  },
};

module.exports = recipeController;
