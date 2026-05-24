const { User, Subscription, Like, Favorite, Recipe, Notification, Ingredient, Step, NationalKitchen, Category, Celebration, TypeCooking, Comment, Unit, CookedRecipe, sequelize } = require('../models');
const { Op, fn, col } = require('sequelize');
const notificationController = require('./notificationController');

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

const attachRatings = async (recipes, userId = null) => {
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

  const cookedCounts = await CookedRecipe.findAll({
    where: { recipe_id: { [Op.in]: recipeIds } },
    attributes: [
      'recipe_id',
      [fn('COUNT', col('id')), 'total_cooked']
    ],
    group: ['recipe_id'],
    raw: true
  });

  const commentCounts = await Comment.findAll({
    where: { recipe_id: { [Op.in]: recipeIds } },
    attributes: [
      'recipe_id',
      [fn('COUNT', col('id')), 'total_comments']
    ],
    group: ['recipe_id'],
    raw: true
  });

  let userCookedIds = new Set();
  if (userId) {
    const userCooked = await CookedRecipe.findAll({
      where: { user_id: userId, recipe_id: { [Op.in]: recipeIds } },
      attributes: ['recipe_id'],
      raw: true
    });
    userCookedIds = new Set(userCooked.map(c => String(c.recipe_id)));
  }

  return recipes.map(r => {
    const rData = r.toJSON ? r.toJSON() : r;
    const ratingInfo = recipeRatings.find(rt => String(rt.recipe_id) === String(rData.id));
    rData.rating = parseFloat(ratingInfo?.avg_rating || 0).toFixed(1);
    rData.total_reviews = parseInt(ratingInfo?.total_reviews || 0);
    rData.likes_count = rData.Likes ? rData.Likes.length : 0;

    const cookedInfo = cookedCounts.find(c => String(c.recipe_id) === String(rData.id));
    rData.cooked_count = parseInt(cookedInfo?.total_cooked || 0);
    rData.is_cooked = userCookedIds.has(String(rData.id));

    const commentInfo = commentCounts.find(c => String(c.recipe_id) === String(rData.id));
    rData.comments_count = parseInt(commentInfo?.total_comments || 0);

    return rData;
  });
};

const sc = {
  follow: async (req, res) => {
    try {
      const fid = parseInt(req.params.id);
      if (fid === req.user.id) return res.status(400).json({ message: 'Нельзя подписаться на себя' });
      if (!(await User.findByPk(fid))) return res.status(404).json({ message: 'Пользователь не найден' });
      if (await Subscription.findOne({ where: { follower_id: req.user.id, following_id: fid } }))
        return res.status(400).json({ message: 'Уже подписан' });
      await Subscription.create({ follower_id: req.user.id, following_id: fid, subscribed_at: new Date() });
      
      // Notification
      await Notification.create({
        user_id: fid,
        actor_id: req.user.id,
        type: 'FOLLOW'
      });

      // Push-уведомление о новой подписке (только если не сам на себя)
      if (fid !== req.user.id) {
        await notificationController.sendPushToUser(
          fid, 
          'Новый подписчик!', 
          `${req.user.username} подписался на ваши обновления.`,
          { type: 'FOLLOW', follower_id: String(req.user.id) }
        );
      }

      res.status(201).json({ message: 'Подписка оформлена' });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  unfollow: async (req, res) => {
    try {
      const del = await Subscription.destroy({ where: { follower_id: req.user.id, following_id: req.params.id } });
      if (!del) return res.status(404).json({ message: 'Подписка не найдена' });
      res.json({ message: 'Отписка выполнена' });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  getFollowers: async (req, res) => {
    try {
      const u = await User.findByPk(req.params.id, {
        include: [{ model: User, as: 'Followers', attributes: ['id', 'username', 'name', 'avatar_url'], through: { attributes: [] } }],
      });
      if (!u) return res.status(404).json({ message: 'Не найден' });
      res.json(u.Followers);
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  getFollowing: async (req, res) => {
    try {
      const u = await User.findByPk(req.params.id, {
        include: [{ model: User, as: 'Following', attributes: ['id', 'username', 'name', 'avatar_url'], through: { attributes: [] } }],
      });
      if (!u) return res.status(404).json({ message: 'Не найден' });
      res.json(u.Following);
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  like: async (req, res) => {
    try {
      if (await Like.findOne({ where: { user_id: req.user.id, recipe_id: req.params.id } }))
        return res.status(400).json({ message: 'Уже лайкнут' });
      await Like.create({ user_id: req.user.id, recipe_id: req.params.id });
      
      // Notification
      const recipe = await Recipe.findByPk(req.params.id);
      if (recipe && recipe.user_id !== req.user.id) {
        await Notification.create({
          user_id: recipe.user_id,
          actor_id: req.user.id,
          type: 'LIKE',
          recipe_id: recipe.id
        });
        // Push-уведомление о лайке
        await notificationController.sendPushToUser(
          recipe.user_id, 
          'Новая оценка', 
          `${req.user.username} оценил ваш рецепт "${recipe.title}".`,
          { type: 'LIKE', recipe_id: String(recipe.id) }
        );
      }

      res.status(201).json({ message: 'Лайк добавлен' });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  unlike: async (req, res) => {
    try {
      const del = await Like.destroy({ where: { user_id: req.user.id, recipe_id: req.params.id } });
      if (!del) return res.status(404).json({ message: 'Лайк не найден' });
      res.json({ message: 'Лайк убран' });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  getFavorites: async (req, res) => {
    try {
      const favs = await Favorite.findAll({
        where: { user_id: req.user.id },
        attributes: ['recipe_id'],
        order: [['created_at', 'DESC']],
        raw: true
      });
      const recipeIds = favs.map(f => f.recipe_id);
      if (recipeIds.length === 0) return res.json([]);

      const recipes = await Recipe.findAll({
        where: { id: { [Op.in]: recipeIds } },
        include: getFullInclude()
      });

      const recipesWithRatings = await attachRatings(recipes, req.user ? req.user.id : null);
      
      const sortedRecipes = recipeIds
        .map(id => recipesWithRatings.find(r => String(r.id) === String(id)))
        .filter(Boolean);

      res.json(sortedRecipes);
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  addFavorite: async (req, res) => {
    try {
      const { is_downloaded } = req.body;
      if (await Favorite.findOne({ where: { user_id: req.user.id, recipe_id: req.params.id } }))
        return res.status(400).json({ message: 'Уже в избранном' });
      const f = await Favorite.create({ user_id: req.user.id, recipe_id: req.params.id, is_downloaded: is_downloaded || false });
      res.status(201).json(f);
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  removeFavorite: async (req, res) => {
    try {
      const del = await Favorite.destroy({ where: { user_id: req.user.id, recipe_id: req.params.id } });
      if (!del) return res.status(404).json({ message: 'Не в избранном' });
      res.json({ message: 'Удалено из избранного' });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },
};

module.exports = sc;
