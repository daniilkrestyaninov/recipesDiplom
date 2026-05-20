const { Comment, User, CommentLike, Notification, Recipe } = require('../models');
const notificationController = require('./notificationController');

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
      
      // Валидация комментария
      if (!content || content.trim().length < 2) return res.status(400).json({ message: 'Комментарий слишком короткий' });
      if (!parent_comment_id && (!rating || rating < 1 || rating > 5)) {
        return res.status(400).json({ message: 'Оценка (1-5) обязательна для основного отзыва' });
      }
      if (!parent_comment_id && (typeof taste_sweet !== 'number' || typeof taste_sour !== 'number' || typeof taste_salty !== 'number' || typeof taste_spicy !== 'number' || typeof taste_umami !== 'number')) {
        return res.status(400).json({ message: 'Оценки вкусовых параметров обязательны' });
      }
      const comment = await Comment.create({
        user_id: req.user.id, recipe_id: req.params.id,
        content, rating: parent_comment_id ? null : rating, parent_comment_id: parent_comment_id || null,
        taste_sweet: parent_comment_id ? null : taste_sweet,
        taste_sour: parent_comment_id ? null : taste_sour,
        taste_salty: parent_comment_id ? null : taste_salty,
        taste_spicy: parent_comment_id ? null : taste_spicy,
        taste_umami: parent_comment_id ? null : taste_umami
      });
      const full = await Comment.findByPk(comment.id, {
        include: [{ model: User, as: 'Author', attributes: ['id', 'username', 'avatar_url'] }],
      });
      const plain = full.get({ plain: true });
      plain.likeCount = 0;
      plain.isLiked = false;

      // Notification logic
      try {
        if (parent_comment_id) {
          // Это ответ на комментарий
          const parentComment = await Comment.findByPk(parent_comment_id);
          if (parentComment && parentComment.user_id !== req.user.id) {
            await Notification.create({
              user_id: parentComment.user_id,
              actor_id: req.user.id,
              type: 'REPLY',
              recipe_id: Number(req.params.id),
              comment_id: comment.id
            });
            // Push-уведомление об ответе (только если не сам себе)
            if (parentComment.user_id !== req.user.id) {
              await notificationController.sendPushToUser(
                parentComment.user_id, 
                'Новый ответ', 
                `${req.user.username} ответил на ваш комментарий.`,
                { type: 'REPLY', recipe_id: String(req.params.id) }
              );
            }
          }
        } else {
          // Это новый комментарий под постом
          const recipe = await Recipe.findByPk(req.params.id);
          if (recipe && recipe.user_id !== req.user.id) {
            await Notification.create({
              user_id: recipe.user_id,
              actor_id: req.user.id,
              type: 'COMMENT',
              recipe_id: recipe.id,
              comment_id: comment.id
            });
            // Push-уведомление автору рецепта (уже есть проверка user_id !== req.user.id выше)
            await notificationController.sendPushToUser(
              recipe.user_id, 
              'Новый комментарий', 
              `${req.user.username} оставил отзыв о вашем рецепте "${recipe.title}".`,
              { type: 'COMMENT', recipe_id: String(recipe.id) }
            );
          }
        }
      } catch (notifyError) {
        console.error('Ошибка создания уведомления:', notifyError);
      }

      res.status(201).json(plain);
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  // DELETE /comments/:id
  delete: async (req, res) => {
    try {
      const c = await Comment.findByPk(req.params.id);
      if (!c) return res.status(404).json({ message: 'Комментарий не найден' });
      if (Number(c.user_id) !== req.user.id && req.user.role !== 'Admin' && req.user.role !== 'Moderator')
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
