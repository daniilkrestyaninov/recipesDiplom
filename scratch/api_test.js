const axios = require('axios');
const { User, Role } = require('../models');

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('--- Начинаем интеграционные тесты ---');
  let userAToken, userBToken, adminToken;
  let userAId, userBId, adminId;
  let recipeId, commentId, reportId;

  const testSuffix = Date.now();

  try {
    // 1. Создание тестовых пользователей
    console.log('1. Регистрация пользователей...');
    const userAEmail = `usera_${testSuffix}@test.com`;
    await axios.post(`${BASE_URL}/auth/register`, {
      username: `userA_${testSuffix}`,
      email: userAEmail,
      password: 'password123',
      name: 'User A'
    });
    
    const userBEmail = `userb_${testSuffix}@test.com`;
    await axios.post(`${BASE_URL}/auth/register`, {
      username: `userB_${testSuffix}`,
      email: userBEmail,
      password: 'password123',
      name: 'User B'
    });
    
    const adminEmail = `admin_${testSuffix}@test.com`;
    await axios.post(`${BASE_URL}/auth/register`, {
      username: `admin_${testSuffix}`,
      email: adminEmail,
      password: 'password123',
      name: 'Admin User'
    });

    // Делаем всех verified через БД
    await User.update({ is_verified: true }, { where: { email: [userAEmail, userBEmail, adminEmail] } });

    console.log('Пользователи верифицированы. Логин...');

    const loginA = await axios.post(`${BASE_URL}/auth/login`, { email: userAEmail, password: 'password123' });
    userAToken = loginA.data.access_token;
    userAId = loginA.data.user.id;

    const loginB = await axios.post(`${BASE_URL}/auth/login`, { email: userBEmail, password: 'password123' });
    userBToken = loginB.data.access_token;
    userBId = loginB.data.user.id;

    const loginAdmin = await axios.post(`${BASE_URL}/auth/login`, { email: adminEmail, password: 'password123' });
    adminId = loginAdmin.data.user.id;
    adminToken = loginAdmin.data.access_token;

    // Сделаем Admin'а реальным админом в БД
    const adminRole = await Role.findOne({ where: { name: 'Admin' } });
    if (adminRole) {
      await User.update({ role_id: adminRole.id }, { where: { id: adminId } });
      console.log('Роль Admin назначена тестовому админу.');
      // Релогин админа, чтобы токен содержал роль Admin
      const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: adminEmail,
        password: 'password123'
      });
      adminToken = adminLoginRes.data.access_token;
    } else {
        console.warn('Роль Admin не найдена! Тесты админа могут упасть.');
    }

    // 2. User A создает рецепт
    console.log('2. Создание рецепта...');
    const recipeRes = await axios.post(`${BASE_URL}/recipes`, {
      title: 'Тестовый рецепт',
      description: 'Очень вкусный рецепт',
      portion: 2,
      cooking_time: 30,
      difficulty: '2'
    }, { headers: { Authorization: `Bearer ${userAToken}` } });
    recipeId = recipeRes.data.id;

    // 3. User B оставляет комментарий
    console.log('3. Создание комментария...');
    const commentRes = await axios.post(`${BASE_URL}/recipes/${recipeId}/comments`, {
      content: 'Крутой рецепт!',
      rating: 5
    }, { headers: { Authorization: `Bearer ${userBToken}` } });
    commentId = commentRes.data.id;

    // 4. Тест лайков комментариев
    console.log('4. Тестирование лайков комментариев...');
    // User A лайкает комментарий
    let likeRes = await axios.post(`${BASE_URL}/comments/${commentId}/like`, {}, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    if (!likeRes.data.liked) throw new Error('Ожидался лайк, получено false');
    
    // Получаем список комментариев от лица User A (должен быть isLiked: true)
    let getCommentsRes = await axios.get(`${BASE_URL}/recipes/${recipeId}/comments`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    let fetchedComment = getCommentsRes.data.find(c => c.id === commentId);
    if (fetchedComment.likeCount !== 1) throw new Error(`Неверный likeCount: ${fetchedComment.likeCount}`);
    if (fetchedComment.isLiked !== true) throw new Error('Ожидался isLiked = true для User A');

    // Получаем список комментариев от лица User B (должен быть isLiked: false)
    getCommentsRes = await axios.get(`${BASE_URL}/recipes/${recipeId}/comments`, {
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    fetchedComment = getCommentsRes.data.find(c => c.id === commentId);
    if (fetchedComment.isLiked !== false) throw new Error('Ожидался isLiked = false для User B');

    // User A убирает лайк
    likeRes = await axios.post(`${BASE_URL}/comments/${commentId}/like`, {}, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    if (likeRes.data.liked) throw new Error('Ожидалось снятие лайка, получено true');

    // Проверяем снятие
    getCommentsRes = await axios.get(`${BASE_URL}/recipes/${recipeId}/comments`);
    fetchedComment = getCommentsRes.data.find(c => c.id === commentId);
    if (fetchedComment.likeCount !== 0) throw new Error(`Неверный likeCount после снятия: ${fetchedComment.likeCount}`);
    
    console.log('✅ Лайки работают корректно.');

    // 5. Тестирование системы жалоб (Reports)
    console.log('5. Тестирование системы жалоб...');
    // User A жалуется на User B (profile)
    const reportRes = await axios.post(`${BASE_URL}/reports`, {
      type: 'profile',
      reported_user_id: userBId,
      reason: 'Спам в комментариях',
      description: 'Оставляет подозрительные ссылки'
    }, { headers: { Authorization: `Bearer ${userAToken}` } });
    reportId = reportRes.data.reportId;
    if (!reportId) throw new Error('Репорт не создан (нет ID)');

    // Admin просматривает жалобы
    const getReportsRes = await axios.get(`${BASE_URL}/reports`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const fetchedReport = getReportsRes.data.find(r => r.id === reportId);
    if (!fetchedReport) throw new Error('Админ не нашел новую жалобу');
    if (fetchedReport.status !== 'pending') throw new Error('Неверный статус новой жалобы');

    // Admin обновляет статус жалобы
    const updateReportRes = await axios.patch(`${BASE_URL}/reports/${reportId}`, {
      status: 'resolved'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    if (updateReportRes.data.report.status !== 'resolved') throw new Error('Статус жалобы не обновился');

    console.log('✅ Система жалоб работает корректно.');

    console.log('\n🎉 ВСЕ ТЕСТЫ УСПЕШНО ПРОЙДЕНЫ!');
  } catch (error) {
    console.error('\n❌ ОШИБКА ПРИ ВЫПОЛНЕНИИ ТЕСТОВ:');
    if (error.response) {
      console.error('Статус:', error.response.status);
      console.error('Данные:', error.response.data);
    } else {
      console.error(error.message);
    }
  } finally {
    process.exit(0);
  }
}

runTests();
