const { User, Role } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

const userController = {
  // POST /auth/register
  register: async (req, res) => {
    try {
      const { username, name, email, password } = req.body;
      if (!username || !name || !email || !password) {
        return res.status(400).json({ message: 'Заполните все обязательные поля' });
      }
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
      }
      const hashed = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await User.create({ username, name, email, password: hashed, role_id: 2 });
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
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: 'Неверный пароль' });

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.Role?.name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      res.json({
        message: 'Вход выполнен',
        token,
        user: { id: user.id, username: user.username, name: user.name, role: user.Role?.name },
      });
    } catch (err) {
      res.status(500).json({ message: 'Ошибка при входе', error: err.message });
    }
  },

  // GET /users/me
  getMe: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: [{ model: Role, attributes: ['name'] }],
      });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // PATCH /users/me
  updateMe: async (req, res) => {
    try {
      const { name, bio, avatar_url, email } = req.body;
      const user = await User.findByPk(req.user.id);
      await user.update({ name, bio, avatar_url, email });
      const updated = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка обновления', error: err.message });
    }
  },

  // GET /users/:id
  getUserById: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id, {
        attributes: { exclude: ['password'] },
        include: [{ model: Role, attributes: ['name'] }],
      });
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },

  // GET /roles
  getRoles: async (req, res) => {
    try {
      const roles = await Role.findAll();
      res.json(roles);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка', error: err.message });
    }
  },
};

module.exports = userController;
