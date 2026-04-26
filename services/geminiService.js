const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const geminiService = {
  // Генерация рецепта
  generateRecipe: async (products) => {
    // Системный промпт: задаем формат ответа
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

      const content = response.text;
      return JSON.parse(content);
    } catch (error) {
      console.error('Ошибка генерации Gemini:', error.message);
      throw new Error('Ошибка генерации рецепта через ИИ');
    }
  },
};

module.exports = geminiService;
