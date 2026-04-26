const express = require('express');
const router = express.Router();
const c = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Регистрация и вход
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, name, email, password]
 *             properties:
 *               username: { type: string, example: "chef_ivan" }
 *               name: { type: string, example: "Иван Петров" }
 *               email: { type: string, example: "ivan@mail.ru" }
 *               password: { type: string, example: "secret123" }
 *     responses:
 *       201: { description: Пользователь создан }
 *       400: { description: Пользователь уже существует }
 */
router.post('/register', c.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Вход в систему (получение JWT)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "ivan@mail.ru" }
 *               password: { type: string, example: "secret123" }
 *     responses:
 *       200: { description: JWT токен }
 *       401: { description: Неверный пароль }
 */
router.post('/login', c.login);

module.exports = router;
