const express = require('express');
const router = express.Router();
const sync = require('../controllers/syncController');
const auth = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Sync
 *   description: Синхронизация (Offline-first)
 */

/** @swagger
 * /sync/delta:
 *   get:
 *     summary: Получить изменения с момента последней синхронизации
 *     tags: [Sync]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: since, required: true, schema: { type: string, format: date-time }, description: "ISO 8601 дата" }
 *     responses:
 *       200: { description: Изменённые рецепты }
 */
router.get('/delta', auth, sync.delta);

/** @swagger
 * /sync/push:
 *   post:
 *     summary: Отправить локально созданные рецепты на сервер
 *     tags: [Sync]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipes: { type: array, items: { type: object } }
 *     responses:
 *       201: { description: Синхронизировано }
 */
router.post('/push', auth, sync.push);

module.exports = router;
