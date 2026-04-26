const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const uploadController = require('../controllers/uploadController');
const auth = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: Загрузка файлов (MinIO)
 */

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Загрузить изображение
 *     tags: [Uploads]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Изображение для загрузки (до 5 МБ)
 *               folder:
 *                 type: string
 *                 description: Папка в корзине (например, avatars, recipes, steps)
 *     responses:
 *       201:
 *         description: Файл успешно загружен
 *       400:
 *         description: Файл не передан или неверный формат
 */
router.post('/', auth, upload.single('image'), uploadController.uploadImage);

/**
 * @swagger
 * /upload:
 *   delete:
 *     summary: Удалить изображение из хранилища
 *     tags: [Uploads]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: fileName
 *         schema:
 *           type: string
 *         required: true
 *         description: Имя файла в MinIO (например, recipes/uuid.jpg)
 *     responses:
 *       200:
 *         description: Файл удалён
 */
router.delete('/', auth, uploadController.deleteImage);

module.exports = router;
