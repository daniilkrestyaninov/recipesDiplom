const { User, Recipe, Comment, Like, Role } = require('../models');
const { Op } = require('sequelize');

const admin = {
  // GET /admin/stats
  getStats: async (req, res) => {
    try {
      const [users, recipes, comments, likes] = await Promise.all([
        User.count(), Recipe.count(), Comment.count(), Like.count(),
      ]);
      res.json({ users, recipes, comments, likes });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  // GET /admin/users
  getUsers: async (req, res) => {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password', 'password_reset_code', 'password_reset_expires'] },
        include: [{ model: Role, attributes: ['name'] }],
        order: [['created_at', 'DESC']],
      });
      res.json(users);
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  // POST /admin/users/:id/block
  blockUser: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
      await user.update({ is_blocked: true });
      res.json({ message: 'Пользователь заблокирован' });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  // DELETE /admin/recipes/:id
  deleteRecipe: async (req, res) => {
    try {
      const r = await Recipe.findByPk(req.params.id);
      if (!r) return res.status(404).json({ message: 'Рецепт не найден' });
      await r.destroy();
      res.json({ message: 'Рецепт удалён администратором' });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  // DELETE /admin/comments/:id
  deleteComment: async (req, res) => {
    try {
      const c = await Comment.findByPk(req.params.id);
      if (!c) return res.status(404).json({ message: 'Комментарий не найден' });
      await c.destroy();
      res.json({ message: 'Комментарий удалён администратором' });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },
};

module.exports = admin;
