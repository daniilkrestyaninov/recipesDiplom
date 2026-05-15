const { User } = require('../models');

const blockedMiddleware = async (req, res, next) => {
  try {
    if (req.user) {
      const user = await User.findByPk(req.user.id);
      if (user && user.is_blocked) {
        return res.status(403).json({ 
          message: 'Ваш аккаунт заблокирован. Взаимодействие (создание, лайки, комментарии) ограничено.',
          is_blocked: true 
        });
      }
    }
    next();
  } catch (error) {
    next(); // Если ошибка БД, пропускаем (лучше пропустить, чем сломать всё, или наоборот — на ваше усмотрение)
  }
};

module.exports = blockedMiddleware;
