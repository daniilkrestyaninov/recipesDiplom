const { User, Recipe, Comment, Like, Role, Category, NationalKitchen, Report, sequelize, MenuOfTheWeek, VerificationRequest, AuditLog, Notification, DeviceToken, Appeal } = require('../models');
const { Op } = require('sequelize');
const adminFirebase = require('firebase-admin');
const notificationController = require('./notificationController');

const admin = {
  // GET /admin/stats
  getStats: async (req, res) => {
    try {
      const [users, recipes, comments, likes, reports, appeals, verifications] = await Promise.all([
        User.count(), Recipe.count(), Comment.count(), Like.count(),
        Report.count(), Appeal.count(), VerificationRequest.count()
      ]);
      res.json({ users, recipes, comments, likes, reports, appeals, verifications });
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

        // Send notifications for role change
        const newRole = await Role.findByPk(role_id);
        if (newRole) {
          const roleName = newRole.name;
          const roleNameRu = { 'Admin': 'Администратор', 'Moderator': 'Модератор', 'User': 'Пользователь' }[roleName] || roleName;
          
          // Create database notification
          await Notification.create({
            user_id: user.id,
            actor_id: req.user.id,
            type: 'SYSTEM',
            message: `Ваша роль на платформе изменена на: ${roleNameRu}`
          });

          // Send FCM push notification
          const notificationController = require('./notificationController');
          await notificationController.sendPushToUser(
            user.id,
            'Изменение роли',
            `Администратор изменил вашу роль на: ${roleNameRu}`,
            { type: 'ROLE_CHANGE', role: roleName }
          );
        }
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
      const user = await User.findByPk(req.params.id, { include: [Role] });
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
      if (user.Role?.name === 'Admin') {
        return res.status(403).json({ message: 'Нельзя заблокировать администратора' });
      }
      if (Number(user.id) === Number(req.user.id)) {
        return res.status(400).json({ message: 'Вы не можете заблокировать самого себя' });
      }

      await user.update({ is_blocked: true });
      await AuditLog.create({ admin_id: req.user.id, action: 'BLOCK_USER', entity: 'User', entity_id: user.id });
      
      await notificationController.sendPushToUser(user.id, 'Аккаунт заблокирован', 'Ваш аккаунт был заблокирован администратором.');
      
      res.json({ message: 'Пользователь заблокирован' });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  // POST /admin/users/:id/unblock
  unblockUser: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
      await user.update({ is_blocked: false });
      await AuditLog.create({ admin_id: req.user.id, action: 'UNBLOCK_USER', entity: 'User', entity_id: user.id });
      
      await notificationController.sendPushToUser(user.id, 'Аккаунт разблокирован', 'Ваш аккаунт был разблокирован. Теперь вы снова можете пользоваться всеми функциями.');
      
      res.json({ message: 'Пользователь разблокирован' });
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

      const oldRoleId = user.role_id;

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

      // Send notifications for role change
      if (role_id !== undefined && oldRoleId !== role_id) {
        const newRole = await Role.findByPk(role_id);
        if (newRole) {
          const roleName = newRole.name;
          const roleNameRu = { 'Admin': 'Администратор', 'Moderator': 'Модератор', 'User': 'Пользователь' }[roleName] || roleName;
          
          // Create database notification
          await Notification.create({
            user_id: user.id,
            actor_id: req.user.id,
            type: 'SYSTEM',
            message: `Ваша роль на платформе изменена на: ${roleNameRu}`
          });

          // Send FCM push notification
          const notificationController = require('./notificationController');
          await notificationController.sendPushToUser(
            user.id,
            'Изменение роли',
            `Администратор изменил вашу роль на: ${roleNameRu}`,
            { type: 'ROLE_CHANGE', role: roleName }
          );
        }
      }

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

      // 2. Отправляем Push-уведомление через Firebase (только Topic, чтобы избежать дублей)
      if (adminFirebase.apps.length > 0) {
        await adminFirebase.messaging().send({
          topic: 'global_broadcast',
          notification: {
            title: finalTitle,
            body: finalBody
          },
          android: {
            priority: 'high',
            notification: {
              channelId: 'umami_notifications',
              priority: 'high'
            }
          },
          data: {
            type: 'SYSTEM',
            title: finalTitle,
            body: finalBody
          }
        }).then(() => console.log('FCM Topic broadcast sent successfully'))
          .catch(e => console.error('FCM Topic Error:', e.message));
      }

      await AuditLog.create({ 
        admin_id: req.user.id, 
        action: 'BROADCAST_NOTIFICATION', 
        details: { title: finalTitle, body: finalBody, count: users.length } 
      });

      res.json({ 
        message: `Уведомление разослано ${users.length} пользователям.`
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
        await notificationController.sendPushToUser(vReq.user_id, 'Профиль верифицирован!', 'Поздравляем! Ваша заявка на верификацию одобрена.');
      } else if (status === 'rejected') {
        await notificationController.sendPushToUser(vReq.user_id, 'Заявка отклонена', `К сожалению, ваша заявка на верификацию была отклонена. Причина: ${admin_notes || 'не указана'}`);
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

      let targetIds = userIds;

      if (is_blocked) {
        // Находим пользователей, которых пытаются заблокировать, и исключаем администраторов и себя
        const usersToBlock = await User.findAll({
          where: { id: { [Op.in]: userIds } },
          include: [{ model: Role }]
        });

        targetIds = usersToBlock
          .filter(u => u.Role?.name !== 'Admin' && Number(u.id) !== Number(req.user.id))
          .map(u => u.id);

        if (targetIds.length === 0) {
          return res.status(400).json({ message: 'Нет подходящих пользователей для блокировки (администраторы исключены)' });
        }
      }

      await User.update({ is_blocked }, { where: { id: { [Op.in]: targetIds } } });
      await AuditLog.create({ admin_id: req.user.id, action: 'BULK_BLOCK_USERS', details: { userIds: targetIds, is_blocked } });

      // Отправляем Push каждому заблокированному пользователю
      if (is_blocked) {
        for (const id of targetIds) {
          await notificationController.sendPushToUser(id, 'Аккаунт заблокирован', 'Ваш аккаунт был заблокирован администратором.');
        }
      }

      res.json({ message: `Статус блокировки обновлен для ${targetIds.length} пользователей` });
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

      // Перед удалением находим авторов, чтобы уведомить их
      const recipes = await Recipe.findAll({ where: { id: { [Op.in]: recipeIds } }, attributes: ['id', 'title', 'user_id'] });
      
      const deleted = await Recipe.destroy({ where: { id: { [Op.in]: recipeIds } }, individualHooks: true });
      await AuditLog.create({ admin_id: req.user.id, action: 'BULK_DELETE_RECIPES', details: { recipeIds } });

      // Уведомляем авторов
      for (const recipe of recipes) {
        await notificationController.sendPushToUser(recipe.user_id, 'Рецепт удален', `Ваш рецепт "${recipe.title}" был удален администратором.`);
      }

      res.json({ message: `Удалено рецептов: ${deleted}` });
    } catch (e) {
      res.status(500).json({ message: 'Ошибка при массовом удалении рецептов', error: e.message });
    }
  },

  // ==========================================
  // УПРАВЛЕНИЕ АПЕЛЛЯЦИЯМИ (Appeal Management)
  // ==========================================

  // GET /admin/appeals
  getAppeals: async (req, res) => {
    try {
      const appeals = await Appeal.findAll({
        include: [{ model: User, attributes: ['id', 'username', 'name', 'avatar_url'] }],
        order: [['created_at', 'DESC']]
      });
      res.json(appeals);
    } catch (e) {
      res.status(500).json({ message: 'Ошибка при получении апелляций', error: e.message });
    }
  },

  // PATCH /admin/appeals/:id
  processAppeal: async (req, res) => {
    try {
      const { status, admin_notes } = req.body; // 'reviewed', 'resolved'
      const appeal = await Appeal.findByPk(req.params.id);
      if (!appeal) return res.status(404).json({ message: 'Апелляция не найдена' });

      await appeal.update({ status, admin_notes });

      if (status === 'resolved') {
        // Если апелляция решена положительно, разблокируем пользователя
        const user = await User.findByPk(appeal.user_id);
        if (user) {
          await user.update({ is_blocked: false });
          await notificationController.sendPushToUser(user.id, 'Апелляция одобрена', 'Ваша апелляция была рассмотрена и одобрена. Аккаунт разблокирован.');
          await AuditLog.create({ admin_id: req.user.id, action: 'UNBLOCK_USER_VIA_APPEAL', entity: 'User', entity_id: user.id, details: { appeal_id: appeal.id } });
        }
      } else if (status === 'reviewed') {
        await notificationController.sendPushToUser(appeal.user_id, 'Апелляция рассмотрена', 'Ваша апелляция была рассмотрена администратором.');
      }

      await AuditLog.create({ admin_id: req.user.id, action: 'PROCESS_APPEAL', entity: 'Appeal', entity_id: appeal.id, details: { status } });

      res.json({ message: `Апелляция переведена в статус ${status}`, appeal });
    } catch (e) {
      res.status(500).json({ message: 'Ошибка при обработке апелляции', error: e.message });
    }
  },

  // GET /admin/backup
  backupDatabase: async (req, res) => {
    try {
      const { exec } = require('child_process');
      const fs = require('fs');
      const path = require('path');
      
      const dbConfig = sequelize.connectionManager.config;
      const backupDir = path.join(__dirname, '../backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
      const filePath = path.join(backupDir, fileName);
      
      // Set PGPASSWORD env variable to avoid password prompt
      process.env.PGPASSWORD = dbConfig.password;
      
      const pgDumpPath = process.env.PG_DUMP_PATH || 'pg_dump';
      const cmd = `"${pgDumpPath}" -h ${dbConfig.host} -p ${dbConfig.port || 5432} -U ${dbConfig.username} -F c -b -v -f "${filePath}" ${dbConfig.database}`;
      
      exec(cmd, async (error, stdout, stderr) => {
        // Clean password env
        delete process.env.PGPASSWORD;
        
        if (error) {
          console.error(`Backup error: ${error.message}`);
          return res.status(500).json({ message: 'Ошибка при создании резервной копии', error: error.message });
        }
        
        await AuditLog.create({ 
          admin_id: req.user.id, 
          action: 'DB_BACKUP', 
          entity: 'Database', 
          details: { fileName, filePath } 
        });
        
        res.download(filePath, fileName, (err) => {
          if (err) {
            console.error('Download error:', err);
          }
          // Safely delete file after download to save space
          fs.unlink(filePath, () => {});
        });
      });
    } catch (e) {
      res.status(500).json({ message: 'Ошибка при инициализации резервной копии', error: e.message });
    }
  }
};

module.exports = admin;