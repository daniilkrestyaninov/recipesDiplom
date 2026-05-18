// Проверка роли администратора. Использовать ПОСЛЕ authMiddleware.
const { User, Role } = require('../models');

const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: 'Доступ запрещён: пользователь не авторизован' });
    }

    // Получаем актуальную роль напрямую из базы данных
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Role, attributes: ['name'] }]
    });

    if (!user || user.Role?.name !== 'Admin') {
      return res.status(403).json({ message: 'Доступ запрещён: только для администраторов' });
    }

    // Обновляем роль в req.user на актуальную
    req.user.role = user.Role.name;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера при проверке прав', error: error.message });
  }
};

module.exports = adminMiddleware;

