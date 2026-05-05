const express = require('express');
const router = express.Router();
const c = require('../controllers/metaController');

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
 * /meta/kitchens:
 *   get:
 *     summary: Национальные кухни
 *     tags: [Meta]
 *     responses:
 *       200: { description: Массив кухонь }
 */
router.get('/kitchens', c.getKitchens);

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
 * /meta/celebrations:
 *   get:
 *     summary: Праздничные события
 *     tags: [Meta]
 *     responses:
 *       200: { description: Массив праздников }
 */
router.get('/celebrations', c.getCelebrations);

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
 *     summary: Создать новый ингредиент
 *     tags: [Meta]
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
router.post('/ingredients', c.createIngredient);

/** @swagger
 * /meta/ingredients/{id}:
 *   put:
 *     summary: Обновить ингредиент
 *     tags: [Meta]
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
router.put('/ingredients/:id', c.updateIngredient);

/** @swagger
 * /meta/ingredients/{id}:
 *   delete:
 *     summary: Удалить ингредиент
 *     tags: [Meta]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Сообщение об удалении }
 */
router.delete('/ingredients/:id', c.deleteIngredient);

module.exports = router;
