const express = require('express');
const router = express.Router();
const c = require('../controllers/authController');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Авторизация и доступ
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Регистрация
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, name, email, password]
 *             properties:
 *               username: { type: string }
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               avatar_url: { type: string }
 *     responses:
 *       201: { description: Пользователь создан }
 */
router.post('/register', c.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Вход (получение access + refresh токенов)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Токены и данные пользователя }
 */
router.post('/login', c.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Обновление access-токена по refresh-токену
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token: { type: string }
 *     responses:
 *       200: { description: Новая пара токенов }
 */
router.post('/refresh', c.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Выход (отзыв refresh-токена)
 *     tags: [Auth]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refresh_token: { type: string }
 *     responses:
 *       200: { description: Выход выполнен }
 */
router.post('/logout', c.logout);

/**
 * @swagger
 * /auth/password-recovery:
 *   post:
 *     summary: Запрос на восстановление пароля
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: Код отправлен }
 */
router.post('/password-recovery', c.passwordRecovery);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Установка нового пароля по коду
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, new_password]
 *             properties:
 *               email: { type: string }
 *               code: { type: string }
 *               new_password: { type: string }
 *     responses:
 *       200: { description: Пароль изменён }
 */
router.post('/reset-password', c.resetPassword);

module.exports = router;
