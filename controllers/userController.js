const { User, Role, Recipe, Subscription, Like, Favorite, Comment,
  CookedRecipe, RefreshToken, CommentLike, Report, PersonalNote, Notification, VerificationRequest } = require('../models');
const { Op } = require('sequelize');
const notificationController = require('./notificationController');


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
      const recipes = await Recipe.findAll({
        where: { 
          user_id: id, 
          // Если запрашивает не владелец, показываем только публичные
          ...( (req.user && Number(req.user.id) === Number(id)) ? {} : { is_private: false } )
        },
        order: [['created_at', 'DESC']],
        include: [
          { 
            model: User, 
            attributes: ['id', 'username', 'name', 'avatar_url', 'is_blocked'],
            where: { is_blocked: false } // Hide if user is blocked
          },
          { model: Like, as: 'Likes', attributes: ['user_id'] },
        ]
      });
      res.json(recipes);
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
      if (!full_name) return res.status(400).json({ message: 'ФИО обязательно' });

      const request = await VerificationRequest.create({
        user_id: req.user.id,
        full_name,
        info,
        status: 'pending'
      });

      // Уведомляем админов
      await notificationController.sendPushToRole('Admin', 'Новая заявка на верификацию', `Пользователь просит верифицировать профиль: ${full_name}`);

      res.status(201).json({ message: 'Заявка отправлена', request });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // POST /users/me/appeal
  createAppeal: async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ message: 'Текст апелляции обязателен' });
      
      const { Appeal } = require('../models');
      const appeal = await Appeal.create({ user_id: req.user.id, message });
      res.status(201).json({ message: 'Апелляция отправлена на рассмотрение', appeal });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },
};


module.exports = userController;
