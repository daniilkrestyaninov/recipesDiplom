const express = require('express');
const router = express.Router();
const tools = require('../controllers/toolsController');
const auth = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Tools
 *   description: Инструменты и ИИ
 */

/** @swagger
 * /tools/parse:
 *   post:
 *     summary: Парсинг рецепта по URL
 *     tags: [Tools]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url: { type: string }
 *     responses:
 *       200: { description: Распарсенный объект рецепта }
 */
router.post('/parse', auth, tools.parse);

/** @swagger
 * /ai/generate:
 *   post:
 *     summary: Генерация рецепта по списку продуктов (ИИ)
 *     tags: [Tools]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [products]
 *             properties:
 *               products: { type: array, items: { type: string } }
 *     responses:
 *       200: { description: Сгенерированный рецепт }
 */
router.post('/generate', auth, tools.generate);

module.exports = router;
