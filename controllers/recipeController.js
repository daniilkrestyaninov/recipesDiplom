const { Recipe, User, Ingredient, RecipeIngredient, RecipeCategory,
  Step, NationalKitchen, Category, Celebration, TypeCooking, Like,
  Subscription, PersonalNote, CookedRecipe, Comment, Unit, Notification, sequelize } = require('../models');
const { Op, fn, col } = require('sequelize');
const geminiService = require('../services/geminiService');

const getFullInclude = () => [
  { model: User, attributes: ['id', 'username', 'name', 'avatar_url', 'is_blocked'] },
  {
    model: Ingredient,
    as: 'Ingredients',
    through: { attributes: ['quantity', 'note'] },
    include: [{ model: Unit, as: 'Unit' }]
  },
  { model: Step, as: 'Steps' },
  { model: NationalKitchen, as: 'Kitchen' },
  { model: Celebration, as: 'Celebration' },
  { model: TypeCooking, as: 'TypeCooking' },
  { model: Category, as: 'Categories' },
  { 
    model: Like, 
    as: 'Likes', 
    attributes: ['user_id']
  },
];

const attachRatings = async (recipes) => {
  if (!recipes || recipes.length === 0) return [];

  const recipeIds = recipes.map(r => r.id);
  const recipeRatings = await Comment.findAll({
    where: { recipe_id: { [Op.in]: recipeIds } },
    attributes: [
      'recipe_id',
      [fn('AVG', col('rating')), 'avg_rating'],
      [fn('COUNT', col('rating')), 'total_reviews']
    ],
    group: ['recipe_id'],
    raw: true
  });

  return recipes.map(r => {
    const rData = r.toJSON ? r.toJSON() : r;
    const ratingInfo = recipeRatings.find(rt => String(rt.recipe_id) === String(rData.id));
    rData.rating = parseFloat(ratingInfo?.avg_rating || 0).toFixed(1);
    rData.total_reviews = parseInt(ratingInfo?.total_reviews || 0);
    rData.likes_count = rData.Likes ? rData.Likes.length : 0;
    return rData;
  });
};

