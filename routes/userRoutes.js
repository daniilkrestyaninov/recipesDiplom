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

/** @swagger
 * /users/me:
 *   get:
 *     summary: Мой профиль
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Данные профиля }
 */
router.get('/me', auth, c.getMe);

/** @swagger
 * /users/me:
 *   patch:
 *     summary: Обновить профиль (name, bio, avatar_url, email)
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
 *       200: { description: Обновлённый профиль }
 */
router.patch('/me', auth, c.updateMe);

/** @swagger
 * /users/me:
 *   delete:
 *     summary: Удалить свой аккаунт
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Аккаунт удалён }
 */
router.delete('/me', auth, c.deleteMe);

/** @swagger
 * /users/{id}:
 *   get:
 *     summary: Публичный профиль (с рецептами и статистикой)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Профиль пользователя }
 */
router.get('/:id', c.getUserById);

/** @swagger
 * /users/{id}/follow:
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
router.post('/:id/follow', auth, social.follow);

/** @swagger
 * /users/{id}/follow:
 *   delete:
 *     summary: Отписаться
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
router.delete('/:id/follow', auth, social.unfollow);

/** @swagger
 * /users/{id}/followers:
 *   get:
 *     summary: Подписчики пользователя
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

/** @swagger
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
