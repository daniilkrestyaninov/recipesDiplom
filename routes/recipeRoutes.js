const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Recipes
 *   description: Управление рецептами
 */

/**
 * @swagger
 * /api/recipes:
 *   get:
 *     summary: Получить список всех рецептов
 *     tags: [Recipes]
 *     responses:
 *       200:
 *         description: Список рецептов успешно получен
 */
router.get('/', recipeController.getAllRecipes);

/**
 * @swagger
 * /api/recipes/{id}:
 *   get:
 *     summary: Получить рецепт по ID
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Данные рецепта
 *       404:
 *         description: Рецепт не найден
 */
router.get('/:id', recipeController.getRecipeById);

/**
 * @swagger
 * /api/recipes:
 *   post:
 *     summary: Создать новый рецепт
 *     tags: [Recipes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - portion
 *               - cooking_time
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: ['1', '2', '3', '4', '5']
 *               portion:
 *                 type: integer
 *               cooking_time:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Рецепт создан
 */
router.post('/', authMiddleware, recipeController.createRecipe);

/**
 * @swagger
 * /api/recipes/{id}:
 *   put:
 *     summary: Обновить рецепт
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Рецепт обновлен
 */
router.put('/:id', authMiddleware, recipeController.updateRecipe);

/**
 * @swagger
 * /api/recipes/{id}:
 *   delete:
 *     summary: Удалить рецепт
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Рецепт удален
 */
router.delete('/:id', authMiddleware, recipeController.deleteRecipe);

module.exports = router;
