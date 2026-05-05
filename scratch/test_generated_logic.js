const axios = require('axios');

const API_URL = 'http://localhost:5000';
// Замените на реальный токен из вашего окружения или используйте тестовый логин
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTgsInVzZXJuYW1lIjoiaWdvciIsInJvbGUiOiJVc2VyIiwiaWF0IjoxNzc4MDE3ODkyLCJleHAiOjE3NzgxMDQyOTJ9.dlmYzEf9iwFaDJxSW5GgPDjrgNr3vm1YHdNIVsS4fG8'; 

async function runTests() {
  console.log('--- Начинаем тесты логики is_generated и null-рейтингов ---');

  try {
    // 1. Создаем рецепт от ИИ
    console.log('\n1. Создание ИИ-рецепта...');
    const recipeRes = await axios.post(`${API_URL}/recipes`, {
      title: "ИИ Тестовый Рецепт",
      description: "Сгенерировано шефом",
      difficulty: "1",
      portion: 2,
      cooking_time: 15,
      is_generated: true,
      is_private: false // Пробуем отправить false, должно стать true
    }, { headers: { Authorization: `Bearer ${TOKEN}` } });

    console.log('Результат:', recipeRes.data.is_generated ? '✅ Флаг установлен' : '❌ Флаг отсутствует');
    console.log('Приватность:', recipeRes.data.is_private ? '✅ Принудительно приватный' : '❌ Ошибка: остался публичным');

    const recipeId = recipeRes.data.id;

    // 2. Попытка сделать его публичным
    console.log('\n2. Попытка сделать ИИ-рецепт публичным (update)...');
    try {
      await axios.put(`${API_URL}/recipes/${recipeId}`, {
        is_private: false
      }, { headers: { Authorization: `Bearer ${TOKEN}` } });
      console.log('❌ Ошибка: Бэкенд разрешил сделать ИИ-рецепт публичным!');
    } catch (e) {
      console.log('✅ Бэкенд отклонил запрос:', e.response?.data?.message || e.message);
    }

    // 3. Создание комментария БЕЗ рейтинга
    console.log('\n3. Создание комментария без рейтинга...');
    const commentRes = await axios.post(`${API_URL}/recipes/${recipeId}/comments`, {
      content: "Просто общаюсь в комментах, рейтинг не ставлю"
    }, { headers: { Authorization: `Bearer ${TOKEN}` } });
    
    console.log('Результат:', commentRes.data.id ? '✅ Комментарий создан без рейтинга' : '❌ Ошибка создания');

  } catch (error) {
    console.error('Ошибка при выполнении тестов:', error.response?.data || error.message);
    console.log('\nСОВЕТ: Если вы получили 401, убедитесь, что сервер запущен и токен в скрипте валидный.');
  }
}

// Перед запуском убедитесь, что сервер работает на localhost:5000
runTests();
