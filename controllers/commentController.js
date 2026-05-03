const { Comment, User } = require('../models');

const cc = {
  // GET /recipes/:id/comments
  getByRecipe: async (req, res) => {
    try {
      const comments = await Comment.findAll({
        where: { recipe_id: req.params.id, parent_comment_id: null },
        include: [
          { model: User, as: 'Author', attributes: ['id', 'username', 'avatar_url'] },
          { model: Comment, as: 'Replies', include: [{ model: User, as: 'Author', attributes: ['id', 'username', 'avatar_url'] }] },
        ],
        order: [['created_at', 'DESC']],
      });
      res.json(comments);
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  // POST /recipes/:id/comments  (recipe_id берётся из params)
  createForRecipe: async (req, res) => {
    try {
      const { content, rating, parent_comment_id, taste_sweet, taste_sour, taste_salty, taste_spicy, taste_umami } = req.body;
      if (!content || rating === undefined) return res.status(400).json({ message: 'content и rating обязательны' });
      const comment = await Comment.create({
        user_id: req.user.id, recipe_id: req.params.id,
        content, rating, parent_comment_id: parent_comment_id || null,
        taste_sweet, taste_sour, taste_salty, taste_spicy, taste_umami
      });
      const full = await Comment.findByPk(comment.id, {
        include: [{ model: User, as: 'Author', attributes: ['id', 'username', 'avatar_url'] }],
      });
      res.status(201).json(full);
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  // DELETE /comments/:id
  delete: async (req, res) => {
    try {
      const c = await Comment.findByPk(req.params.id);
      if (!c) return res.status(404).json({ message: 'Комментарий не найден' });
      if (Number(c.user_id) !== req.user.id && req.user.role !== 'Admin')
        return res.status(403).json({ message: 'Нет прав' });
      await c.destroy();
      res.json({ message: 'Комментарий удалён' });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },
};

module.exports = cc;
