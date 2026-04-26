const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const auth = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/adminMiddleware');

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
 * /admin/users:
 *   get:
 *     summary: Список всех пользователей
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Массив пользователей }
 */
router.get('/users', auth, isAdmin, admin.getUsers);

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
router.post('/users/:id/block', auth, isAdmin, admin.blockUser);

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
router.delete('/recipes/:id', auth, isAdmin, admin.deleteRecipe);

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
router.delete('/comments/:id', auth, isAdmin, admin.deleteComment);

module.exports = router;
