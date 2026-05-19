const express = require('express');
const router = express.Router();
const rc = require('../controllers/reportController');
const auth = require('../middleware/authMiddleware');
const checkNotBlocked = require('../middleware/blockMiddleware');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Система жалоб (репортов)
 */

/** @swagger
 * /reports:
 *   post:
 *     summary: Отправить жалобу на рецепт, профиль или пользователя
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, reason]
 *             properties:
 *               type: { type: string, enum: [recipe, user, profile] }
 *               reported_user_id: { type: integer, description: ID пользователя для типов user/profile }
 *               recipe_id: { type: integer, description: ID рецепта для типа recipe }
 *               reason: { type: string }
 *               description: { type: string }
 *     responses:
 *       201: { description: Жалоба отправлена }
 */
router.post('/', auth, checkNotBlocked, rc.create);

/** @swagger
 * /reports:
 *   get:
 *     summary: Получить список всех жалоб (Admin/Moderator)
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Список жалоб }
 */
router.get('/', auth, rc.getAll);

/** @swagger
 * /reports/{id}:
 *   patch:
 *     summary: Обновить статус жалобы (Admin/Moderator)
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, reviewed, resolved, dismissed] }
 *     responses:
 *       200: { description: Статус обновлён }
 */
router.patch('/:id', auth, rc.updateStatus);

module.exports = router;
