const express = require('express');
const router = express.Router();
const c = require('../controllers/userController');
const social = require('../controllers/socialController');
const auth = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Профили пользователей
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Получить свой профиль
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Данные профиля }
 */
router.get('/me', auth, c.getMe);

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Обновить свой профиль
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               bio: { type: string }
 *               avatar_url: { type: string }
 *               email: { type: string }
 *     responses:
 *       200: { description: Обновленный профиль }
 */
router.patch('/me', auth, c.updateMe);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Публичный профиль пользователя
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Данные пользователя }
 *       404: { description: Не найден }
 */
router.get('/:id', c.getUserById);

/**
 * @swagger
 * /users/{id}/subscribe:
 *   post:
 *     summary: Подписаться на пользователя
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       201: { description: Подписка оформлена }
 */
router.post('/:id/subscribe', auth, social.subscribe);

/**
 * @swagger
 * /users/{id}/subscribe:
 *   delete:
 *     summary: Отписаться от пользователя
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Отписка выполнена }
 */
router.delete('/:id/subscribe', auth, social.unsubscribe);

/**
 * @swagger
 * /users/{id}/followers:
 *   get:
 *     summary: Список подписчиков пользователя
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Список подписчиков }
 */
router.get('/:id/followers', social.getFollowers);

/**
 * @swagger
 * /users/{id}/following:
 *   get:
 *     summary: На кого подписан пользователь
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Список подписок }
 */
router.get('/:id/following', social.getFollowing);

module.exports = router;
