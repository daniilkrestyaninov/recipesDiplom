const { Recipe } = require('../models');

const toolsController = {
  // POST /tools/parse  — парсер рецептов по URL (заглушка)
  parse: async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ message: 'URL обязателен' });
      // TODO: подключить реальный парсер (cheerio/puppeteer)
      res.json({
        message: 'Парсер пока в разработке',
        parsed: {
          title: 'Пример рецепта',
          description: 'Описание с сайта ' + url,
          ingredients: [],
          steps: [],
        },
      });
    } catch (e) { res.status(500).json({ message: 'Ошибка', error: e.message }); }
  },

  // POST /ai/generate  — генерация рецепта по продуктам через GigaChat
  generate: async (req, res) => {
    try {
      const { products } = req.body;
      if (!products || !products.length) {
        return res.status(400).json({ message: 'Укажите список продуктов (массив products)' });
      }

      const geminiService = require('../services/geminiService');
      const generatedRecipe = await geminiService.generateRecipe(products);

      res.json({
        message: 'Рецепт успешно сгенерирован',
        suggestion: generatedRecipe,
      });
    } catch (e) { 
      res.status(500).json({ message: 'Ошибка генерации', error: e.message }); 
    }
  },
};

module.exports = toolsController;
