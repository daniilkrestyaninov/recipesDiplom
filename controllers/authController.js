const { User, Role, RefreshToken } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';
const ACCESS_TTL = '24h';
const REFRESH_TTL_DAYS = 30;

// ── Вспомогательные функции ──────────────────────────────────

function generateAccessToken(user) {
  return jwt.sign(
    { id: Number(user.id), username: user.username, role: user.roleName || 'User' },
    JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

// ─────────────────────────────────────────────────────────────

const authController = {
  // POST /auth/register
  register: async (req, res) => {
    try {
      const { username, name, email, password, avatar_url } = req.body;
      if (!username || !name || !email || !password) {
        return res.status(400).json({ message: 'Заполните все обязательные поля (username, name, email, password)' });
      }
      if (await User.findOne({ where: { email } })) {
        return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
      }
      if (await User.findOne({ where: { username } })) {
        return res.status(400).json({ message: 'Username уже занят' });
      }

      const hashed = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await User.create({
        username, name, email,
        password: hashed,
        role_id: 2,
        avatar_url: avatar_url || null,
      });
      res.status(201).json({ message: 'Регистрация успешна', userId: user.id });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка при регистрации', error: err.message });
    }
  },

  // POST /auth/login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({
        where: { email },
        include: [{ model: Role, attributes: ['name'] }],
      });
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
      if (user.is_blocked) return res.status(403).json({ message: 'Аккаунт заблокирован' });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: 'Неверный пароль' });

      const roleName = user.Role?.name || 'User';
      user.roleName = roleName;
      const access_token = generateAccessToken(user);

      const refreshRaw = generateRefreshToken();
      const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
      await RefreshToken.create({ user_id: user.id, token: refreshRaw, expires_at: expiresAt });

      res.json({
        message: 'Вход выполнен',
        access_token,
        refresh_token: refreshRaw,
        user: { id: user.id, username: user.username, name: user.name, role: roleName },
      });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка при входе', error: err.message });
    }
  },

  // POST /auth/refresh
  refresh: async (req, res) => {
    try {
      const { refresh_token } = req.body;
      if (!refresh_token) return res.status(400).json({ message: 'refresh_token обязателен' });

      const stored = await RefreshToken.findOne({ where: { token: refresh_token, revoked: false } });
      if (!stored) return res.status(403).json({ message: 'Невалидный refresh token' });
      if (new Date(stored.expires_at) < new Date()) {
        await stored.update({ revoked: true });
        return res.status(403).json({ message: 'Refresh token истёк' });
      }

      const user = await User.findByPk(stored.user_id, {
        include: [{ model: Role, attributes: ['name'] }],
      });
      user.roleName = user.Role?.name || 'User';

      // Ротация: отзываем старый, выдаём новый
      await stored.update({ revoked: true });
      const newRefresh = generateRefreshToken();
      const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
      await RefreshToken.create({ user_id: user.id, token: newRefresh, expires_at: expiresAt });

      res.json({
        access_token: generateAccessToken(user),
        refresh_token: newRefresh,
      });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка обновления токена', error: err.message });
    }
  },

  // POST /auth/logout
  logout: async (req, res) => {
    try {
      const { refresh_token } = req.body;
      if (refresh_token) {
        await RefreshToken.update({ revoked: true }, { where: { token: refresh_token } });
      }
      res.json({ message: 'Выход выполнен' });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // POST /auth/password-recovery
  passwordRecovery: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 минут
      await user.update({ password_reset_code: code, password_reset_expires: expires });

      // TODO: интегрировать реальную отправку email (nodemailer)
      // В продакшене code отправляется по почте. Сейчас возвращаем в ответе для тестирования.
      res.json({ message: 'Код отправлен на email', code_debug: code });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // POST /auth/reset-password
  resetPassword: async (req, res) => {
    try {
      const { email, code, new_password } = req.body;
      if (!email || !code || !new_password) {
        return res.status(400).json({ message: 'Поля email, code и new_password обязательны' });
      }
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

      if (user.password_reset_code !== code) {
        return res.status(400).json({ message: 'Неверный код' });
      }
      if (!user.password_reset_expires || new Date(user.password_reset_expires) < new Date()) {
        return res.status(400).json({ message: 'Код истёк' });
      }

      const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
      await user.update({ password: hashed, password_reset_code: null, password_reset_expires: null });

      // Отзываем все refresh-токены при смене пароля
      await RefreshToken.update({ revoked: true }, { where: { user_id: user.id } });

      res.json({ message: 'Пароль успешно изменён' });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },
};

module.exports = authController;
