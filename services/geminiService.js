const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

// 1. Убираем случайные слэши на конце ссылки, чтобы SDK не сломал путь
const safeBaseUrl = process.env.GEMINI_BASE_URL.replace(/\/$/, "");

// 2. Инициализируем новый SDK ПРАВИЛЬНО
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY.trim(),
  httpOptions: {
    baseUrl: safeBaseUrl 
  }
});

const geminiService = {
  generateRecipe: async (products) => {
    const prompt = `Ты шеф-повар. Придумай ОДИН вкусный рецепт из следующих ингредиентов: ${products.join(', ')}. 
Ты должен вернуть ответ СТРОГО в виде JSON объекта следующей структуры:
{
  "title": "Название рецепта",
  "description": "Краткое описание",
  "ingredients": [
    { "name": "Ингредиент 1", "quantity": "100", "unit": "г" }
  ],
  "steps": [
    { "step_number": 1, "description": "Описание шага 1" }
  ]
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        }
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error('--- ОШИБКА SDK GEMINI ---');
      console.error(error);
      throw new Error('Ошибка генерации рецепта');
    }
  },

  calculatePFC: async (title, ingredients) => {
    const prompt = `Ты диетолог. Рассчитай точное содержание БЖУ (белки, жиры, углеводы) и калорийность для рецепта "${title}".
Учитывай предоставленные веса и количества ингредиентов: ${ingredients.join(', ')}.
Верни ответ СТРОГО в виде JSON объекта (средние значения в граммах на 100г ГОТОВОГО блюда):
{
  "proteins": 10.5,
  "fats": 5.2,
  "carbohydrates": 20.0,
  "calorific": 150
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        }
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error('--- ОШИБКА ГЕНЕРАЦИИ БЖУ ---', error.message);
      return { proteins: 0, fats: 0, carbohydrates: 0, calorific: 0 };
    }
  },
};

module.exports = geminiService;