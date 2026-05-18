// Проверка роли администратора или модератора. Использовать ПОСЛЕ authMiddleware.
const { User, Role } = require('../models');

const staffMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: 'Доступ запрещён: пользователь не авторизован' });
    }

    // Получаем актуальную роль напрямую из базы данных
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Role, attributes: ['name'] }]
    });

    const roleName = user?.Role?.name;
    if (!user || (roleName !== 'Admin' && roleName !== 'Moderator')) {
      return res.status(403).json({ message: 'Доступ запрещён: недостаточно прав' });
    }

    // Обновляем роль в req.user на актуальную
    req.user.role = roleName;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера при проверке прав', error: error.message });
  }
};

module.exports = staffMiddleware;

