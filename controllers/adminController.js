const { User, Recipe, Comment, Like, Role, Category, NationalKitchen, Report, sequelize, MenuOfTheWeek, VerificationRequest, AuditLog, Notification } = require('../models');
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
      
      const mappedUsers = users.map(u => {
        const userData = u.toJSON();
        userData.role = userData.Role?.name || 'user';
        return userData;
      });
      
      res.json(mappedUsers);
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  // PATCH /admin/users/:id
  updateUser: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
      
      const { name, bio, role_id } = req.body;
      
      // Keep old role id for audit log
      const oldRoleId = user.role_id;
      
      await user.update({ 
        name: name !== undefined ? name : user.name,
        bio: bio !== undefined ? bio : user.bio,
        role_id: role_id !== undefined ? role_id : user.role_id
      });
      
      if (role_id !== undefined && oldRoleId !== role_id) {
        await AuditLog.create({ 
          admin_id: req.user.id, 
          action: 'UPDATE_ROLE', 
          entity: 'User', 
          entity_id: user.id 
        });
      }

      const updatedUser = await User.findByPk(user.id, {
        attributes: { exclude: ['password', 'password_reset_code', 'password_reset_expires'] },
        include: [{ model: Role, attributes: ['name'] }],
      });

      const userData = updatedUser.toJSON();
      userData.role = userData.Role?.name || 'user';

      res.json({ message: 'Профиль пользователя обновлен', user: userData });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  // POST /admin/users/:id/block
  blockUser: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
      await user.update({ is_blocked: true });
      await AuditLog.create({ admin_id: req.user.id, action: 'BLOCK_USER', entity: 'User', entity_id: user.id });
      res.json({ message: 'Пользователь заблокирован' });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  // DELETE /admin/recipes/:id
  deleteRecipe: async (req, res) => {
    try {
      const r = await Recipe.findByPk(req.params.id);
      if (!r) return res.status(404).json({ message: 'Рецепт не найден' });
      await r.destroy();
      await AuditLog.create({ admin_id: req.user.id, action: 'DELETE_RECIPE', entity: 'Recipe', entity_id: r.id });
      res.json({ message: 'Рецепт удалён администратором' });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  // DELETE /admin/comments/:id
  deleteComment: async (req, res) => {
    try {
      const c = await Comment.findByPk(req.params.id);
      if (!c) return res.status(404).json({ message: 'Комментарий не найден' });
      await c.destroy();
      await AuditLog.create({ admin_id: req.user.id, action: 'DELETE_COMMENT', entity: 'Comment', entity_id: c.id });
      res.json({ message: 'Комментарий удалён администратором' });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  // GET /admin/analytics
  getAnalytics: async (req, res) => {
    try {
      const last30Days = new Date(new Date() - 30 * 24 * 60 * 60 * 1000);

      const [
        registrations,
        recipeStats,
        popularCategories,
        popularKitchens,
        topRecipes,
        topUsers,
        reportsByStatus
      ] = await Promise.all([
        // Регистрации по дням
        User.findAll({
          attributes: [
            [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          where: { created_at: { [Op.gte]: last30Days } },
          group: [sequelize.fn('DATE', sequelize.col('created_at'))],
          order: [[sequelize.literal('date'), 'ASC']],
          raw: true
        }),
        // Рецепты по дням
        Recipe.findAll({
          attributes: [
            [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          where: { created_at: { [Op.gte]: last30Days } },
          group: [sequelize.fn('DATE', sequelize.col('created_at'))],
          order: [[sequelize.literal('date'), 'ASC']],
          raw: true
        }),
        // Популярные категории
        Category.findAll({
          attributes: [
            'name', 
            [sequelize.literal(`(SELECT COUNT(*) FROM recipe_categories WHERE category_id = "Category"."id")`), 'count']
          ],
          order: [[sequelize.literal('count'), 'DESC']],
          limit: 10,
          raw: true
        }),
        // Популярные кухни
        NationalKitchen.findAll({
          attributes: [
            'name', 
            [sequelize.literal(`(SELECT COUNT(*) FROM recipes WHERE kitchen_id = "NationalKitchen"."id")`), 'count']
          ],
          order: [[sequelize.literal('count'), 'DESC']],
          limit: 10,
          raw: true
        }),
        // Топ рецептов по просмотрам
        Recipe.findAll({
          attributes: ['id', 'title', 'views_count'],
          order: [['views_count', 'DESC']],
          limit: 10,
          raw: true
        }),
        // Топ активных пользователей (по рецептам)
        User.findAll({
          attributes: [
            'id', 'username', 'name', 
            [sequelize.literal(`(SELECT COUNT(*) FROM recipes WHERE user_id = "User"."id")`), 'count']
          ],
          order: [[sequelize.literal('count'), 'DESC']],
          limit: 10,
          raw: true
        }),
        // Статистика жалоб по статусам
        Report.findAll({
          attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
          group: ['status'],
          raw: true
        })
      ]);

      res.json({
        registrations,
        recipeStats,
        popularCategories,
        popularKitchens,
        topRecipes,
        topUsers,
        reportsByStatus
      });
    } catch (e) {
      res.status(500).json({ message: 'Ошибка при получении аналитики', error: e.message });
    }
  },

  // GET /admin/roles
  getRoles: async (req, res) => {
    try {
      const roles = await Role.findAll();
      res.json(roles);
    } catch (e) {
      res.status(500).json({ message: 'Ошибка при получении ролей', error: e.message });
    }
  },

  // PATCH /admin/users/:id
  updateUser: async (req, res) => {
    try {
      const { name, username, bio, avatar_url, role_id, is_blocked, is_verified } = req.body;
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

      await user.update({
        name: name !== undefined ? name : user.name,
        username: username !== undefined ? username : user.username,
        bio: bio !== undefined ? bio : user.bio,
        avatar_url: avatar_url !== undefined ? avatar_url : user.avatar_url,
        role_id: role_id !== undefined ? role_id : user.role_id,
        is_blocked: is_blocked !== undefined ? is_blocked : user.is_blocked,
        is_verified: is_verified !== undefined ? is_verified : user.is_verified,
      });

      await AuditLog.create({ admin_id: req.user.id, action: 'UPDATE_USER', entity: 'User', entity_id: user.id, details: req.body });

      res.json({ message: 'Данные пользователя обновлены', user });
    } catch (e) {
      res.status(500).json({ message: 'Ошибка при обновлении пользователя', error: e.message });
    }
  },

  // DELETE /admin/users/:id
  deleteUser: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
      
      // При удалении пользователя Sequelize удалит связанные записи, если настроено каскадное удаление в БД
      // Если нет, может потребоваться ручное удаление связанных данных
      await user.destroy();
      await AuditLog.create({ admin_id: req.user.id, action: 'DELETE_USER', entity: 'User', entity_id: user.id });
      res.json({ message: 'Пользователь и все его данные удалены' });
    } catch (e) {
      res.status(500).json({ message: 'Ошибка при удалении пользователя', error: e.message });
    }
  },
  // ==========================================
  // МЕНЮ НЕДЕЛИ (Menu of the Week)
  // ==========================================

  // GET /admin/menu-of-week
  getMenuOfWeek: async (req, res) => {
    try {
      const menu = await MenuOfTheWeek.findAll({
        include: [{ model: Recipe, attributes: ['id', 'title', 'image_url'] }],
        order: [['day_of_week', 'ASC']]
      });
      res.json(menu);
    } catch (e) {
      res.status(500).json({ message: 'Ошибка при получении меню', error: e.message });
    }
  },

  // POST /admin/menu-of-week
  addMenuOfWeek: async (req, res) => {
    try {
      const { day_of_week, recipe_id } = req.body;
      
      const count = await MenuOfTheWeek.count({ where: { day_of_week } });
      if (count >= 5) {
        return res.status(400).json({ message: 'Максимум 5 рецептов на один день' });
      }

      const item = await MenuOfTheWeek.create({ day_of_week, recipe_id });
      await AuditLog.create({ admin_id: req.user.id, action: 'ADD_MENU_WEEK', entity: 'Recipe', entity_id: recipe_id, details: { day_of_week } });
      
      res.status(201).json(item);
    } catch (e) {
      res.status(500).json({ message: 'Ошибка при добавлении в меню', error: e.message });
    }
  },

  // DELETE /admin/menu-of-week/:id
  removeMenuOfWeek: async (req, res) => {
    try {
      const item = await MenuOfTheWeek.findByPk(req.params.id);
      if (!item) return res.status(404).json({ message: 'Запись не найдена' });

      await item.destroy();
      await AuditLog.create({ admin_id: req.user.id, action: 'REMOVE_MENU_WEEK', entity: 'MenuOfTheWeek', entity_id: item.id });

      res.json({ message: 'Рецепт удален из меню недели' });
    } catch (e) {
      res.status(500).json({ message: 'Ошибка при удалении из меню', error: e.message });
    }
  },

  // ==========================================
  // МАССОВЫЕ УВЕДОМЛЕНИЯ (Broadcast Notifications)
  // ==========================================

  // POST /admin/notifications/broadcast
  broadcastNotification: async (req, res) => {
    try {
      const { title, body, message } = req.body;
      const finalTitle = title || 'Системное уведомление';
      const finalBody = body || message;
      
      if (!finalBody) return res.status(400).json({ message: 'Текст сообщения обязателен' });

      // 1. Сохраняем уведомления в БД для всех пользователей
      const users = await User.findAll({ attributes: ['id'] });
      const notifications = users.map(u => ({
        user_id: u.id,
        actor_id: req.user.id,
        type: 'SYSTEM',
        message: title ? `${title}: ${finalBody}` : finalBody,
        is_read: false
      }));
      await Notification.bulkCreate(notifications);

      // 2. Отправляем Push-уведомление через Firebase (FCM)
      let pushSent = false;
      try {
        const adminFirebase = require('firebase-admin');
        const { DeviceToken } = require('../models');
        
        if (adminFirebase.apps.length > 0) {
          // Получаем все токены из БД
          const deviceTokens = await DeviceToken.findAll({ attributes: ['token'] });
          const tokens = deviceTokens.map(dt => dt.token);

          if (tokens.length > 0) {
            const response = await adminFirebase.messaging().sendEachForMulticast({
              tokens: tokens,
              notification: {
                title: finalTitle,
                body: finalBody
              },
              data: {
                type: 'SYSTEM',
                title: finalTitle,
                body: finalBody
              },
              android: {
                priority: 'high',
                notification: {
                  channelId: 'umami_notifications',
                  priority: 'high'
                }
              }
            });
            console.log(`FCM Multicast: ${response.successCount} success, ${response.failureCount} failure`);
            pushSent = response.successCount > 0;
          }

          // Также дублируем в топик (на всякий случай)
          await adminFirebase.messaging().send({
            topic: 'global_broadcast',
            notification: { title: finalTitle, body: finalBody },
            data: { type: 'SYSTEM' }
          }).catch(e => console.error('Topic send error:', e.message));
        }
      } catch (fcmError) {
        console.error('Ошибка отправки FCM:', fcmError);
      }

      await AuditLog.create({ 
        admin_id: req.user.id, 
        action: 'BROADCAST_NOTIFICATION', 
        details: { title: finalTitle, body: finalBody, count: users.length, pushSent } 
      });

      res.json({ 
        message: `Уведомление разослано ${users.length} пользователям.`,
        pushStatus: pushSent ? 'отправлено' : 'ошибка/не настроено'
      });
    } catch (e) {
      console.error('Broadcast error:', e);
      res.status(500).json({ message: 'Ошибка при рассылке', error: e.message });
    }
  },

  // ==========================================
  // УПРАВЛЕНИЕ ВЕРИФИКАЦИЕЙ (Verification Management)
  // ==========================================

  // GET /admin/verifications
  getVerificationRequests: async (req, res) => {
    try {
      const reqs = await VerificationRequest.findAll({
        include: [{ model: User, attributes: ['id', 'username', 'name', 'avatar_url'] }],
        order: [['created_at', 'DESC']]
      });
      res.json(reqs);
    } catch (e) {
      res.status(500).json({ message: 'Ошибка при получении заявок', error: e.message });
    }
  },

  // PATCH /admin/verifications/:id
  processVerificationRequest: async (req, res) => {
    try {
      const { status, admin_notes } = req.body; // 'approved' или 'rejected'
      const vReq = await VerificationRequest.findByPk(req.params.id);
      if (!vReq) return res.status(404).json({ message: 'Заявка не найдена' });

      await vReq.update({ status, admin_notes });

      if (status === 'approved') {
        await User.update({ is_verified: true }, { where: { id: vReq.user_id } });
      }

      await AuditLog.create({ admin_id: req.user.id, action: 'PROCESS_VERIFICATION', entity: 'User', entity_id: vReq.user_id, details: { status } });

      res.json({ message: `Заявка ${status}`, request: vReq });
    } catch (e) {
      res.status(500).json({ message: 'Ошибка при обработке заявки', error: e.message });
    }
  },

  // ==========================================
  // ЛОГИ ДЕЙСТВИЙ (Audit Logs)
  // ==========================================

  // GET /admin/audit-logs
  getAuditLogs: async (req, res) => {
    try {
      const logs = await AuditLog.findAll({
        include: [{ model: User, attributes: ['id', 'username'] }],
        order: [['created_at', 'DESC']],
        limit: 100
      });
      res.json(logs);
    } catch (e) {
      res.status(500).json({ message: 'Ошибка при получении логов', error: e.message });
    }
  },

  // ==========================================
  // МАССОВЫЕ ОПЕРАЦИИ (Bulk Operations)
  // ==========================================

  // POST /admin/users/bulk-block
  bulkBlockUsers: async (req, res) => {
    try {
      const { userIds, is_blocked } = req.body; // array of IDs
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'Необходимо передать массив userIds' });
      }

      await User.update({ is_blocked }, { where: { id: { [Op.in]: userIds } } });
      await AuditLog.create({ admin_id: req.user.id, action: 'BULK_BLOCK_USERS', details: { userIds, is_blocked } });

      res.json({ message: `Статус блокировки обновлен для ${userIds.length} пользователей` });
    } catch (e) {
      res.status(500).json({ message: 'Ошибка при массовой блокировке', error: e.message });
    }
  },

  // POST /admin/recipes/bulk-delete
  bulkDeleteRecipes: async (req, res) => {
    try {
      const { recipeIds } = req.body;
      if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
        return res.status(400).json({ message: 'Необходимо передать массив recipeIds' });
      }

      const deleted = await Recipe.destroy({ where: { id: { [Op.in]: recipeIds } } });
      await AuditLog.create({ admin_id: req.user.id, action: 'BULK_DELETE_RECIPES', details: { recipeIds } });

      res.json({ message: `Удалено рецептов: ${deleted}` });
    } catch (e) {
      res.status(500).json({ message: 'Ошибка при массовом удалении рецептов', error: e.message });
    }
  }
};

module.exports = admin;