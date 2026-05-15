const { User } = require('../models');

const checkNotBlocked = async (req, res, next) => {
  // Если пользователь не авторизован, проверка не требуется (maybeAuth)
  if (!req.user) return next();

  try {
    const user = await User.findByPk(req.user.id, { attributes: ['is_blocked'] });
    
    if (user && user.is_blocked) {
      // Заблокированным пользователям разрешены только безопасные методы (просмотр)
      const allowedMethods = ['GET', 'HEAD', 'OPTIONS'];
      if (!allowedMethods.includes(req.method)) {
        return res.status(403).json({ 
          message: 'Ваш аккаунт заблокирован. Вы можете только просматривать контент.',
          is_blocked: true 
        });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = checkNotBlocked;
