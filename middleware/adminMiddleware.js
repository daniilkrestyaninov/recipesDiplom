// Проверка роли администратора. Использовать ПОСЛЕ authMiddleware.
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Доступ запрещён: только для администраторов' });
  }
  next();
};

module.exports = adminMiddleware;
