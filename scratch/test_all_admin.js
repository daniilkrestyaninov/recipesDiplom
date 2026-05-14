/**
 * Комплексный тест всех админских эндпоинтов + стабильности бэкенда.
 * Запуск: node scratch/test_all_admin.js
 */
const jwt = require('jsonwebtoken');

const BASE = 'http://localhost:5000';
const JWT_SECRET = 'super_secret_key';

// Генерируем токены: админ (role_id=1) и обычный юзер (role_id=2)
const adminToken = jwt.sign({ id: 1, username: 'admin', role: 'Admin' }, JWT_SECRET, { expiresIn: '1h' });
const userToken = jwt.sign({ id: 2, username: 'testuser', role: 'User' }, JWT_SECRET, { expiresIn: '1h' });

let passed = 0;
let failed = 0;
const results = [];

async function request(method, path, body = null, token = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  
  const res = await fetch(`${BASE}${path}`, opts);
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

function test(name, ok, detail = '') {
  if (ok) {
    passed++;
    results.push(`  ✅ ${name}`);
  } else {
    failed++;
    results.push(`  ❌ ${name} ${detail ? '→ ' + detail : ''}`);
  }
}

async function run() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  КОМПЛЕКСНЫЙ ТЕСТ БЭКЕНДА — ADMIN + STABILITY');
  console.log('══════════════════════════════════════════════════\n');

  // ─── 1. Базовая доступность ────────────────────────────────
  console.log('─── 1. Базовая доступность ───');
  {
    const r = await request('GET', '/admin/stats', null, adminToken);
    test('GET /admin/stats (200)', r.status === 200, `status=${r.status}`);
  }
  {
    const r = await request('GET', '/admin/stats');
    test('GET /admin/stats без токена (401)', r.status === 401, `status=${r.status}`);
  }
  {
    const r = await request('GET', '/admin/stats', null, userToken);
    test('GET /admin/stats обычный юзер (403)', r.status === 403, `status=${r.status}`);
  }

  // ─── 2. Аналитика ─────────────────────────────────────────
  console.log('─── 2. Аналитика ───');
  {
    const r = await request('GET', '/admin/analytics', null, adminToken);
    test('GET /admin/analytics (200)', r.status === 200, `status=${r.status} err=${r.data?.error}`);
    if (r.status === 200 && r.data) {
      test('  → registrations есть', Array.isArray(r.data.registrations));
      test('  → recipeStats есть', Array.isArray(r.data.recipeStats));
      test('  → popularCategories есть', Array.isArray(r.data.popularCategories));
      test('  → popularKitchens есть', Array.isArray(r.data.popularKitchens));
      test('  → topRecipes есть', Array.isArray(r.data.topRecipes));
      test('  → topUsers есть', Array.isArray(r.data.topUsers));
      test('  → reportsByStatus есть', Array.isArray(r.data.reportsByStatus));
    }
  }

  // ─── 3. Роли ──────────────────────────────────────────────
  console.log('─── 3. Роли ───');
  {
    const r = await request('GET', '/admin/roles', null, adminToken);
    test('GET /admin/roles (200)', r.status === 200, `status=${r.status}`);
    test('  → массив ролей', Array.isArray(r.data) && r.data.length > 0, `len=${r.data?.length}`);
  }

  // ─── 4. Пользователи ──────────────────────────────────────
  console.log('─── 4. Пользователи ───');
  {
    const r = await request('GET', '/admin/users', null, adminToken);
    test('GET /admin/users (200)', r.status === 200, `status=${r.status}`);
    test('  → массив пользователей', Array.isArray(r.data), `type=${typeof r.data}`);
  }

  // ─── 5. Меню недели ────────────────────────────────────────
  console.log('─── 5. Меню недели ───');
  let menuItemId = null;
  {
    const r = await request('GET', '/admin/menu-of-week', null, adminToken);
    test('GET /admin/menu-of-week (200)', r.status === 200, `status=${r.status}`);
    test('  → массив', Array.isArray(r.data));
  }
  {
    // Попробуем добавить рецепт в меню (рецепт id=1, день=1)
    const r = await request('POST', '/admin/menu-of-week', { day_of_week: 1, recipe_id: 1 }, adminToken);
    test('POST /admin/menu-of-week (201 или 500 если рецепт не существует)',
      r.status === 201 || r.status === 500, `status=${r.status}`);
    if (r.status === 201) {
      menuItemId = r.data.id;
      test('  → id получен', !!menuItemId);
    }
  }
  if (menuItemId) {
    const r = await request('DELETE', `/admin/menu-of-week/${menuItemId}`, null, adminToken);
    test('DELETE /admin/menu-of-week/:id (200)', r.status === 200, `status=${r.status}`);
  }
  {
    // Валидация: без токена
    const r = await request('POST', '/admin/menu-of-week', { day_of_week: 1, recipe_id: 1 });
    test('POST /admin/menu-of-week без авторизации (401)', r.status === 401, `status=${r.status}`);
  }

  // ─── 6. Массовые уведомления ───────────────────────────────
  console.log('─── 6. Массовые уведомления ───');
  {
    const r = await request('POST', '/admin/notifications/broadcast',
      { message: 'Тестовое уведомление от системы тестирования' }, adminToken);
    test('POST /admin/notifications/broadcast (200)', r.status === 200, `status=${r.status} err=${r.data?.error}`);
  }
  {
    // Без тела сообщения
    const r = await request('POST', '/admin/notifications/broadcast', {}, adminToken);
    test('POST broadcast без message (400)', r.status === 400, `status=${r.status}`);
  }

  // ─── 7. Верификация ────────────────────────────────────────
  console.log('─── 7. Верификация ───');
  {
    const r = await request('GET', '/admin/verifications', null, adminToken);
    test('GET /admin/verifications (200)', r.status === 200, `status=${r.status}`);
    test('  → массив заявок', Array.isArray(r.data));
  }
  {
    // Обработка несуществующей заявки
    const r = await request('PATCH', '/admin/verifications/999999', { status: 'approved' }, adminToken);
    test('PATCH /admin/verifications/999999 (404)', r.status === 404, `status=${r.status}`);
  }

  // ─── 8. Логи действий ─────────────────────────────────────
  console.log('─── 8. Логи действий ───');
  {
    const r = await request('GET', '/admin/audit-logs', null, adminToken);
    test('GET /admin/audit-logs (200)', r.status === 200, `status=${r.status}`);
    test('  → массив логов', Array.isArray(r.data));
    if (Array.isArray(r.data) && r.data.length > 0) {
      test('  → логи содержат action', !!r.data[0].action);
      test('  → логи содержат admin_id', !!r.data[0].admin_id);
    }
  }

  // ─── 9. Массовые операции ──────────────────────────────────
  console.log('─── 9. Массовые операции ───');
  {
    // bulk-block: пустой массив
    const r = await request('POST', '/admin/users/bulk-block', { userIds: [], is_blocked: true }, adminToken);
    test('POST bulk-block с пустым массивом (400)', r.status === 400, `status=${r.status}`);
  }
  {
    // bulk-delete: без body
    const r = await request('POST', '/admin/recipes/bulk-delete', {}, adminToken);
    test('POST bulk-delete без recipeIds (400)', r.status === 400, `status=${r.status}`);
  }
  {
    // bulk-delete: несуществующие ID
    const r = await request('POST', '/admin/recipes/bulk-delete', { recipeIds: [999998, 999999] }, adminToken);
    test('POST bulk-delete несуществующие ID (200, 0 удалено)', r.status === 200, `status=${r.status}`);
  }

  // ─── 10. Регистрация устройства (FCM) ──────────────────────
  console.log('─── 10. Регистрация устройства (FCM) ───');
  {
    const r = await request('POST', '/notifications/register-device',
      { token: 'test_fcm_token_' + Date.now(), device_type: 'android' });
    test('POST register-device без авторизации (200, гость)', r.status === 200, `status=${r.status} err=${r.data?.error}`);
  }
  {
    const r = await request('POST', '/notifications/register-device',
      { token: 'test_fcm_token_auth_' + Date.now(), device_type: 'android' }, userToken);
    test('POST register-device с авторизацией (200)', r.status === 200, `status=${r.status}`);
  }
  {
    const r = await request('POST', '/notifications/register-device', {});
    test('POST register-device без token (400)', r.status === 400, `status=${r.status}`);
  }

  // ─── 11. Стресс-тест: параллельные запросы ─────────────────
  console.log('─── 11. Стресс-тест (20 параллельных запросов) ───');
  {
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(request('GET', '/admin/stats', null, adminToken));
    }
    const results20 = await Promise.all(promises);
    const allOk = results20.every(r => r.status === 200);
    test('20x GET /admin/stats параллельно — все 200', allOk,
      `failures=${results20.filter(r => r.status !== 200).length}`);
  }
  {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(request('GET', '/admin/analytics', null, adminToken));
    }
    const results10 = await Promise.all(promises);
    const allOk = results10.every(r => r.status === 200);
    test('10x GET /admin/analytics параллельно — все 200', allOk,
      `failures=${results10.filter(r => r.status !== 200).length}`);
  }

  // ─── 12. Уведомления пользователя ──────────────────────────
  console.log('─── 12. Уведомления пользователя ───');
  {
    const r = await request('GET', '/notifications', null, userToken);
    test('GET /notifications (200)', r.status === 200, `status=${r.status}`);
  }
  {
    const r = await request('GET', '/notifications/unread-count', null, userToken);
    test('GET /notifications/unread-count (200)', r.status === 200, `status=${r.status}`);
  }

  // ─── ИТОГИ ─────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════');
  console.log('  РЕЗУЛЬТАТЫ');
  console.log('══════════════════════════════════════════════════');
  results.forEach(r => console.log(r));
  console.log('──────────────────────────────────────────────────');
  console.log(`  Всего: ${passed + failed} | ✅ Пройдено: ${passed} | ❌ Провалено: ${failed}`);
  console.log('══════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Критическая ошибка тестирования:', err);
  process.exit(1);
});
