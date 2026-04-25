const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <TOKEN>

  if (!token) {
    return res.status(401).json({ message: 'Доступ запрещен: токен отсутствует' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key');
    req.user = decoded; // Добавляем данные пользователя в запрос
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Неверный или просроченный токен' });
  }
};

module.exports = authMiddleware;
