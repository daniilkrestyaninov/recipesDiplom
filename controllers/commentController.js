const { Comment, User, CommentLike } = require('../models');

const cc = {
  // GET /recipes/:id/comments
  getByRecipe: async (req, res) => {
    try {
      const currentUserId = req.user ? req.user.id : null;
      const comments = await Comment.findAll({
        where: { recipe_id: req.params.id, parent_comment_id: null },
        include: [
          { model: User, as: 'Author', attributes: ['id', 'username', 'avatar_url'] },
          { 
            model: Comment, 
            as: 'Replies', 
            include: [
              { model: User, as: 'Author', attributes: ['id', 'username', 'avatar_url'] },
              { model: CommentLike, as: 'Likes', attributes: ['user_id'] }
            ] 
          },
          { model: CommentLike, as: 'Likes', attributes: ['user_id'] }
        ],
        order: [['created_at', 'DESC']],
      });

      // Transform to include likeCount and isLiked
      const transformed = comments.map(c => {
        const plain = c.get({ plain: true });
        plain.likeCount = plain.Likes ? plain.Likes.length : 0;
        plain.isLiked = plain.Likes ? plain.Likes.some(l => l.user_id == currentUserId) : false;
        delete plain.Likes;

        if (plain.Replies) {
          plain.Replies = plain.Replies.map(r => {
            r.likeCount = r.Likes ? r.Likes.length : 0;
            r.isLiked = r.Likes ? r.Likes.some(l => l.user_id == currentUserId) : false;
            delete r.Likes;
            return r;
          });
        }
        return plain;
      });

      res.json(transformed);
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  // POST /recipes/:id/comments
  createForRecipe: async (req, res) => {
    try {
      const { content, rating, parent_comment_id, taste_sweet, taste_sour, taste_salty, taste_spicy, taste_umami } = req.body;
      if (!content) return res.status(400).json({ message: 'content обязателен' });
      const comment = await Comment.create({
        user_id: req.user.id, recipe_id: req.params.id,
        content, rating, parent_comment_id: parent_comment_id || null,
        taste_sweet, taste_sour, taste_salty, taste_spicy, taste_umami
      });
      const full = await Comment.findByPk(comment.id, {
        include: [{ model: User, as: 'Author', attributes: ['id', 'username', 'avatar_url'] }],
      });
      const plain = full.get({ plain: true });
      plain.likeCount = 0;
      plain.isLiked = false;
      res.status(201).json(plain);
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

  // POST /comments/:id/like
  toggleLike: async (req, res) => {
    try {
      const commentId = req.params.id;
      const userId = req.user.id;

      const existingLike = await CommentLike.findOne({ where: { comment_id: commentId, user_id: userId } });
      if (existingLike) {
        await existingLike.destroy();
        return res.json({ liked: false });
      } else {
        await CommentLike.create({ comment_id: commentId, user_id: userId });
        return res.json({ liked: true });
      }
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  }
};

module.exports = cc;
