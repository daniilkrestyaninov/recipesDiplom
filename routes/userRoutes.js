const express = require('express');
const router = express.Router();
const c = require('../controllers/userController');
const social = require('../controllers/socialController');
const auth = require('../middleware/authMiddleware');
const checkNotBlocked = require('../middleware/blockMiddleware');
const { maybeAuth } = auth;

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
router.patch('/me', auth, checkNotBlocked, c.updateMe);

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
 * /users/search:
 *   get:
 *     summary: Поиск пользователей
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Список найденных пользователей }
 */
router.get('/search', c.search);

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
router.get('/:id', maybeAuth, c.getUserById);

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
router.post('/:id/follow', auth, checkNotBlocked, social.follow);

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
router.delete('/:id/follow', auth, checkNotBlocked, social.unfollow);

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

/** @swagger
 * /users/{id}/recipes:
 *   get:
 *     summary: Рецепты конкретного пользователя
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Список рецептов пользователя }
 */
router.get('/:id/recipes', maybeAuth, c.getUserRecipes);

/** @swagger
 * /users/verify-request:
 *   post:
 *     summary: Подать заявку на верификацию
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name: { type: string }
 *               info: { type: string }
 *     responses:
 *       201: { description: Заявка создана }
 */
router.post('/verify-request', auth, checkNotBlocked, c.requestVerification);

/** @swagger
 * /users/me/appeal:
 *   post:
 *     summary: Подать апелляцию на блокировку
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message: { type: string }
 *     responses:
 *       201: { description: Апелляция создана }
 */
router.post('/me/appeal', auth, c.createAppeal);

module.exports = router;
