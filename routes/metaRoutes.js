const express = require('express');
const router = express.Router();
const c = require('../controllers/metaController');

/**
 * @swagger
 * tags:
 *   name: Meta
 *   description: Справочники (категории, кухни, праздники и т.д.)
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Список категорий
 *     tags: [Meta]
 *     responses:
 *       200: { description: Массив категорий }
 */
router.get('/categories', c.getCategories);

/**
 * @swagger
 * /national-kitchens:
 *   get:
 *     summary: Список национальных кухонь
 *     tags: [Meta]
 *     responses:
 *       200: { description: Массив кухонь }
 */
router.get('/national-kitchens', c.getKitchens);

/**
 * @swagger
 * /celebrations:
 *   get:
 *     summary: Список праздников
 *     tags: [Meta]
 *     responses:
 *       200: { description: Массив праздников }
 */
router.get('/celebrations', c.getCelebrations);

/**
 * @swagger
 * /type-cooking:
 *   get:
 *     summary: Список способов приготовления
 *     tags: [Meta]
 *     responses:
 *       200: { description: Массив типов готовки }
 */
router.get('/type-cooking', c.getTypeCooking);

/**
 * @swagger
 * /ingredients:
 *   get:
 *     summary: Список ингредиентов (с поиском)
 *     tags: [Meta]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Поиск по названию
 *     responses:
 *       200: { description: Массив ингредиентов }
 */
router.get('/ingredients', c.getIngredients);

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Список ролей
 *     tags: [Meta]
 *     responses:
 *       200: { description: Массив ролей }
 */
router.get('/roles', c.getRoles);

module.exports = router;
