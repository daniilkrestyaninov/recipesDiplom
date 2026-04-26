const express = require('express');
const router = express.Router();
const social = require('../controllers/socialController');
const auth = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Favorites
 *   description: Избранное
 */

/**
 * @swagger
 * /favorites:
 *   get:
 *     summary: Мои сохраненные рецепты
 *     tags: [Favorites]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Список избранных рецептов }
 */
router.get('/', auth, social.getFavorites);

module.exports = router;
