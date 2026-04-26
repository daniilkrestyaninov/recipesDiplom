const { Comment, User } = require('../models');

const commentController = {
  // GET /recipes/:id/comments
  getByRecipe: async (req, res) => {
    try {
      const comments = await Comment.findAll({
        where: { recipe_id: req.params.id, parent_comment_id: null },
        include: [
          { model: User, as: 'Author', attributes: ['id', 'username', 'avatar_url'] },
          {
            model: Comment,
            as: 'Replies',
            include: [{ model: User, as: 'Author', attributes: ['id', 'username', 'avatar_url'] }],
          },
        ],
        order: [['created_at', 'DESC']],
      });
      res.json(comments);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // POST /comments
  create: async (req, res) => {
    try {
      const { recipe_id, content, rating, parent_comment_id } = req.body;
      if (!recipe_id || !content || rating === undefined) {
        return res.status(400).json({ message: 'Поля recipe_id, content и rating обязательны' });
      }
      const comment = await Comment.create({
        user_id: req.user.id,
        recipe_id,
        content,
        rating,
        parent_comment_id: parent_comment_id || null,
      });
      const full = await Comment.findByPk(comment.id, {
        include: [{ model: User, as: 'Author', attributes: ['id', 'username', 'avatar_url'] }],
      });
      res.status(201).json(full);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // DELETE /comments/:id
  delete: async (req, res) => {
    try {
      const comment = await Comment.findByPk(req.params.id);
      if (!comment) return res.status(404).json({ message: 'Комментарий не найден' });
      if (comment.user_id !== req.user.id && req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Нет прав для удаления' });
      }
      await comment.destroy();
      res.json({ message: 'Комментарий удален' });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },
};

module.exports = commentController;
