const axios = require('axios');
const cheerio = require('cheerio');

// Вспомогательная функция для извлечения текста из структуры Food.ru
function extractFoodRuText(node) {
  let text = '';
  if (!node) return text;
  if (node.content) text += node.content;
  if (Array.isArray(node.children)) {
    node.children.forEach(child => {
      text += extractFoodRuText(child);
    });
  }
  return text;
}

const parserService = {
  parseUrl: async (url) => {
    try {
      if (url.includes('russianfood.com')) {
        return await parserService.parseRussianFood(url);
      } else if (url.includes('food.ru')) {
        return await parserService.parseFoodRu(url);
      } else {
        throw new Error('Сайт не поддерживается. Поддерживаются: russianfood.com, food.ru');
      }
    } catch (error) {
      console.error('Ошибка парсинга:', error.message);
      throw new Error(`Не удалось распарсить рецепт: ${error.message}`);
    }
  },

  parseRussianFood: async (url) => {
    // russianfood.com использует кодировку windows-1251
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const html = new TextDecoder('windows-1251').decode(response.data);
    const $ = cheerio.load(html);

    const title = $('h1.title').text().trim() || $('h1').first().text().trim();
    
    // Описание
    const description = $('.step_images_n').first().prev('p').text().trim() 
      || $('.recipe_announce').text().trim() 
      || `Рецепт с сайта russianfood.com`;

    const ingredients = [];
    $('.ingr_tr_0, .ingr_tr_1').each((i, el) => {
      const rawText = $(el).find('td span').first().text().trim();
      if (!rawText || $(el).hasClass('ingr_title') || $(el).find('.prod').length > 0) return;
      
      const parts = rawText.split(' - ');
      const name = parts[0].trim();
      const amount = parts.length > 1 ? parts.slice(1).join(' - ').trim() : '';
      
      ingredients.push({ name, quantity: amount, unit: '' });
    });

    const steps = [];
    $('.step_n').each((i, el) => {
      const text = $(el).find('p').text().trim();
      if (text) {
        steps.push({ step_number: steps.length + 1, description: text });
      }
    });

    return { title, description, ingredients, steps };
  },

  parseFoodRu: async (url) => {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // Food.ru хранит данные в Next.js state
    const nextDataStr = $('#__NEXT_DATA__').text();
    if (!nextDataStr) throw new Error('Не найдена структура данных food.ru');
    
    const nextData = JSON.parse(nextDataStr);
    const state = nextData.props.pageProps['__EFFECTOR_NEXTJS_INITIAL_STATE__'];
    
    // Ищем объект с рецептом
    const recipeKey = Object.keys(state).find(k => state[k] && state[k].title && state[k].main_ingredients_block);
    if (!recipeKey) throw new Error('Рецепт не найден в данных страницы');
    
    const recipeData = state[recipeKey];

    const title = recipeData.title.trim();
    let description = recipeData.snippet ? recipeData.snippet.trim() : '';
    
    if (recipeData.subtitle) {
      const sub = extractFoodRuText(recipeData.subtitle);
      if (sub) description += ' ' + sub;
    }
    
    const ingredients = [];
    if (recipeData.main_ingredients_block && recipeData.main_ingredients_block.products) {
      recipeData.main_ingredients_block.products.forEach(p => {
        const name = p.title.trim();
        const quantity = p.custom_measure_count ? String(p.custom_measure_count) : '';
        const unit = p.custom_measure ? p.custom_measure.trim() : '';
        ingredients.push({ name, quantity, unit });
      });
    }

    const steps = [];
    
    // Подготовка
    if (Array.isArray(recipeData.preparation)) {
      recipeData.preparation.forEach(step => {
        const text = extractFoodRuText(step.description).trim();
        if (text) {
          steps.push({ step_number: steps.length + 1, description: text });
        }
      });
    }
    
    // Приготовление
    if (Array.isArray(recipeData.cooking)) {
      recipeData.cooking.forEach(step => {
        const text = extractFoodRuText(step.description).trim();
        if (text) {
          steps.push({ step_number: steps.length + 1, description: text });
        }
      });
    }

    return { title, description: description.trim() || `Рецепт с сайта food.ru`, ingredients, steps };
  }
};

module.exports = parserService;
