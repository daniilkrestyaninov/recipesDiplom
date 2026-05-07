// Проверка роли администратора или модератора. Использовать ПОСЛЕ authMiddleware.
const staffMiddleware = (req, res, next) => {
  if (!req.user || (req.user.role !== 'Admin' && req.user.role !== 'Moderator')) {
    return res.status(403).json({ message: 'Доступ запрещён: недостаточно прав' });
  }
  next();
};

module.exports = staffMiddleware;
