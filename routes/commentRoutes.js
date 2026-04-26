const express = require('express');
const router = express.Router();
const c = require('../controllers/commentController');
const auth = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Комментарии и оценки
 */

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Оставить комментарий к рецепту
 *     tags: [Comments]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipe_id, content, rating]
 *             properties:
 *               recipe_id: { type: integer }
 *               content: { type: string }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               parent_comment_id: { type: integer, description: "ID родительского комментария (для ответа)" }
 *     responses:
 *       201: { description: Комментарий добавлен }
 */
router.post('/', auth, c.create);

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Удалить комментарий (только свой или admin)
 *     tags: [Comments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Комментарий удален }
 *       403: { description: Нет прав }
 */
router.delete('/:id', auth, c.delete);

module.exports = router;
