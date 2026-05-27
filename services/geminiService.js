const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const https = require('https');
require('dotenv').config();

// 1. SSL agent to ignore Sberbank Russian CA certificate errors in Node.js
const sberHttpsAgent = new https.Agent({ rejectUnauthorized: false });

// 2. OAuth state cache
let cachedToken = null;
let tokenExpiresAt = 0; // Timestamp in milliseconds

/**
 * Automatically fetches or returns cached Sberbank OAuth access token.
 */
async function getGigaChatToken(authData, scope = 'GIGACHAT_API_PERS') {
  const now = Date.now();
  
  // Return cached token if valid for at least 1 more minute
  if (cachedToken && tokenExpiresAt > now + 60000) {
    return cachedToken;
  }

  try {
    console.log('[GigaChat] Fetching new access token...');
    const response = await axios.post('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', 
      'scope=' + encodeURIComponent(scope),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'RqUID': uuidv4(),
          'Authorization': `Basic ${authData}`
        },
        httpsAgent: sberHttpsAgent
      }
    );

    cachedToken = response.data.access_token;
    tokenExpiresAt = response.data.expires_at;
    console.log('✅ [GigaChat] OAuth token successfully loaded. Expires at:', new Date(tokenExpiresAt).toLocaleTimeString());
    return cachedToken;
  } catch (error) {
    console.error('❌ [GigaChat] OAuth authorization failed:', error.response?.data || error.message);
    throw new Error('GigaChat OAuth authorization failed: ' + (error.response?.data?.message || error.message));
  }
}

/**
 * Generalized AI requester supporting GigaChat or OpenAI-compatible backends (DeepSeek, Ollama, etc.)
 */
async function requestAI(prompt, systemPrompt = '', isPFC = false) {
  const authData = (process.env.GIGACHAT_AUTH_DATA || process.env.GIGACHAT_AUTH_KEY || '').trim();
  
  if (authData) {
    // === 🟢 GIGACHAT MODE (Russian-hosted, free, geoblock-immune) ===
    const scope = process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS';
    const model = process.env.GIGACHAT_MODEL || 'GigaChat';
    
    const token = await getGigaChatToken(authData, scope);
    
    console.log(`[AI] Dispatching request to GigaChat using model: ${model}`);
    const response = await axios.post('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
      model: model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: isPFC ? 0.3 : 0.7,
      stream: false
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      httpsAgent: sberHttpsAgent,
      timeout: isPFC ? 15000 : 25000
    });
    
    return response.data.choices[0].message.content;
  } else {
    // === 🔵 OPENAI / DEEPSEEK / OLLAMA FALLBACK MODE ===
    let rawBaseUrl = process.env.AI_BASE_URL || "";
    if (!rawBaseUrl) {
      const geminiUrl = process.env.GEMINI_BASE_URL || "";
      // If GEMINI_BASE_URL is default Google address, bypass it and default to DeepSeek
      if (geminiUrl && !geminiUrl.includes("googleapis.com")) {
        rawBaseUrl = geminiUrl;
      } else {
        rawBaseUrl = "https://api.deepseek.com";
      }
    }
    const safeBaseUrl = rawBaseUrl.replace(/\/$/, "");
    
    let apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || "";
    apiKey = apiKey.trim();
    
    const modelName = process.env.AI_MODEL || "deepseek-chat";
    
    console.log(`[AI] Dispatching request to OpenAI-compatible endpoint: ${safeBaseUrl}/chat/completions using model: ${modelName}`);
    const response = await axios.post(`${safeBaseUrl}/chat/completions`, {
      model: modelName,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: isPFC ? 0.3 : 0.7
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
      },
      timeout: isPFC ? 15000 : 25000
    });
    
    return response.data.choices[0].message.content;
  }
}

/**
 * Strips markdown and parses robust JSON output.
 */
function cleanJsonResponse(text) {
  let cleaned = text.trim();
  
  // 1. Try to find content within ```json and ``` or ``` and ```
  const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = cleaned.match(markdownRegex);
  if (match && match[1]) {
    cleaned = match[1].trim();
  }

  // 2. Extract substring between first '{' and last '}' to strip conversational text
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1).trim();
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('❌ Failed to parse JSON from AI response. Cleaned text:', cleaned);
    
    // Attempt simple JSON recovery in case of truncated array items at the end:
    try {
      let recovered = cleaned;
      if (recovered.includes('"steps":') || recovered.includes('"ingredients":')) {
        if (!recovered.endsWith('}')) recovered += '}';
        if (!recovered.endsWith(']}')) recovered += ']}';
        if (!recovered.endsWith('}')) recovered += '}';
        return JSON.parse(recovered);
      }
    } catch (recoveryError) {
      // Ignored, throw original error
    }
    
    throw error;
  }
}

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

    const systemPrompt = "Ты шеф-повар, который общается исключительно в формате JSON. Твой ответ должен быть СТРОГО валидным JSON-объектом, без какого-либо вступительного или заключительного текста, без приветствий и вежливых фраз. Пиши только чистый JSON.";

    try {
      const responseText = await requestAI(prompt, systemPrompt);
      return cleanJsonResponse(responseText);
    } catch (error) {
      console.error('--- ОШИБКА ГЕНЕРАЦИИ РЕЦЕПТА (AI SERVICE) ---');
      console.error(error.message);
      throw new Error('Ошибка генерации рецепта: ' + error.message);
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

    const systemPrompt = "Ты диетолог, который общается исключительно в формате JSON. Твой ответ должен быть СТРОГО валидным JSON-объектом, без какого-либо вступительного или заключительного текста, без приветствий и вежливых фраз. Пиши только чистый JSON.";

    try {
      const responseText = await requestAI(prompt, systemPrompt, true);
      return cleanJsonResponse(responseText);
    } catch (error) {
      console.error('--- ОШИБКА ГЕНЕРАЦИИ БЖУ (AI SERVICE) ---', error.message);
      return { proteins: 0, fats: 0, carbohydrates: 0, calorific: 0 };
    }
  },
};

module.exports = geminiService;