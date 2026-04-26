const express = require('express');
const router = express.Router();
const c = require('../controllers/recipeController');
const social = require('../controllers/socialController');
const comment = require('../controllers/commentController');
const auth = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Recipes
 *   description: Управление рецептами
 */

/**
 * @swagger
 * /recipes:
 *   get:
 *     summary: Список всех рецептов
 *     tags: [Recipes]
 *     parameters:
 *       - in: query
 *         name: kitchen_id
 *         schema: { type: integer }
 *       - in: query
 *         name: celebration_id
 *         schema: { type: integer }
 *       - in: query
 *         name: cooking_id
 *         schema: { type: integer }
 *       - in: query
 *         name: difficulty
 *         schema: { type: string, enum: ['1','2','3','4','5'] }
 *       - in: query
 *         name: is_private
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: Список рецептов }
 */
router.get('/', c.getAll);

/**
 * @swagger
 * /recipes/feed:
 *   get:
 *     summary: Лента рецептов от авторов, на которых вы подписаны
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Рецепты из ленты }
 */
router.get('/feed', auth, c.getFeed);

/**
 * @swagger
 * /recipes/{id}:
 *   get:
 *     summary: Полная карточка рецепта
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Данные рецепта со шагами, ингредиентами и категориями }
 *       404: { description: Не найден }
 */
router.get('/:id', c.getById);

/**
 * @swagger
 * /recipes:
 *   post:
 *     summary: Создать рецепт
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, portion, cooking_time]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               difficulty: { type: string, enum: ['1','2','3','4','5'] }
 *               portion: { type: integer }
 *               calorific: { type: integer }
 *               cooking_time: { type: integer }
 *               kitchen_id: { type: integer }
 *               celebration_id: { type: integer }
 *               cooking_id: { type: integer }
 *               is_private: { type: boolean }
 *               categories: { type: array, items: { type: integer }, description: "Массив ID категорий" }
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     quantity: { type: integer }
 *                     note: { type: string }
 *               steps:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     step_number: { type: integer }
 *                     description: { type: string }
 *                     image_url: { type: string }
 *     responses:
 *       201: { description: Рецепт создан }
 */
router.post('/', auth, c.create);

/**
 * @swagger
 * /recipes/{id}:
 *   put:
 *     summary: Обновить рецепт (только владелец или admin)
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Рецепт обновлен }
 *       403: { description: Нет прав }
 */
router.put('/:id', auth, c.update);

/**
 * @swagger
 * /recipes/{id}:
 *   delete:
 *     summary: Удалить рецепт (только владелец или admin)
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Рецепт удален }
 */
router.delete('/:id', auth, c.delete);

/**
 * @swagger
 * /recipes/{id}/steps/{step_id}:
 *   patch:
 *     summary: Редактировать шаг рецепта
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: step_id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Шаг обновлен }
 */
router.patch('/:id/steps/:step_id', auth, c.updateStep);

/**
 * @swagger
 * /recipes/{id}/ingredients/{ing_id}:
 *   delete:
 *     summary: Удалить ингредиент из рецепта
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: ing_id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Ингредиент удален }
 */
router.delete('/:id/ingredients/:ing_id', auth, c.removeIngredient);

// ── Социальные действия с рецептом ──────────────────────────

/**
 * @swagger
 * /recipes/{id}/like:
 *   post:
 *     summary: Лайк / убрать лайк (toggle)
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Статус лайка }
 */
router.post('/:id/like', auth, social.toggleLike);

/**
 * @swagger
 * /recipes/{id}/favorite:
 *   post:
 *     summary: Добавить рецепт в избранное
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_downloaded: { type: boolean }
 *     responses:
 *       201: { description: Добавлено в избранное }
 */
router.post('/:id/favorite', auth, social.addFavorite);

/**
 * @swagger
 * /recipes/{id}/favorite:
 *   delete:
 *     summary: Удалить рецепт из избранного
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Удалено из избранного }
 */
router.delete('/:id/favorite', auth, social.removeFavorite);

/**
 * @swagger
 * /recipes/{id}/comments:
 *   get:
 *     summary: Получить комментарии к рецепту
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Список комментариев с ответами }
 */
router.get('/:id/comments', comment.getByRecipe);

module.exports = router;
