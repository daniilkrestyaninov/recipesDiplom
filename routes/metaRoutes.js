const express = require('express');
const router = express.Router();
const c = require('../controllers/metaController');
const auth = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/adminMiddleware');

/**
 * @swagger
 * tags:
 *   name: Meta
 *   description: Справочники для фильтров и выпадающих списков
 */

/** @swagger
 * /meta/categories:
 *   get:
 *     summary: Список категорий
 *     tags: [Meta]
 *     responses:
 *       200: { description: Массив категорий }
 */
router.get('/categories', c.getCategories);

/** @swagger
 * /meta/categories:
 *   post:
 *     summary: Создать категорию (Admin)
 *     tags: [Meta]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               image_url: { type: string }
 *     responses:
 *       201: { description: Создано }
 */
router.post('/categories', auth, isAdmin, c.createCategory);

/** @swagger
 * /meta/categories/{id}:
 *   put:
 *     summary: Обновить категорию (Admin)
 *     tags: [Meta]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Обновлено }
 *   delete:
 *     summary: Удалить категорию (Admin)
 *     tags: [Meta]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Удалено }
 */
router.put('/categories/:id', auth, isAdmin, c.updateCategory);
router.delete('/categories/:id', auth, isAdmin, c.deleteCategory);

/** @swagger
 * /meta/kitchens:
 *   get:
 *     summary: Национальные кухни
 *     tags: [Meta]
 *     responses:
 *       200: { description: Массив кухонь }
 */
router.get('/kitchens', c.getKitchens);

/** @swagger
 * /meta/kitchens:
 *   post:
 *     summary: Создать кухню (Admin)
 *     tags: [Meta]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               image_url: { type: string }
 *     responses:
 *       201: { description: Создано }
 */
router.post('/kitchens', auth, isAdmin, c.createKitchen);

/** @swagger
 * /meta/kitchens/{id}:
 *   put:
 *     summary: Обновить кухню (Admin)
 *     tags: [Meta]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Обновлено }
 *   delete:
 *     summary: Удалить кухню (Admin)
 *     tags: [Meta]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Удалено }
 */
router.put('/kitchens/:id', auth, isAdmin, c.updateKitchen);
router.delete('/kitchens/:id', auth, isAdmin, c.deleteKitchen);

/** @swagger
 * /meta/cooking-types:
 *   get:
 *     summary: Способы приготовления
 *     tags: [Meta]
 *     responses:
 *       200: { description: Массив типов готовки }
 */
router.get('/cooking-types', c.getTypeCooking);

/** @swagger
 * /meta/cooking-types:
 *   post:
 *     summary: Создать способ приготовления (Admin)
 *     tags: [Meta]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               image_url: { type: string }
 *     responses:
 *       201: { description: Создано }
 */
router.post('/cooking-types', auth, isAdmin, c.createTypeCooking);

/** @swagger
 * /meta/cooking-types/{id}:
 *   put:
 *     summary: Обновить способ приготовления (Admin)
 *     tags: [Meta]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Обновлено }
 *   delete:
 *     summary: Удалить способ приготовления (Admin)
 *     tags: [Meta]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Удалено }
 */
router.put('/cooking-types/:id', auth, isAdmin, c.updateTypeCooking);
router.delete('/cooking-types/:id', auth, isAdmin, c.deleteTypeCooking);

/** @swagger
 * /meta/celebrations:
 *   get:
 *     summary: Праздничные события
 *     tags: [Meta]
 *     responses:
 *       200: { description: Массив праздников }
 */
router.get('/celebrations', c.getCelebrations);

/** @swagger
 * /meta/celebrations:
 *   post:
 *     summary: Создать праздник (Admin)
 *     tags: [Meta]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               image_url: { type: string }
 *     responses:
 *       201: { description: Создано }
 */
router.post('/celebrations', auth, isAdmin, c.createCelebration);

/** @swagger
 * /meta/celebrations/{id}:
 *   put:
 *     summary: Обновить праздник (Admin)
 *     tags: [Meta]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Обновлено }
 *   delete:
 *     summary: Удалить праздник (Admin)
 *     tags: [Meta]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Удалено }
 */
router.put('/celebrations/:id', auth, isAdmin, c.updateCelebration);
router.delete('/celebrations/:id', auth, isAdmin, c.deleteCelebration);

/** @swagger
 * /meta/units:
 *   get:
 *     summary: Список единиц измерения
 *     tags: [Meta]
 *     responses:
 *       200: { description: Массив единиц измерения }
 */
router.get('/units', c.getUnits);

/** @swagger
 * /meta/units:
 *   post:
 *     summary: Создать ед. измерения (Admin)
 *     tags: [Meta]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               short_name: { type: string }
 *     responses:
 *       201: { description: Создано }
 */
router.post('/units', auth, isAdmin, c.createUnit);

/** @swagger
 * /meta/units/{id}:
 *   put:
 *     summary: Обновить ед. измерения (Admin)
 *     tags: [Meta]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Обновлено }
 *   delete:
 *     summary: Удалить ед. измерения (Admin)
 *     tags: [Meta]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Удалено }
 */
router.put('/units/:id', auth, isAdmin, c.updateUnit);
router.delete('/units/:id', auth, isAdmin, c.deleteUnit);

/** @swagger
 * /meta/ingredients:
 *   get:
 *     summary: Поиск ингредиентов
 *     tags: [Meta]
 *     parameters:
 *       - { in: query, name: search, schema: { type: string }, description: Поиск по названию }
 *     responses:
 *       200: { description: Массив ингредиентов }
 */
router.get('/ingredients', c.getIngredients);

/** @swagger
 * /meta/ingredients:
 *   post:
 *     summary: Создать новый ингредиент (Admin)
 *     tags: [Meta]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               unit_of_measurement: { type: string }
 *               description: { type: string }
 *     responses:
 *       201: { description: Созданный ингредиент }
 */
router.post('/ingredients', auth, isAdmin, c.createIngredient);

/** @swagger
 * /meta/ingredients/{id}:
 *   put:
 *     summary: Обновить ингредиент (Admin)
 *     tags: [Meta]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Обновленный ингредиент }
 */
router.put('/ingredients/:id', auth, isAdmin, c.updateIngredient);

/** @swagger
 * /meta/ingredients/{id}:
 *   delete:
 *     summary: Удалить ингредиент (Admin)
 *     tags: [Meta]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Сообщение об удалении }
 */
router.delete('/ingredients/:id', auth, isAdmin, c.deleteIngredient);

module.exports = router;