const rc = {
  getLikes: async (req, res) => {
    try {
      const { Like, User } = require('../models');
      const likes = await Like.findAll({
        where: { recipe_id: req.params.id },
        include: [{ model: User, attributes: ['id', 'username', 'name', 'avatar_url'] }]
      });
      res.json(likes.map(l => l.User));
    } catch (e) {
      res.status(500).json({ message: 'Ошибка', error: e.message });
    }
  },

  getAll: async (req, res) => {
    try {
      let { kitchen_id, celebration_id, cooking_id, difficulty, is_private, search, category_id } = req.query;

      const parseFilter = (val) => {
        if (!val) return null;
        if (Array.isArray(val)) return val;
        if (typeof val === 'string' && val.includes(',')) return val.split(',');
        return [val]; // Всегда возвращаем массив
      };

      kitchen_id = parseFilter(kitchen_id);
      celebration_id = parseFilter(celebration_id);
      cooking_id = parseFilter(cooking_id);
      category_id = parseFilter(category_id);

      const where = {};
      if (kitchen_id) where.kitchen_id = { [Op.in]: kitchen_id };
      if (celebration_id) where.celebration_id = { [Op.in]: celebration_id };
      if (cooking_id) where.cooking_id = { [Op.in]: cooking_id };
      if (difficulty) where.difficulty = difficulty;

      // По умолчанию для общей ленты показываем только публичные
      if (is_private !== undefined) {
        where.is_private = is_private === 'true';
      } else {
        where.is_private = false;
      }

      if (search) where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];

      const include = getFullInclude(category_id ? false : true);
      // Не показываем рецепты заблокированных пользователей для всех, кроме админов
      if (!req.user || req.user.role !== 'Admin') {
        const userIncl = include.find(i => i.model === User);
        if (userIncl) {
          userIncl.where = { is_blocked: false };
        }
      }

      if (category_id) {
        const catIdx = include.findIndex(i => i.as === 'Categories');
        if (catIdx !== -1) {
          include[catIdx].where = { id: { [Op.in]: category_id } };
          include[catIdx].required = true;
          include[catIdx].separate = false; // Cannot use separate with where/required on the same include
        }
      }

      const recipes = await Recipe.findAll({ where, include, order: [['created_at', 'DESC']] });
      res.json(await attachRatings(recipes));
    } catch (e) { res.status(500).json({ message: 'Ошибка получения рецептов', error: e.message }); }
  },

  getFeed: async (req, res) => {
    try {
      const subs = await Subscription.findAll({ where: { follower_id: req.user.id }, attributes: ['following_id'] });
      const ids = subs.map(s => s.following_id);

      // Если подписок нет, показываем общую ленту свежих рецептов (лента "Открытия")
      if (!ids.length) {
        const include = getFullInclude();
        const userIncl = include.find(i => i.model === User);
        if (userIncl) userIncl.where = { is_blocked: false };

        const recipes = await Recipe.findAll({
          where: { is_private: false },
          include,
          limit: 20,
          order: [['created_at', 'DESC']],
        });
        return res.json(await attachRatings(recipes));
      }

      const include = getFullInclude();
      const userIncl = include.find(i => i.model === User);
      if (userIncl) userIncl.where = { is_blocked: false };

      const recipes = await Recipe.findAll({
        where: { user_id: { [Op.in]: ids }, is_private: false },
        include,
        order: [['created_at', 'DESC']],
      });

      res.json(await attachRatings(recipes));
    } catch (e) { res.status(500).json({ message: 'Ошибка ленты', error: e.message }); }
  },

  getRandom: async (req, res) => {
    try {
      const include = getFullInclude();
      const userIncl = include.find(i => i.model === User);
      if (userIncl) userIncl.where = { is_blocked: false };

      const r = await Recipe.findOne({ where: { is_private: false }, order: [fn('RANDOM')], include });
      if (!r) return res.status(404).json({ message: 'Нет рецептов' });
      res.json(r);
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  getById: async (req, res) => {
    try {
      const r = await Recipe.findByPk(req.params.id, { include: getFullInclude() });
      if (!r) return res.status(404).json({ message: 'Рецепт не найден' });

      // Если автор заблокирован, показываем только ему самому или админам
      const author = await User.findByPk(r.user_id);
      if (author && author.is_blocked) {
        const isOwner = req.user && Number(req.user.id) === Number(r.user_id);
        const isStaff = req.user && (req.user.role === 'Admin' || req.user.role === 'Moderator');
        if (!isOwner && !isStaff) {
          return res.status(404).json({ message: 'Рецепт недоступен (автор заблокирован)' });
        }
      }

      // Увеличиваем счетчик просмотров при каждом открытии
      await r.increment('views_count');
      r.views_count += 1; // Обновляем локально, чтобы в ответе сразу было новое значение

      const stats = await Comment.findOne({
        where: { recipe_id: req.params.id },
        attributes: [
          [fn('AVG', sequelize.col('rating')), 'avg_rating'],
          [fn('AVG', sequelize.col('taste_sweet')), 'avg_sweet'],
          [fn('AVG', sequelize.col('taste_sour')), 'avg_sour'],
          [fn('AVG', sequelize.col('taste_salty')), 'avg_salty'],
          [fn('AVG', sequelize.col('taste_spicy')), 'avg_spicy'],
          [fn('AVG', sequelize.col('taste_umami')), 'avg_umami'],
          [fn('COUNT', sequelize.col('rating')), 'total_reviews']
        ],
        raw: true
      });

      const recipeData = r.toJSON();
      if (stats) {
        recipeData.rating = parseFloat(stats.avg_rating || 0).toFixed(1);
        recipeData.total_reviews = parseInt(stats.total_reviews || 0);
        recipeData.taste_averages = {
          sweet: parseFloat(stats.avg_sweet || 0).toFixed(1),
          sour: parseFloat(stats.avg_sour || 0).toFixed(1),
          salty: parseFloat(stats.avg_salty || 0).toFixed(1),
          spicy: parseFloat(stats.avg_spicy || 0).toFixed(1),
          umami: parseFloat(stats.avg_umami || 0).toFixed(1)
        };
      } else {
        recipeData.rating = "0.0";
        recipeData.total_reviews = 0;
        recipeData.taste_averages = { sweet: "0.0", sour: "0.0", salty: "0.0", spicy: "0.0", umami: "0.0" };
      }

      const result = await attachRatings([recipeData]);
      res.json(result[0]);
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  create: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      console.log('--- START RECIPE CREATE ---');
      console.log('Body:', JSON.stringify(req.body, null, 2));
      const { title, description, difficulty, image_url, is_private, kitchen_id, celebration_id, cooking_id, portion, calorific, cooking_time, ingredients = [], steps = [], categories = [], proteins, fats, carbohydrates, is_generated, is_parsed } = req.body;

      // Валидация
      if (!title || title.trim().length < 3) return res.status(400).json({ message: 'Название рецепта слишком короткое' });
      if (!description || description.trim().length < 5) return res.status(400).json({ message: 'Описание слишком короткое' });
      if (!portion || portion < 1) return res.status(400).json({ message: 'Укажите корректное количество порций' });
      if (!cooking_time || cooking_time < 1) return res.status(400).json({ message: 'Укажите корректное время приготовления' });
      if (ingredients.length === 0) return res.status(400).json({ message: 'Рецепт должен содержать хотя бы один ингредиент' });
      if (steps.length === 0) return res.status(400).json({ message: 'Рецепт должен содержать хотя бы один шаг' });

      const ingredientDetailsForAI = [];
      const ingredientLinks = [];

      for (const i of ingredients) {
        let ingredientId = i.id;
        let ingredientName = i.name;
        let ingredientUnit = '';

        if (!ingredientId && ingredientName) {
          const [ing] = await Ingredient.findOrCreate({
            where: { name: ingredientName },
            defaults: { unit_id: 1 }, // Default to first unit if not provided
            transaction: t
          });
          const ingWithUnit = await Ingredient.findByPk(ing.id, { include: [{ model: Unit, as: 'Unit' }], transaction: t });
          ingredientId = ing.id;
          ingredientName = ing.name;
          ingredientUnit = ingWithUnit?.Unit?.short_name || '';
        } else if (ingredientId) {
          const ing = await Ingredient.findByPk(ingredientId, { include: [{ model: Unit, as: 'Unit' }], transaction: t });
          if (ing) {
            ingredientName = ing.name;
            ingredientUnit = ing.Unit?.short_name || '';
          }
        }

        ingredientLinks.push({
          ingredient_id: ingredientId,
          quantity: i.unit ? `${i.quantity || ''} ${i.unit}`.trim() : String(i.quantity || ''),
          note: i.note || ''
        });

        ingredientDetailsForAI.push(`${ingredientName} ${i.quantity || ''} ${ingredientUnit} ${i.note || ''}`);
      }

      let pfcData = { proteins, fats, carbohydrates, calorific, is_ai_pfc: false };
      if (!proteins && !fats && !carbohydrates) {
        try {
          const aiResult = await geminiService.calculatePFC(title, ingredientDetailsForAI);
          if (aiResult) {
            pfcData = { ...aiResult, is_ai_pfc: true };
          }
        } catch (aiErr) {
          console.error('Ошибка расчета КБЖУ через ИИ:', aiErr.message);
        }
      }

      const recipe = await Recipe.create({
        user_id: req.user.id,
        title, description, difficulty: difficulty ? String(difficulty) : '1', image_url,
        is_private: (is_generated || is_parsed) ? true : (is_private || false),
        is_generated: is_generated || false,
        is_parsed: is_parsed || false,
        kitchen_id, celebration_id, cooking_id, portion,
        calorific: pfcData.calorific,
        proteins: pfcData.proteins,
        fats: pfcData.fats,
        carbohydrates: pfcData.carbohydrates,
        is_ai_pfc: pfcData.is_ai_pfc,
        cooking_time
      }, { transaction: t });

      if (ingredientLinks.length) {
        await RecipeIngredient.bulkCreate(ingredientLinks.map(link => ({ ...link, recipe_id: recipe.id })), { transaction: t });
      }
      if (steps.length) {
        await Step.bulkCreate(steps.map((s, idx) => ({
          recipe_id: recipe.id,
          step_number: s.step_number || idx + 1,
          description: s.description,
          image_url: s.image_url
        })), { transaction: t });
      }
      if (categories.length) {
        await RecipeCategory.bulkCreate(categories.map(catId => ({ recipe_id: recipe.id, category_id: catId })), { transaction: t });
      }

      await t.commit();

      // Notification for followers (Async, after commit)
      if (!recipe.is_private) {
        try {
          const followers = await Subscription.findAll({ where: { following_id: req.user.id } });
          const notifications = followers.map(f => ({
            user_id: f.follower_id,
            actor_id: req.user.id,
            type: 'NEW_POST',
            recipe_id: recipe.id
          }));
          if (notifications.length) {
            await Notification.bulkCreate(notifications);
          }
        } catch (err) {
          console.error('Ошибка создания уведомлений для подписчиков:', err);
        }
      }

      const finalRecipe = await Recipe.findByPk(recipe.id, { include: getFullInclude() });
      const [withRatings] = await attachRatings([finalRecipe]);
      res.status(201).json(withRatings);
    } catch (e) {
      console.error('CRITICAL ERROR during Recipe Create:', e);
      if (t) await t.rollback();
      res.status(500).json({ message: 'Ошибка создания', error: e.message });
    }
  },

  update: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      console.log('--- START RECIPE UPDATE ---');
      console.log('ID:', req.params.id);
      console.log('Body:', JSON.stringify(req.body, null, 2));
      const r = await Recipe.findByPk(req.params.id);
      if (!r) {
        await t.rollback();
        return res.status(404).json({ message: 'Рецепт не найден' });
      }
      if (Number(r.user_id) !== req.user.id && req.user.role !== 'Admin' && req.user.role !== 'Moderator') {
        await t.rollback();
        return res.status(403).json({ message: 'Нет прав для редактирования' });
      }

      const { title, description, difficulty, image_url, is_private, kitchen_id, celebration_id, cooking_id, portion, calorific, cooking_time, ingredients, steps, categories, proteins, fats, carbohydrates, is_generated, is_parsed } = req.body;

      // Запрещаем делать сгенерированные или спарсенные рецепты публичными
      if ((r.is_generated || r.is_parsed) && is_private === false) {
        await t.rollback();
        return res.status(400).json({ message: 'Сгенерированные ИИ или спарсенные рецепты должны оставаться приватными' });
      }

      // Обновляем основные поля
      await r.update({
        title, description, difficulty: difficulty ? String(difficulty) : r.difficulty,
        image_url, is_private, kitchen_id, celebration_id, cooking_id, portion,
        calorific, proteins, fats, carbohydrates, cooking_time, 
        is_generated: is_generated !== undefined ? is_generated : r.is_generated,
        is_parsed: is_parsed !== undefined ? is_parsed : r.is_parsed
      }, { transaction: t });

      // Обновляем ингредиенты (если прислали)
      if (ingredients) {
        console.log('Update: destroying ingredients for recipe', r.id);
        const delIng = await RecipeIngredient.destroy({ where: { recipe_id: r.id }, transaction: t });
        console.log('Deleted ingredients:', delIng);
        const ingredientLinks = [];
        for (const i of ingredients) {
          let ingredientId = i.id;
          if (!ingredientId && i.name) {
            const [ing] = await Ingredient.findOrCreate({ where: { name: i.name }, defaults: { unit_id: 1 }, transaction: t });
            ingredientId = ing.id;
          }
          if (ingredientId) {
            ingredientLinks.push({
              recipe_id: r.id,
              ingredient_id: ingredientId,
              quantity: i.unit ? `${i.quantity || ''} ${i.unit}`.trim() : String(i.quantity || ''),
              note: i.note || ''
            });
          }
        }
        if (ingredientLinks.length) {
            console.log('Creating new ingredients:', ingredientLinks.length);
            await RecipeIngredient.bulkCreate(ingredientLinks, { transaction: t });
        }
      }

      // Обновляем шаги
      if (steps) {
        console.log('Update: destroying steps for recipe', r.id);
        const delStep = await Step.destroy({ where: { recipe_id: r.id }, transaction: t });
        console.log('Deleted steps:', delStep);
        if (steps.length) {
            console.log('Creating new steps:', steps.length);
            await Step.bulkCreate(steps.map((s, idx) => ({
            recipe_id: r.id,
            step_number: s.step_number || idx + 1,
            description: s.description,
            image_url: s.image_url
            })), { transaction: t });
        }
      }

      // Обновляем категории
      if (categories) {
        console.log('Update: destroying categories for recipe', r.id);
        await RecipeCategory.destroy({ where: { recipe_id: r.id }, transaction: t });
        if (categories.length) {
            await RecipeCategory.bulkCreate(categories.map(catId => ({ recipe_id: r.id, category_id: catId })), { transaction: t });
        }
      }

      await t.commit();
      console.log('Transaction committed for update');
      const finalRecipe = await Recipe.findByPk(r.id, { include: getFullInclude() });
      const [withRatings] = await attachRatings([finalRecipe]);
      res.json(withRatings);
    } catch (e) {
      console.error('CRITICAL ERROR during Recipe Update:', e);
      if (t) await t.rollback();
      res.status(500).json({ message: 'Ошибка обновления', error: e.message });
    }
  },

  delete: async (req, res) => {
    try {
      const r = await Recipe.findByPk(req.params.id);
      if (!r) return res.status(404).json({ message: 'Рецепт не найден' });
      if (Number(r.user_id) !== req.user.id && req.user.role !== 'Admin' && req.user.role !== 'Moderator') return res.status(403).json({ message: 'Нет прав' });
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
      const r = await Recipe.findByPk(req.params.id, {
        include: [{
          model: Ingredient,
          as: 'Ingredients',
          through: { attributes: ['quantity', 'note'] },
          include: [{ model: Unit, as: 'Unit' }]
        }]
      });
      if (!r) return res.status(404).json({ message: 'Рецепт не найден' });
      let txt = `Список продуктов: ${r.title}\n\n`;
      r.Ingredients.forEach(i => {
        txt += `- ${i.name}${i.RecipeIngredient.quantity ? ' — ' + i.RecipeIngredient.quantity : ''} ${i.Unit?.short_name || ''}${i.RecipeIngredient.note ? ' (' + i.RecipeIngredient.note + ')' : ''}\n`;
      });
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
      // Принимаем не только страницу, но и массив ID, которые фронтенд УЖЕ показал пользователю
      let { page = 1, limit = 20, exclude_ids } = req.query;
      page = parseInt(page);
      limit = parseInt(limit);
      const offset = (page - 1) * limit;

      // Парсим exclude_ids (например, "1,5,12,45" из Swagger)
      let excludedIdsArray = [];
      if (exclude_ids) {
        excludedIdsArray = exclude_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      }

      // 1. Получаем предпочтения пользователя
      const userLikes = await Like.findAll({
        where: { user_id: userId },
        attributes: ['recipe_id']
      });
      const likedRecipeIds = userLikes.map(l => l.recipe_id);

      // Добавляем лайкнутые рецепты в список исключений (чтобы не рекомендовать то, что уже оценено)
      const allExcludedIds = [...new Set([...excludedIdsArray, ...likedRecipeIds])];

      let catIds = [];
      if (likedRecipeIds.length > 0) {
        const favoriteCategories = await RecipeCategory.findAll({
          where: { recipe_id: { [Op.in]: likedRecipeIds } },
          attributes: [[fn('COUNT', col('category_id')), 'count'], 'category_id'],
          group: ['category_id'],
          order: [[fn('COUNT', col('category_id')), 'DESC']],
          limit: 3
        });
        catIds = favoriteCategories.map(c => c.category_id);
      }

      // 2. Формируем условия поиска (только публичные + исключаем просмотренное/лайкнутое)
      const whereClause = {
        is_private: false,
        ...(allExcludedIds.length > 0 && { id: { [Op.notIn]: allExcludedIds } })
      };

      // 3. Формируем динамическую сортировку
      let orderClause = [];

      if (catIds.length > 0) {
        // Используем мультипликативную случайность: RANDOM() * (1 + количество совпадений).
        // Это дает максимальную динамику: даже идеальное совпадение может уступить место 
        // случайному рецепту, если выпадет низкий коэффициент.
        orderClause.push([
          sequelize.literal(`RANDOM() * (1 + (
            SELECT COUNT(*) FROM recipe_categories 
            WHERE recipe_categories.recipe_id = "Recipe".id 
            AND recipe_categories.category_id IN (${catIds.join(',')})
          ))`), 'DESC'
        ]);
      } else {
        orderClause.push(fn('RANDOM'));
      }

      // 4. Двухэтапная выборка
      const recipeIdsResult = await Recipe.findAll({
        where: whereClause,
        attributes: ['id'],
        limit: limit,
        offset: offset,
        order: orderClause,
        raw: true
      });

      const ids = recipeIdsResult.map(r => String(r.id));

      if (ids.length === 0) {
        return res.json([]);
      }

      // Достаем полные данные для этих ID
      const recipes = await Recipe.findAll({
        where: { id: { [Op.in]: ids } },
        include: getFullInclude()
      });

      // Прикрепляем данные о рейтингах
      const recipesWithRatings = await attachRatings(recipes);

      // Важно: сортируем результат в JS, чтобы сохранить порядок, 
      // определенный случайным запросом выше.
      const sortedRecipes = ids.map(id => recipesWithRatings.find(r => String(r.id) === id)).filter(Boolean);

      res.json(sortedRecipes);
    } catch (e) {
      console.error('Error in getRecommendations:', e);
      res.status(500).json({ message: 'Ошибка при получении рекомендаций', error: e.message });
    }
  }


};

module.exports = rc;
