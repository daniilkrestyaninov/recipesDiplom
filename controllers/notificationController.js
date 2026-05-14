const { Notification, User, Recipe, Comment } = require('../models');
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
          { model: User, as: 'Actor', attributes: ['id', 'username', 'name', 'avatar_url'] },
          { model: Recipe, as: 'Recipe', attributes: ['id', 'title', 'image_url'] },
          { model: Comment, as: 'Comment', attributes: ['id', 'content'] },
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      res.json({
        notifications: rows,
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

      res.json({ message: 'Устройство зарегистрировано', device });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка при регистрации устройства', error: err.message });
    }
  }
};

module.exports = notificationController;
