const { User, Subscription, Like, Favorite, Recipe } = require('../models');

const sc = {
  follow: async (req, res) => {
    try {
      const fid = parseInt(req.params.id);
      if (fid === req.user.id) return res.status(400).json({ message: 'Нельзя подписаться на себя' });
      if (!(await User.findByPk(fid))) return res.status(404).json({ message: 'Пользователь не найден' });
      if (await Subscription.findOne({ where: { follower_id: req.user.id, following_id: fid } }))
        return res.status(400).json({ message: 'Уже подписан' });
      await Subscription.create({ follower_id: req.user.id, following_id: fid, subscribed_at: new Date() });
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
        include: [{ model: Recipe, include: [{ model: User, attributes: ['id', 'username'] }] }],
        order: [['created_at', 'DESC']],
      });
      res.json(favs);
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
