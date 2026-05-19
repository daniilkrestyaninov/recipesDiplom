const { Notification, User, Recipe, Comment, Role } = require('../models');
const { Op } = require('sequelize');

const notificationController = {
  // GET /notifications?page=1&limit=20
  getAll: async (req, res) => {
    try {
      let { page = 1, limit = 20 } = req.query;
      page = Math.max(1, parseInt(page));
      limit = Math.min(50, Math.max(1, parseInt(limit)));
      const offset = (page - 1) * limit;

      const { count, rows } = await Notification.findAndCountAll({
        where: { user_id: req.user.id },
        include: [
          {
            model: User,
            as: 'Actor',
            attributes: ['id', 'username', 'name', 'avatar_url'],
            include: [{ model: Role, attributes: ['name'] }]
          },
          { model: Recipe, as: 'Recipe', attributes: ['id', 'title', 'image_url'] },
          { model: Comment, as: 'Comment', attributes: ['id', 'content'] },
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      const processedNotifications = rows.map(row => {
        const plain = row.toJSON();
        if (plain.Actor) {
          const roleName = (plain.Actor.Role?.name || 'user').toLowerCase();
          plain.Actor.role = roleName;
          if (roleName === 'admin' || roleName === 'moderator') {
            // Mask the actor details completely!
            plain.Actor.username = roleName === 'admin' ? 'admin' : 'moderator';
            plain.Actor.name = roleName === 'admin' ? 'Администратор' : 'Модератор';
            plain.Actor.avatar_url = null;
          }
        }
        return plain;
      });

      res.json({
        notifications: processedNotifications,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка при получении уведомлений', error: err.message });
    }
  },

  // GET /notifications/unread-count
  getUnreadCount: async (req, res) => {
    try {
      const count = await Notification.count({
        where: { user_id: req.user.id, is_read: false }
      });
      res.json({ count });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // PATCH /notifications/read-all
  markAllRead: async (req, res) => {
    try {
      const [updated] = await Notification.update(
        { is_read: true },
        { where: { user_id: req.user.id, is_read: false } }
      );
      res.json({ message: 'Все уведомления помечены как прочитанные', updated });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // PATCH /notifications/:id/read
  markRead: async (req, res) => {
    try {
      const notification = await Notification.findOne({
        where: { id: req.params.id, user_id: req.user.id }
      });
      if (!notification) return res.status(404).json({ message: 'Уведомление не найдено' });
      
      await notification.update({ is_read: true });
      res.json({ message: 'Прочитано' });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // DELETE /notifications — очистить все уведомления
  deleteAll: async (req, res) => {
    try {
      const deleted = await Notification.destroy({
        where: { user_id: req.user.id }
      });
      res.json({ message: 'Уведомления удалены', deleted });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // POST /notifications/register-device
  registerDevice: async (req, res) => {
    try {
      const { token, device_type } = req.body;
      if (!token) return res.status(400).json({ message: 'Токен обязателен' });

      const user_id = req.user ? req.user.id : null;
      const { DeviceToken } = require('../models');

      const [device, created] = await DeviceToken.findOrCreate({
        where: { token },
        defaults: { user_id, device_type }
      });

      if (!created && device.user_id !== user_id) {
        await device.update({ user_id });
      }

      console.log(`Registering device: token=${token.substring(0, 10)}..., user_id=${user_id}`);
      res.json({ message: 'Устройство зарегистрировано', device });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка при регистрации устройства', error: err.message });
    }
  },

  // ── Хелперы для отправки Push (вызываются из других контроллеров) ──────────────────
  
  sendPushToUser: async (userId, title, body, data = {}) => {
    try {
      const adminFirebase = require('firebase-admin');
      if (!adminFirebase.apps.length) return;

      const { DeviceToken } = require('../models');
      const tokens = await DeviceToken.findAll({ where: { user_id: userId } });
      if (!tokens.length) return;

      const registrationTokens = tokens.map(t => t.token);
      
      const message = {
        tokens: registrationTokens,
        notification: { title, body },
        data: { ...data, title, body, user_id: String(userId) },
        android: {
          priority: 'high',
          notification: {
            channelId: 'umami_notifications',
            priority: 'high',
            defaultSound: true
          }
        }
      };

      const response = await adminFirebase.messaging().sendEachForMulticast(message);
      console.log(`FCM Push to User ${userId}: ${response.successCount} success, ${response.failureCount} failure`);
      return response;
    } catch (error) {
      console.error('Error sending push to user:', error);
    }
  },

  sendPushToRole: async (roleName, title, body, data = {}) => {
    try {
      const { User, Role } = require('../models');
      const users = await User.findAll({
        include: [{ model: Role, where: { name: roleName } }]
      });

      const notificationController = require('./notificationController');
      for (const user of users) {
        await notificationController.sendPushToUser(user.id, title, body, data);
      }
    } catch (error) {
      console.error('Error sending push to role:', error);
    }
  }
};

module.exports = notificationController;
