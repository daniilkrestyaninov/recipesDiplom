const { Recipe, User, Ingredient, RecipeIngredient, RecipeCategory,
  Step, NationalKitchen, Category, Celebration, TypeCooking, Like,
  Subscription, PersonalNote, CookedRecipe } = require('../models');
const { Op, fn } = require('sequelize');
const geminiService = require('../services/geminiService');

const fullInclude = [
  { model: User, attributes: ['id', 'username', 'name', 'avatar_url'] },
  { model: Ingredient, as: 'Ingredients', through: { attributes: ['quantity', 'note'] } },
  { model: Step, as: 'Steps' },
  { model: NationalKitchen, as: 'Kitchen' },
  { model: Celebration, as: 'Celebration' },
  { model: TypeCooking, as: 'TypeCooking' },
  { model: Category, as: 'Categories' },
  { model: Like, as: 'Likes', attributes: ['user_id'] },
];

const rc = {
  getAll: async (req, res) => {
    try {
      const { kitchen_id, celebration_id, cooking_id, difficulty, is_private, search, category_id } = req.query;
      const where = {};
      if (kitchen_id) where.kitchen_id = kitchen_id;
      if (celebration_id) where.celebration_id = celebration_id;
      if (cooking_id) where.cooking_id = cooking_id;
      if (difficulty) where.difficulty = difficulty;
      if (is_private !== undefined) where.is_private = is_private === 'true';
      if (search) where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
      const include = [
        { model: User, attributes: ['id', 'username', 'name', 'avatar_url'] },
        { model: NationalKitchen, as: 'Kitchen' },
        { model: Like, as: 'Likes', attributes: ['user_id'] },
      ];
      if (category_id) include.push({ model: Category, as: 'Categories', where: { id: category_id } });
      else include.push({ model: Category, as: 'Categories' });
      res.json(await Recipe.findAll({ where, include, order: [['created_at', 'DESC']] }));
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  getFeed: async (req, res) => {
    try {
      const subs = await Subscription.findAll({ where: { follower_id: req.user.id }, attributes: ['following_id'] });
      const ids = subs.map(s => s.following_id);
      if (!ids.length) return res.json([]);
      res.json(await Recipe.findAll({
        where: { user_id: { [Op.in]: ids }, is_private: false },
        include: [{ model: User, attributes: ['id', 'username', 'name', 'avatar_url'] }, { model: Like, as: 'Likes', attributes: ['user_id'] }],
        order: [['created_at', 'DESC']],
      }));
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  getRandom: async (req, res) => {
    try {
      const r = await Recipe.findOne({ where: { is_private: false }, order: [fn('RANDOM')], include: fullInclude });
      if (!r) return res.status(404).json({ message: 'Нет рецептов' });
      res.json(r);
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  getById: async (req, res) => {
    try {
      const r = await Recipe.findByPk(req.params.id, { include: fullInclude });
      if (!r) return res.status(404).json({ message: 'Рецепт не найден' });
      res.json(r);
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  create: async (req, res) => {
    try {
      const { title, description, difficulty, image_url, is_private, kitchen_id, celebration_id, cooking_id, portion, calorific, cooking_time, ingredients = [], steps = [], categories = [], proteins, fats, carbohydrates } = req.body;
      
      let pfcData = { proteins, fats, carbohydrates, calorific, is_ai_pfc: false };

      // Если БЖУ не переданы вручную, рассчитываем через ИИ
      if (!proteins && !fats && !carbohydrates) {
        // Получаем имена ингредиентов из БД, так как в req.body приходят только id
        const ingredientIds = ingredients.map(i => i.id);
        const dbIngredients = await Ingredient.findAll({
          where: { id: { [Op.in]: ingredientIds } },
          attributes: ['id', 'name']
        });

        // Сопоставляем имена с граммовками из запроса
        const ingredientDetails = ingredients.map(i => {
          const dbItem = dbIngredients.find(db => Number(db.id) === Number(i.id));
          const name = dbItem ? dbItem.name : 'Ингредиент';
          return `${name} ${i.quantity || ''} ${i.note || ''}`;
        });

        const aiResult = await geminiService.calculatePFC(title, ingredientDetails);
        pfcData = { ...aiResult, is_ai_pfc: true };
      }

      const recipe = await Recipe.create({ 
        user_id: req.user.id, 
        title, 
        description, 
        difficulty, 
        image_url, 
        is_private: is_private || false, 
        kitchen_id, 
        celebration_id, 
        cooking_id, 
        portion, 
        calorific: pfcData.calorific, 
        proteins: pfcData.proteins,
        fats: pfcData.fats,
        carbohydrates: pfcData.carbohydrates,
        is_ai_pfc: pfcData.is_ai_pfc,
        cooking_time 
      });
      if (ingredients.length) await RecipeIngredient.bulkCreate(ingredients.map(i => ({ recipe_id: recipe.id, ingredient_id: i.id, quantity: i.quantity, note: i.note })));
      if (steps.length) await Step.bulkCreate(steps.map((s, idx) => ({ recipe_id: recipe.id, step_number: s.step_number || idx + 1, description: s.description, image_url: s.image_url })));
      if (categories.length) await RecipeCategory.bulkCreate(categories.map(catId => ({ recipe_id: recipe.id, category_id: catId })));
      res.status(201).json(await Recipe.findByPk(recipe.id, { include: fullInclude }));
    } catch (e) { res.status(500).json({ message: 'Ошибка создания', error: e.message }); }
  },

  update: async (req, res) => {
    try {
      const r = await Recipe.findByPk(req.params.id);
      if (!r) return res.status(404).json({ message: 'Рецепт не найден' });
      if (Number(r.user_id) !== req.user.id) return res.status(403).json({ message: 'Только автор может редактировать' });
      
      // Если при обновлении переданы БЖУ, сбрасываем флаг is_ai_pfc на false
      if (req.body.proteins || req.body.fats || req.body.carbohydrates) {
        req.body.is_ai_pfc = false;
      }

      await r.update(req.body);
      res.json(await Recipe.findByPk(r.id, { include: fullInclude }));
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  delete: async (req, res) => {
    try {
      const r = await Recipe.findByPk(req.params.id);
      if (!r) return res.status(404).json({ message: 'Рецепт не найден' });
      if (Number(r.user_id) !== req.user.id && req.user.role !== 'Admin') return res.status(403).json({ message: 'Нет прав' });
      await Step.destroy({ where: { recipe_id: r.id } });
      await RecipeIngredient.destroy({ where: { recipe_id: r.id } });
      await RecipeCategory.destroy({ where: { recipe_id: r.id } });
      await Like.destroy({ where: { recipe_id: r.id } });
      await r.destroy();
      res.json({ message: 'Рецепт удалён' });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  upsertPersonalNote: async (req, res) => {
    try {
      const { note } = req.body;
      const [pn, created] = await PersonalNote.findOrCreate({ where: { user_id: req.user.id, recipe_id: req.params.id }, defaults: { note } });
      if (!created) await pn.update({ note });
      res.json({ message: created ? 'Заметка создана' : 'Заметка обновлена', data: pn });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  exportIngredients: async (req, res) => {
    try {
      const r = await Recipe.findByPk(req.params.id, { include: [{ model: Ingredient, as: 'Ingredients', through: { attributes: ['quantity', 'note'] } }] });
      if (!r) return res.status(404).json({ message: 'Рецепт не найден' });
      let txt = `Список продуктов: ${r.title}\n\n`;
      r.Ingredients.forEach(i => { txt += `- ${i.name}${i.RecipeIngredient.quantity ? ' — ' + i.RecipeIngredient.quantity : ''}${i.RecipeIngredient.note ? ' (' + i.RecipeIngredient.note + ')' : ''}\n`; });
      res.type('text/plain; charset=utf-8').send(txt);
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  markCooked: async (req, res) => {
    try {
      const entry = await CookedRecipe.create({ user_id: req.user.id, recipe_id: req.params.id });
      res.status(201).json({ message: 'Отмечено как приготовленное', data: entry });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  updateStep: async (req, res) => {
    try {
      const step = await Step.findOne({ where: { id: req.params.step_id, recipe_id: req.params.id } });
      if (!step) return res.status(404).json({ message: 'Шаг не найден' });
      await step.update(req.body);
      res.json(step);
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  removeIngredient: async (req, res) => {
    try {
      const row = await RecipeIngredient.findOne({ where: { recipe_id: req.params.id, ingredient_id: req.params.ing_id } });
      if (!row) return res.status(404).json({ message: 'Не найден' });
      await row.destroy();
      res.json({ message: 'Ингредиент удалён' });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  getRecommendations: async (req, res) => {
    try {
      const userId = req.user.id;

      // 1. Получаем ID рецептов, которые пользователь уже лайкнул
      const userLikes = await Like.findAll({
        where: { user_id: userId },
        attributes: ['recipe_id']
      });
      const likedRecipeIds = userLikes.map(l => l.recipe_id);

      // 2. Получаем категории, которые нравятся пользователю (на основе его лайков)
      const favoriteCategories = await RecipeCategory.findAll({
        where: { recipe_id: { [Op.in]: likedRecipeIds } },
        attributes: [[fn('COUNT', 'category_id'), 'count'], 'category_id'],
        group: ['category_id'],
        order: [[fn('COUNT', 'category_id'), 'DESC']],
        limit: 3
      });

      const catIds = favoriteCategories.map(c => c.category_id);

      // 3. Находим рекомендации
      let recommendedRecipes = [];

      if (catIds.length > 0) {
        // Рецепты из любимых категорий, которые пользователь еще не лайкал
        recommendedRecipes = await Recipe.findAll({
          where: {
            id: { [Op.notIn]: likedRecipeIds },
            is_private: false
          },
          include: [
            ...fullInclude,
            {
              model: Category,
              as: 'Categories',
              where: { id: { [Op.in]: catIds } },
              required: true
            }
          ],
          limit: 10,
          order: [fn('RANDOM')]
        });
      }

      // 4. Если рекомендаций мало, добавляем просто популярные рецепты
      if (recommendedRecipes.length < 10) {
        const popularRecipes = await Recipe.findAll({
          where: {
            id: { [Op.notIn]: [...likedRecipeIds, ...recommendedRecipes.map(r => r.id)] },
            is_private: false
          },
          include: fullInclude,
          limit: 10 - recommendedRecipes.length,
          order: [['created_at', 'DESC']] // Или можно по количеству лайков, если добавить агрегацию
        });
        recommendedRecipes = [...recommendedRecipes, ...popularRecipes];
      }

      // 5. Перемешиваем и отдаем
      res.json(recommendedRecipes.sort(() => Math.random() - 0.5));
    } catch (e) {
      res.status(500).json({ message: 'Ошибка при получении рекомендаций', error: e.message });
    }
  },
};

module.exports = rc;
