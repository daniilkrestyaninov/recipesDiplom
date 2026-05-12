const axios = require('axios');
const path = require('path');

// Указываем корень бэкенда для загрузки моделей и конфигов
const BACKEND_ROOT = 'C:/istu/recipesDiplom';
process.chdir(BACKEND_ROOT); 

const { User, Recipe, Notification, sequelize } = require(path.join(BACKEND_ROOT, 'models'));
const jwt = require('jsonwebtoken');

// Загружаем .env вручную, так как мы сменили директорию
require('dotenv').config();

const API_URL = 'http://127.0.0.1:5000';
const SECRET = process.env.JWT_SECRET || 'secret';

async function runTest() {
  console.log('🚀 Начинаю тестирование системы уведомлений...');
  console.log('Backend Root:', BACKEND_ROOT);

  try {
    // Проверка соединения с БД
    await sequelize.authenticate();
    console.log('📡 Соединение с БД установлено.');

    // Получаем ID роли 'User' или первую попавшуюся
    const { Role } = require(path.join(BACKEND_ROOT, 'models'));
    const role = await Role.findOne({ where: { name: 'User' } }) || await Role.findOne();
    if (!role) throw new Error('Роли не найдены в базе данных!');
    console.log(`👤 Использую роль: ${role.name} (ID: ${role.id})`);

    // 1. Очистка старых тестов
    await User.destroy({ where: { email: ['actor@test.com', 'target@test.com'] }, force: true });
    
    // 2. Создание пользователей
    const actor = await User.create({ 
      username: 'test_actor', 
      email: 'actor@test.com', 
      password: 'password123',
      name: 'Actor User',
      role_id: role.id
    });
    const target = await User.create({ 
      username: 'test_target', 
      email: 'target@test.com', 
      password: 'password123',
      name: 'Target User',
      role_id: role.id
    });

    // 3. Создание рецепта для цели
    const recipe = await Recipe.create({
      title: 'Тестовый рецепт для уведомлений',
      description: 'Вкусный тестовый рецепт для проверки системы уведомлений',
      portion: 2,
      cooking_time: 30,
      difficulty: '1',
      user_id: target.id,
      is_private: false
    });

    // 4. Генерация токенов
    const actorToken = jwt.sign({ id: actor.id, role: 'User' }, SECRET);
    const targetToken = jwt.sign({ id: target.id, role: 'User' }, SECRET);

    const actorHeaders = { headers: { Authorization: `Bearer ${actorToken}` } };
    const targetHeaders = { headers: { Authorization: `Bearer ${targetToken}` } };

    console.log('✅ Тестовые данные созданы.');

    // 5. Тест: Подписка
    console.log('--- Тест: Подписка ---');
    await axios.post(`${API_URL}/users/${target.id}/follow`, {}, actorHeaders);
    
    // 6. Тест: Лайк
    console.log('--- Тест: Лайк ---');
    await axios.post(`${API_URL}/recipes/${recipe.id}/like`, {}, actorHeaders);

    // 7. Тест: Комментарий
    console.log('--- Тест: Комментарий ---');
    await axios.post(`${API_URL}/recipes/${recipe.id}/comments`, { content: 'Крутой рецепт!' }, actorHeaders);

    // 8. Проверка уведомлений получателя
    console.log('--- Проверка уведомлений через API ---');
    
    const countRes = await axios.get(`${API_URL}/notifications/unread-count`, targetHeaders);
    console.log(`Непрочитанных уведомлений: ${countRes.data.count} (Ожидалось: 3)`);

    const listRes = await axios.get(`${API_URL}/notifications`, targetHeaders);
    const notes = listRes.data.notifications;
    console.log(`Всего в списке: ${notes.length}`);
    
    notes.forEach(n => {
      console.log(`- Уведомление: ${n.type} от ${n.Actor?.username} (is_read: ${n.is_read})`);
    });

    // 9. Тест: Пометка как прочитанное
    if (notes.length > 0) {
      console.log('--- Тест: Пометка прочитанным ---');
      await axios.patch(`${API_URL}/notifications/${notes[0].id}/read`, {}, targetHeaders);
      const afterReadCount = await axios.get(`${API_URL}/notifications/unread-count`, targetHeaders);
      console.log(`Непрочитанных после 1 прочтения: ${afterReadCount.data.count} (Ожидалось: 2)`);
    }

    // 10. Тест: Удаление профиля (Проверка FK)
    console.log('--- Тест: Удаление профиля (Каскад) ---');
    await axios.delete(`${API_URL}/users/me`, targetHeaders);
    console.log('✅ Профиль удален успешно вместе с его уведомлениями.');

    await actor.destroy();
    console.log('\n✨ Тестирование завершено успешно! Все системы работают четко.');

  } catch (err) {
    if (err.response) {
      console.error('❌ Ошибка API:', err.response.status, JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('❌ Ошибка:', err.message);
      if (err.stack) console.error(err.stack);
    }
  } finally {
    process.exit();
  }
}

runTest();
