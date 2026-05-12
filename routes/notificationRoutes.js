const express = require('express');
const router = express.Router();
const nc = require('../controllers/notificationController');
const auth = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Уведомления пользователя
 */

/** @swagger
 * /notifications:
 *   get:
 *     summary: Список уведомлений (с пагинацией)
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 50 }
 *     responses:
 *       200: { description: Список уведомлений с пагинацией }
 */
router.get('/', auth, nc.getAll);

/** @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Количество непрочитанных уведомлений
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Количество непрочитанных
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count: { type: integer }
 */
router.get('/unread-count', auth, nc.getUnreadCount);

/** @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Пометить все уведомления как прочитанные
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Все помечены как прочитанные }
 */
router.patch('/read-all', auth, nc.markAllRead);

/** @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Пометить одно уведомление как прочитанное
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Прочитано }
 */
router.patch('/:id/read', auth, nc.markRead);

/** @swagger
 * /notifications:
 *   delete:
 *     summary: Удалить все уведомления
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Все уведомления удалены }
 */
router.delete('/', auth, nc.deleteAll);

module.exports = router;
