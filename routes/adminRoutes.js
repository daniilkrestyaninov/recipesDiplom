const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const auth = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/adminMiddleware');
const staff = require('../middleware/staffMiddleware');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Администрирование и модерация
 */

/** @swagger
 * /admin/stats:
 *   get:
 *     summary: Общая статистика
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Счётчики пользователей, рецептов, комментариев, лайков }
 */
router.get('/stats', auth, isAdmin, admin.getStats);

/** @swagger
 * /admin/analytics:
 *   get:
 *     summary: Детальная аналитика для графиков
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Данные для графиков (регистрации, рецепты, категории, топ пользователей и т.д.)
 */
router.get('/analytics', auth, isAdmin, admin.getAnalytics);

/** @swagger
 * /admin/users:
 *   get:
 *     summary: Список всех пользователей
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Массив пользователей }
 */
router.get('/users', auth, staff, admin.getUsers);

/** @swagger
 * /admin/users/{id}/block:
 *   post:
 *     summary: Заблокировать пользователя
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Пользователь заблокирован }
 */
router.post('/users/:id/block', auth, staff, admin.blockUser);
router.post('/users/:id/unblock', auth, staff, admin.unblockUser);

/** @swagger
 * /admin/roles:
 *   get:
 *     summary: Список всех ролей
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Список ролей }
 */
router.get('/roles', auth, isAdmin, admin.getRoles);

/** @swagger
 * /admin/users/{id}:
 *   patch:
 *     summary: Редактировать пользователя
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               username: { type: string }
 *               bio: { type: string }
 *               avatar_url: { type: string }
 *               role_id: { type: integer }
 *               is_blocked: { type: boolean }
 *               is_verified: { type: boolean }
 *     responses:
 *       200: { description: Пользователь обновлён }
 */
router.patch('/users/:id', auth, isAdmin, admin.updateUser);

/** @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Удалить пользователя полностью
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Пользователь удалён }
 */
router.delete('/users/:id', auth, isAdmin, admin.deleteUser);

/** @swagger
 * /admin/recipes/{id}:
 *   delete:
 *     summary: Удалить рецепт (модерация)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Рецепт удалён }
 */
router.delete('/recipes/:id', auth, staff, admin.deleteRecipe);

/** @swagger
 * /admin/comments/{id}:
 *   delete:
 *     summary: Удалить комментарий (модерация)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Комментарий удалён }
 */
router.delete('/comments/:id', auth, staff, admin.deleteComment);

/** @swagger
 * /admin/menu-of-week:
 *   get:
 *     summary: Получить меню недели
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Меню недели }
 *   post:
 *     summary: Добавить рецепт в меню недели
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               day_of_week: { type: integer, description: '1-7 (Пн-Вс)' }
 *               recipe_id: { type: integer }
 *     responses:
 *       201: { description: Добавлено }
 */
router.get('/menu-of-week', auth, isAdmin, admin.getMenuOfWeek);
router.post('/menu-of-week', auth, isAdmin, admin.addMenuOfWeek);

/** @swagger
 * /admin/menu-of-week/{id}:
 *   delete:
 *     summary: Удалить рецепт из меню недели
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Удалено }
 */
router.delete('/menu-of-week/:id', auth, isAdmin, admin.removeMenuOfWeek);

/** @swagger
 * /admin/notifications/broadcast:
 *   post:
 *     summary: Отправить массовое уведомление
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message: { type: string }
 *     responses:
 *       200: { description: Уведомления отправлены }
 */
router.post('/notifications/broadcast', auth, isAdmin, admin.broadcastNotification);

/** @swagger
 * /admin/verifications:
 *   get:
 *     summary: Список заявок на верификацию
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Заявки }
 */
router.get('/verifications', auth, isAdmin, admin.getVerificationRequests);

/** @swagger
 * /admin/verifications/{id}:
 *   patch:
 *     summary: Обработать заявку на верификацию
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [approved, rejected] }
 *               admin_notes: { type: string }
 *     responses:
 *       200: { description: Заявка обработана }
 */
router.patch('/verifications/:id', auth, isAdmin, admin.processVerificationRequest);

/** @swagger
 * /admin/audit-logs:
 *   get:
 *     summary: Логи действий администраторов
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Логи }
 */
router.get('/audit-logs', auth, isAdmin, admin.getAuditLogs);

/** @swagger
 * /admin/users/bulk-block:
 *   post:
 *     summary: Массовая блокировка пользователей
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userIds: { type: array, items: { type: integer } }
 *               is_blocked: { type: boolean }
 *     responses:
 *       200: { description: Пользователи заблокированы }
 */
router.post('/users/bulk-block', auth, staff, admin.bulkBlockUsers);

/** @swagger
 * /admin/recipes/bulk-delete:
 *   post:
 *     summary: Массовое удаление рецептов
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipeIds: { type: array, items: { type: integer } }
 *     responses:
 *       200: { description: Рецепты удалены }
 */
router.post('/recipes/bulk-delete', auth, staff, admin.bulkDeleteRecipes);

/** @swagger
 * /admin/appeals:
 *   get:
 *     summary: Список апелляций
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Список апелляций }
 */
router.get('/appeals', auth, staff, admin.getAppeals);

/** @swagger
 * /admin/appeals/{id}:
 *   patch:
 *     summary: Обработать апелляцию
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [reviewed, resolved] }
 *               admin_notes: { type: string }
 *     responses:
 *       200: { description: Апелляция обработана }
 */
router.patch('/appeals/:id', auth, staff, admin.processAppeal);

/** @swagger
 * /admin/backup:
 *   get:
 *     summary: Выгрузить резервную копию базы данных (дамп)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Файл дампа базы данных (attachment)
 *       500:
 *         description: Ошибка при генерации дампа
 */
router.get('/backup', auth, isAdmin, admin.backupDatabase);

module.exports = router;
