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

module.exports = router;
