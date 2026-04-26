const express = require('express');
const router = express.Router();
const rc = require('../controllers/recipeController');
const social = require('../controllers/socialController');
const comment = require('../controllers/commentController');
const auth = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Recipes
 *   description: Рецепты
 */

/** @swagger
 * /recipes:
 *   get:
 *     summary: Глобальная лента рецептов (с фильтрами и поиском)
 *     tags: [Recipes]
 *     parameters:
 *       - { in: query, name: search, schema: { type: string }, description: Поиск по названию/описанию }
 *       - { in: query, name: kitchen_id, schema: { type: integer } }
 *       - { in: query, name: celebration_id, schema: { type: integer } }
 *       - { in: query, name: cooking_id, schema: { type: integer } }
 *       - { in: query, name: category_id, schema: { type: integer } }
 *       - { in: query, name: difficulty, schema: { type: string } }
 *       - { in: query, name: is_private, schema: { type: boolean } }
 *     responses:
 *       200: { description: Список рецептов }
 */
router.get('/', rc.getAll);

/** @swagger
 * /recipes/feed:
 *   get:
 *     summary: Лента по подпискам
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Рецепты от подписок }
 */
router.get('/feed', auth, rc.getFeed);

/** @swagger
 * /recipes/random:
 *   get:
 *     summary: Случайный рецепт
 *     tags: [Recipes]
 *     responses:
 *       200: { description: Случайный рецепт }
 */
router.get('/random', rc.getRandom);

/** @swagger
 * /recipes/{id}:
 *   get:
 *     summary: Полная карточка рецепта
 *     tags: [Recipes]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Рецепт с ингредиентами, шагами и фото }
 */
router.get('/:id', rc.getById);

/** @swagger
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
 *               difficulty: { type: string }
 *               portion: { type: integer }
 *               cooking_time: { type: integer }
 *               is_private: { type: boolean }
 *               categories: { type: array, items: { type: integer } }
 *               ingredients: { type: array, items: { type: object, properties: { id: { type: integer }, quantity: { type: integer }, note: { type: string } } } }
 *               steps: { type: array, items: { type: object, properties: { description: { type: string }, image_url: { type: string } } } }
 *     responses:
 *       201: { description: Рецепт создан }
 */
router.post('/', auth, rc.create);

/** @swagger
 * /recipes/{id}:
 *   put:
 *     summary: Редактировать рецепт (только автор)
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Рецепт обновлён }
 */
router.put('/:id', auth, rc.update);

/** @swagger
 * /recipes/{id}:
 *   delete:
 *     summary: Удалить рецепт (каскадно)
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Рецепт удалён }
 */
router.delete('/:id', auth, rc.delete);

/** @swagger
 * /recipes/{id}/personal-note:
 *   patch:
 *     summary: Создать или обновить личную заметку к рецепту
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [note]
 *             properties:
 *               note: { type: string }
 *     responses:
 *       200: { description: Заметка сохранена }
 */
router.patch('/:id/personal-note', auth, rc.upsertPersonalNote);

/** @swagger
 * /recipes/{id}/export:
 *   get:
 *     summary: Экспорт списка продуктов (text/plain)
 *     tags: [Recipes]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Текстовый список продуктов }
 */
router.get('/:id/export', rc.exportIngredients);

/** @swagger
 * /recipes/{id}/cooked:
 *   post:
 *     summary: Отметить "Приготовлено"
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       201: { description: Отмечено }
 */
router.post('/:id/cooked', auth, rc.markCooked);

// ── Шаги и ингредиенты ──────────────────────────────

/** @swagger
 * /recipes/{id}/steps/{step_id}:
 *   patch:
 *     summary: Редактировать шаг рецепта
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *       - { in: path, name: step_id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Шаг обновлён }
 */
router.patch('/:id/steps/:step_id', auth, rc.updateStep);

/** @swagger
 * /recipes/{id}/ingredients/{ing_id}:
 *   delete:
 *     summary: Удалить ингредиент из рецепта
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *       - { in: path, name: ing_id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Ингредиент удалён }
 */
router.delete('/:id/ingredients/:ing_id', auth, rc.removeIngredient);

// ── Лайки, избранное, комментарии ────────────────────

/** @swagger
 * /recipes/{id}/like:
 *   post:
 *     summary: Поставить лайк
 *     tags: [Social]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       201: { description: Лайк добавлен }
 */
router.post('/:id/like', auth, social.like);

/** @swagger
 * /recipes/{id}/like:
 *   delete:
 *     summary: Убрать лайк
 *     tags: [Social]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Лайк убран }
 */
router.delete('/:id/like', auth, social.unlike);

/** @swagger
 * /recipes/{id}/favorite:
 *   post:
 *     summary: Добавить в избранное
 *     tags: [Social]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_downloaded: { type: boolean }
 *     responses:
 *       201: { description: Добавлено }
 */
router.post('/:id/favorite', auth, social.addFavorite);

/** @swagger
 * /recipes/{id}/favorite:
 *   delete:
 *     summary: Удалить из избранного
 *     tags: [Social]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Удалено }
 */
router.delete('/:id/favorite', auth, social.removeFavorite);

/** @swagger
 * /recipes/{id}/comments:
 *   get:
 *     summary: Комментарии к рецепту
 *     tags: [Social]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Список комментариев }
 */
router.get('/:id/comments', comment.getByRecipe);

/** @swagger
 * /recipes/{id}/comments:
 *   post:
 *     summary: Оставить отзыв с рейтингом
 *     tags: [Social]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content, rating]
 *             properties:
 *               content: { type: string }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               parent_comment_id: { type: integer }
 *     responses:
 *       201: { description: Комментарий добавлен }
 */
router.post('/:id/comments', auth, comment.createForRecipe);

module.exports = router;
