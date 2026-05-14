const express = require('express');
const router = express.Router();
const dpc = require('../controllers/dietPlanController');
const auth = require('../middleware/authMiddleware');
const { maybeAuth } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: DietPlans
 *   description: Пользовательские планы питания (диеты)
 */

/** @swagger
 * /diet-plans:
 *   post:
 *     summary: Создать план питания
 *     tags: [DietPlans]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               is_private: { type: boolean }
 *               recipes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     recipe_id: { type: integer }
 *                     day_of_week: { type: integer, description: '1-7 (Mon-Sun)' }
 *                     meal_order: { type: integer, description: '1-5' }
 */
router.post('/', auth, dpc.create);

/** @swagger
 * /diet-plans:
 *   get:
 *     summary: Список публичных планов питания
 *     tags: [DietPlans]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 */
router.get('/', maybeAuth, dpc.getAll);

/** @swagger
 * /diet-plans/me:
 *   get:
 *     summary: Мои планы питания
 *     tags: [DietPlans]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/me', auth, dpc.getMe);

/** @swagger
 * /diet-plans/{id}:
 *   get:
 *     summary: Детальная информация о плане
 *     tags: [DietPlans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 */
router.get('/:id', maybeAuth, dpc.getById);

/** @swagger
 * /diet-plans/{id}:
 *   patch:
 *     summary: Обновить план
 *     tags: [DietPlans]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id', auth, dpc.update);

/** @swagger
 * /diet-plans/{id}:
 *   delete:
 *     summary: Удалить план
 *     tags: [DietPlans]
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/:id', auth, dpc.delete);

module.exports = router;
