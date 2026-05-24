const { User, Role, Recipe, Subscription, Like, Favorite, Comment,
  CookedRecipe, RefreshToken, CommentLike, Report, PersonalNote, Notification, VerificationRequest,
  NationalKitchen, Category, Celebration, TypeCooking, Ingredient, Step, Unit } = require('../models');
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

const userController = {
  // GET /users/me
  getMe: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password', 'password_reset_code', 'password_reset_expires'] },
        include: [{ model: Role, attributes: ['name'] }],
      });
      const userData = user.toJSON();
      userData.role = userData.Role?.name || 'user';
      res.json(userData);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // PATCH /users/me
  updateMe: async (req, res) => {
    try {
      const { name, bio, avatar_url, email } = req.body;
      const user = await User.findByPk(req.user.id);
      await user.update({ name, bio, avatar_url, email });
      const updated = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password', 'password_reset_code', 'password_reset_expires'] },
        include: [{ model: Role, attributes: ['name'] }],
      });
      const userData = updated.toJSON();
      userData.role = userData.Role?.name || 'user';
      res.json(userData);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка обновления', error: err.message });
    }
  },

  // DELETE /users/me
  deleteMe: async (req, res) => {
    try {
      const userId = req.user.id;
      // Каскадное удаление пользовательских данных
      await Comment.destroy({ where: { user_id: userId } });
      await Like.destroy({ where: { user_id: userId } });
      await Favorite.destroy({ where: { user_id: userId } });
      await CookedRecipe.destroy({ where: { user_id: userId } });
      await Subscription.destroy({ where: { follower_id: userId } });
      await Subscription.destroy({ where: { following_id: userId } });
      await RefreshToken.destroy({ where: { user_id: userId } });
      await PersonalNote.destroy({ where: { user_id: userId } });
      await CommentLike.destroy({ where: { user_id: userId } });
      await Report.destroy({ where: { [Op.or]: [{ reporter_id: userId }, { reported_user_id: userId }] } });
      await Notification.destroy({ where: { [Op.or]: [{ user_id: userId }, { actor_id: userId }] } });
      await Recipe.destroy({ where: { user_id: userId } });
      await User.destroy({ where: { id: userId } });
      res.json({ message: 'Аккаунт и все персональные данные удалены' });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка удаления', error: err.message });
    }
  },

  // GET /users/:id
  getUserById: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id, {
        attributes: { exclude: ['password', 'password_reset_code', 'password_reset_expires'] },
        include: [
          { model: Role, attributes: ['name'] },
          { 
            model: Recipe, 
            attributes: ['id', 'title', 'image_url', 'cooking_time', 'created_at', 'is_private'],
            where: (req.user && Number(req.user.id) === Number(req.params.id)) ? {} : { is_private: false },
            required: false
          },
        ],
      });
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
      
      // Скрываем заблокированных пользователей от других
      const isOwner = req.user && Number(req.user.id) === Number(user.id);
      const isAdmin = req.user && req.user.role === 'Admin';
      if (user.is_blocked && !isOwner && !isAdmin) {
        return res.status(404).json({ message: 'Пользователь заблокирован' });
      }

      // Статистика
      const recipesCount = await Recipe.count({ where: { user_id: req.params.id } });
      const followersCount = await Subscription.count({ where: { following_id: req.params.id } });
      const followingCount = await Subscription.count({ where: { follower_id: req.params.id } });

      const userData = user.toJSON();
      userData.role = userData.Role?.name || 'user';

      res.json({
        ...userData,
        stats: { recipesCount, followersCount, followingCount },
      });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // GET /users/:id/recipes
  getUserRecipes: async (req, res) => {
    try {
      const { id } = req.params;
      const include = getFullInclude();
      // Hide blocked user's recipes for non-admins
      if (!req.user || req.user.role !== 'Admin') {
        const userIncl = include.find(i => i.model === User);
        if (userIncl) {
          userIncl.where = { is_blocked: false };
        }
      }

      const recipes = await Recipe.findAll({
        where: { 
          user_id: id, 
          // Если запрашивает не владелец, показываем только публичные
          ...( (req.user && Number(req.user.id) === Number(id)) ? {} : { is_private: false } )
        },
        order: [['created_at', 'DESC']],
        include
      });
      res.json(await attachRatings(recipes, req.user ? req.user.id : null));
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },
  // GET /users/search?q=...
  search: async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) return res.json([]);
      
      const users = await User.findAll({
        where: {
          [Op.or]: [
            { username: { [Op.iLike]: `%${q}%` } },
            { name: { [Op.iLike]: `%${q}%` } }
          ],
          is_blocked: false // Hide blocked users from search
        },
        attributes: ['id', 'username', 'name', 'avatar_url', 'bio'],
        limit: 20
      });
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка поиска', error: err.message });
    }
  },

  // POST /users/verify-request
  requestVerification: async (req, res) => {
    try {
      const { full_name, info } = req.body;
      if (!full_name || !full_name.trim()) return res.status(400).json({ message: 'ФИО обязательно' });

      // Предотвращаем дублирование активных заявок
      const existing = await VerificationRequest.findOne({ where: { user_id: req.user.id, status: 'pending' } });
      if (existing) {
        return res.status(400).json({ message: 'У вас уже есть активная заявка на верификацию' });
      }

      const request = await VerificationRequest.create({
        user_id: req.user.id,
        full_name: full_name.trim(),
        info: info ? info.trim() : null,
        status: 'pending'
      });

      // Уведомляем админов
      await notificationController.sendPushToRole('Admin', 'Новая заявка на верификацию', `Пользователь просит верифицировать профиль: ${full_name.trim()}`);

      res.status(201).json({ message: 'Заявка отправлена', request });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // POST /users/me/appeal
  createAppeal: async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || !message.trim()) return res.status(400).json({ message: 'Текст апелляции обязателен' });
      
      const { Appeal } = require('../models');

      // Предотвращаем дублирование активных апелляций
      const existing = await Appeal.findOne({ where: { user_id: req.user.id, status: 'pending' } });
      if (existing) {
        return res.status(400).json({ message: 'У вас уже есть активная апелляция на рассмотрении' });
      }

      const appeal = await Appeal.create({ 
        user_id: req.user.id, 
        message: message.trim(),
        status: 'pending'
      });
      res.status(201).json({ message: 'Апелляция отправлена на рассмотрение', appeal });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // GET /users/me/appeal
  getMyAppeals: async (req, res) => {
    try {
      const { Appeal } = require('../models');
      const appeals = await Appeal.findAll({
        where: { user_id: req.user.id },
        order: [['created_at', 'DESC']]
      });
      res.json(appeals);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },
};


module.exports = userController;
