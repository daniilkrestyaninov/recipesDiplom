const { Report, User, Recipe } = require('../models');
const notificationController = require('./notificationController');

const rc = {
  // POST /reports
  create: async (req, res) => {
    try {
      const { type, reported_user_id, recipe_id, reason, description } = req.body;
      
      if (!type || !reason) {
        return res.status(400).json({ message: 'Тип и причина обязательны' });
      }

      if (!['recipe', 'user', 'profile'].includes(type)) {
        return res.status(400).json({ message: 'Неверный тип жалобы' });
      }

      // Basic validation based on type
      if (type === 'recipe' && !recipe_id) {
        return res.status(400).json({ message: 'recipe_id обязателен для жалобы на рецепт' });
      }
      if ((type === 'user' || type === 'profile') && !reported_user_id) {
        return res.status(400).json({ message: 'reported_user_id обязателен для жалобы на пользователя/профиль' });
      }

      const report = await Report.create({
        reporter_id: req.user.id,
        reported_user_id: reported_user_id || null,
        recipe_id: recipe_id || null,
        type,
        reason,
        description,
        status: 'pending'
      });

      // Уведомляем админов и модераторов о новой жалобе
      const pushTitle = 'Новая жалоба';
      const pushBody = `Поступила жалоба на ${type === 'recipe' ? 'рецепт' : 'пользователя'}: ${reason}`;
      
      await notificationController.sendPushToRole('Admin', pushTitle, pushBody, { report_id: String(report.id) });
      await notificationController.sendPushToRole('Moderator', pushTitle, pushBody, { report_id: String(report.id) });

      res.status(201).json({ message: 'Жалоба успешно отправлена', reportId: report.id });
    } catch (e) {
      res.status(500).json({ message: 'Ошибка при создании жалобы', error: e.message });
    }
  },

  // Admin/Moderator only: GET /reports
  getAll: async (req, res) => {
    try {
      if (req.user.role !== 'Admin' && req.user.role !== 'Moderator') {
        return res.status(403).json({ message: 'Нет прав' });
      }

      const reports = await Report.findAll({
        include: [
          { model: User, as: 'Reporter', attributes: ['id', 'username'] },
          { model: User, as: 'ReportedUser', attributes: ['id', 'username'] },
          { model: Recipe, as: 'ReportedRecipe', attributes: ['id', 'title'] }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json(reports);
    } catch (e) {
      res.status(500).json({ message: 'Ошибка при получении жалоб', error: e.message });
    }
  },

  // Admin/Moderator only: PATCH /reports/:id
  updateStatus: async (req, res) => {
    try {
      if (req.user.role !== 'Admin' && req.user.role !== 'Moderator') {
        return res.status(403).json({ message: 'Нет прав' });
      }

      const { status } = req.body;
      if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
        return res.status(400).json({ message: 'Неверный статус' });
      }

      const report = await Report.findByPk(req.params.id);
      if (!report) return res.status(404).json({ message: 'Жалоба не найдена' });

      report.status = status;
      await report.save();

      // Уведомляем автора жалобы (репортера)
      try {
        let statusText = status === 'resolved' ? 'Принята' : (status === 'dismissed' ? 'Отклонена' : 'Рассмотрена');
        await notificationController.sendPushToUser(
          report.reporter_id, 
          'Обновление по жалобе', 
          `Ваша жалоба была рассмотрена. Статус: ${statusText}.`,
          { type: 'REPORT_STATUS', report_id: String(report.id), status }
        );
      } catch (e) { console.error('Error sending report push:', e.message); }

      // Если жалоба "Принята" (resolved) и это рецепт — автоматически удаляем его
      if (status === 'resolved' && report.type === 'recipe' && report.recipe_id) {
        const recipe = await Recipe.findByPk(report.recipe_id);
        if (recipe) {
          const authorId = recipe.user_id;
          const recipeTitle = recipe.title;
          await recipe.destroy();

          // Уведомляем автора рецепта, что его удалили по жалобе
          await notificationController.sendPushToUser(
            authorId, 
            'Рецепт удален', 
            `Ваш рецепт "${recipeTitle}" был удален по результатам жалобы.`,
            { type: 'RECIPE_DELETED_BY_REPORT' }
          );
        }
      }

      res.json({ message: 'Статус обновлен. Действие выполнено.', report });
    } catch (e) {
      console.error('Update Report Error:', e);
      res.status(500).json({ message: 'Ошибка при обновлении статуса', error: e.message });
    }
  }
};

module.exports = rc;
