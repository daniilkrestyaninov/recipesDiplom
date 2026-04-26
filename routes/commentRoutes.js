const express = require('express');
const router = express.Router();
const cc = require('../controllers/commentController');
const auth = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Комментарии
 */

/** @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Удалить свой комментарий
 *     tags: [Comments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Удалён }
 */
router.delete('/:id', auth, cc.delete);

module.exports = router;
