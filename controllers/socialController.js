const { User, Recipe, Subscription, Like, Favorite } = require('../models');

const socialController = {
  // POST /users/:id/subscribe
  subscribe: async (req, res) => {
    try {
      const followingId = parseInt(req.params.id);
      if (followingId === req.user.id) {
        return res.status(400).json({ message: 'Нельзя подписаться на себя' });
      }
      const target = await User.findByPk(followingId);
      if (!target) return res.status(404).json({ message: 'Пользователь не найден' });

      const existing = await Subscription.findOne({
        where: { follower_id: req.user.id, following_id: followingId },
      });
      if (existing) return res.status(400).json({ message: 'Уже подписан' });

      await Subscription.create({
        follower_id: req.user.id,
        following_id: followingId,
        subscribed_at: new Date(),
      });
      res.status(201).json({ message: 'Подписка оформлена' });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // DELETE /users/:id/subscribe
  unsubscribe: async (req, res) => {
    try {
      const deleted = await Subscription.destroy({
        where: { follower_id: req.user.id, following_id: req.params.id },
      });
      if (!deleted) return res.status(404).json({ message: 'Подписка не найдена' });
      res.json({ message: 'Отписка выполнена' });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // GET /users/:id/followers
  getFollowers: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id, {
        include: [{
          model: User,
          as: 'Followers',
          attributes: ['id', 'username', 'name', 'avatar_url'],
          through: { attributes: [] },
        }],
      });
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
      res.json(user.Followers);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // GET /users/:id/following
  getFollowing: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id, {
        include: [{
          model: User,
          as: 'Following',
          attributes: ['id', 'username', 'name', 'avatar_url'],
          through: { attributes: [] },
        }],
      });
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
      res.json(user.Following);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // POST /recipes/:id/like  (toggle)
  toggleLike: async (req, res) => {
    try {
      const recipeId = req.params.id;
      const existing = await Like.findOne({
        where: { user_id: req.user.id, recipe_id: recipeId },
      });
      if (existing) {
        await existing.destroy();
        return res.json({ liked: false, message: 'Лайк убран' });
      }
      await Like.create({ user_id: req.user.id, recipe_id: recipeId });
      res.status(201).json({ liked: true, message: 'Лайк добавлен' });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // GET /favorites
  getFavorites: async (req, res) => {
    try {
      const favorites = await Favorite.findAll({
        where: { user_id: req.user.id },
        include: [{ model: Recipe, include: [{ model: User, attributes: ['id', 'username'] }] }],
        order: [['created_at', 'DESC']],
      });
      res.json(favorites);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // POST /recipes/:id/favorite
  addFavorite: async (req, res) => {
    try {
      const recipeId = req.params.id;
      const { is_downloaded } = req.body;
      const existing = await Favorite.findOne({
        where: { user_id: req.user.id, recipe_id: recipeId },
      });
      if (existing) return res.status(400).json({ message: 'Уже в избранном' });

      const fav = await Favorite.create({
        user_id: req.user.id,
        recipe_id: recipeId,
        is_downloaded: is_downloaded || false,
      });
      res.status(201).json(fav);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // DELETE /recipes/:id/favorite
  removeFavorite: async (req, res) => {
    try {
      const deleted = await Favorite.destroy({
        where: { user_id: req.user.id, recipe_id: req.params.id },
      });
      if (!deleted) return res.status(404).json({ message: 'Не найдено в избранном' });
      res.json({ message: 'Удалено из избранного' });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },
};

module.exports = socialController;
