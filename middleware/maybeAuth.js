const jwt = require('jsonwebtoken');
require('dotenv').config();

const maybeAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = maybeAuth;
