const { User, Role, Recipe, Subscription, Like, Favorite, Comment,
  CookedRecipe, RefreshToken } = require('../models');
const { Op } = require('sequelize');


const userController = {
  // GET /users/me
  getMe: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password', 'password_reset_code', 'password_reset_expires'] },
        include: [{ model: Role, attributes: ['name'] }],
      });
      res.json(user);
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
      });
      res.json(updated);
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
          { model: Recipe, attributes: ['id', 'title', 'image_url', 'cooking_time', 'created_at'] },
        ],
      });
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

      // Статистика
      const recipesCount = await Recipe.count({ where: { user_id: req.params.id } });
      const followersCount = await Subscription.count({ where: { following_id: req.params.id } });
      const followingCount = await Subscription.count({ where: { follower_id: req.params.id } });

      res.json({
        ...user.toJSON(),
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
          ...(req.user?.id !== Number(id) ? { is_private: false } : {})
        },
        order: [['created_at', 'DESC']],
        include: [
          { model: User, attributes: ['id', 'username', 'name', 'avatar_url'] },
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
          ]
        },
        attributes: ['id', 'username', 'name', 'avatar_url', 'bio'],
        limit: 20
      });
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка поиска', error: err.message });
    }
  },
};


module.exports = userController;
