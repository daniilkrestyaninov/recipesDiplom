const { User, Role } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const userController = {
  // Регистрация
  register: async (req, res) => {
    try {
      const { username, name, email, password } = req.body;

      // Проверка на существующего пользователя
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      // По умолчанию даем роль "User" (ID 2 согласно сиду)
      const user = await User.create({
        username,
        name,
        email,
        password: hashedPassword,
        role_id: 2 
      });

      res.status(201).json({ message: 'Регистрация успешна', userId: user.id });
    } catch (error) {
      res.status(500).json({ message: 'Ошибка при регистрации', error: error.message });
    }
  },

  // Вход
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ 
        where: { email },
        include: [{ model: Role, attributes: ['name'] }]
      });

      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Неверный пароль' });
      }

      // Генерация JWT
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.Role.name },
        process.env.JWT_SECRET || 'super_secret_key',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Вход выполнен',
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.Role.name
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Ошибка при входе', error: error.message });
    }
  },

  // Получить данные профиля (защищенный роут)
  getProfile: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: [{ model: Role, attributes: ['name'] }]
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Ошибка при получении профиля', error: error.message });
    }
  }
};

module.exports = userController;
