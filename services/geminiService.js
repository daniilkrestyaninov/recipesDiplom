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
      // 3. Используем ваш изначальный метод. 
      // ВАЖНО: Если 'gemini-2.5-flash' снова выдаст 404, замените на 'gemini-2.0-flash' или 'gemini-1.5-flash'
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
};

module.exports = geminiService;