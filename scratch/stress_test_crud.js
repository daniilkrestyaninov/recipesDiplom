/**
 * СТРЕСС-ТЕСТ: ПОЛНЫЙ ЦИКЛ CRUD В ПАРАЛЛЕЛЬНЫХ ПОТОКАХ
 * Симулирует активную работу: создание, комментирование, изменение и удаление.
 */
const jwt = require('jsonwebtoken');

const BASE = 'http://localhost:5000';
const JWT_SECRET = 'super_secret_key';
const adminToken = jwt.sign({ id: 1, username: 'admin', role: 'Admin' }, JWT_SECRET, { expiresIn: '1h' });

const CONCURRENCY = 40; // Количество параллельных "активных пользователей"
const ITERATIONS_PER_WORKER = 10; // Сколько циклов сделает каждый

const stats = {
  created: 0,
  updated: 0,
  commented: 0,
  deleted: 0,
  errors: 0,
  durations: []
};

async function request(method, path, body = null, token = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  
  const start = performance.now();
  try {
    const res = await fetch(`${BASE}${path}`, opts);
    stats.durations.push(performance.now() - start);
    if (res.status >= 400) {
      const data = await res.json().catch(() => ({}));
      throw new Error(`[${method} ${path}] Status ${res.status}: ${JSON.stringify(data)}`);
    }
    return await res.json().catch(() => ({}));
  } catch (err) {
    stats.errors++;
    throw err;
  }
}

async function worker(id) {
  for (let i = 0; i < ITERATIONS_PER_WORKER; i++) {
    try {
      // Имитируем небольшую задержку между действиями пользователя (100мс)
      const sleep = () => new Promise(r => setTimeout(r, 100));

      // 1. Создание рецепта
      const recipe = await request('POST', '/recipes', {
        title: `Stress Test Recipe ${id}-${i}`,
        description: 'Testing DB stability under heavy load',
        cooking_time: 30,
        portion: 4,
        difficulty: '3',
        steps: [{ step_number: 1, description: 'Wait for it...' }],
        ingredients: [{ name: 'Stress', amount: '100', unit_id: 1 }]
      }, adminToken);
      stats.created++;
      await sleep();

      const recipeId = recipe.id;

      // 2. Добавление комментария
      await request('POST', `/recipes/${recipeId}/comments`, {
        content: 'Stress test comment',
        rating: 5
      }, adminToken);
      stats.commented++;
      await sleep();

      // 3. Обновление
      await request('PUT', `/recipes/${recipeId}`, {
        title: `Updated Stress Recipe ${id}-${i}`
      }, adminToken);
      stats.updated++;
      await sleep();

      // 4. Параллельный запрос аналитики (для нагрузки)
      await request('GET', '/admin/analytics', null, adminToken);
      await sleep();

      // 5. Удаление (админское)
      await request('DELETE', `/admin/recipes/${recipeId}`, null, adminToken);
      stats.deleted++;
      await sleep();

    } catch (err) {
      console.error(`[Worker ${id}] Ошибка:`, err.message);
    }
  }
}

async function run() {
  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log('  ЗАПУСК ТЯЖЕЛОГО СТРЕСС-ТЕСТА (CRUD + ANALYTICS)');
  console.log(`  Конкурентность: ${CONCURRENCY} потоков | Циклов: ${ITERATIONS_PER_WORKER}`);
  console.log('════════════════════════════════════════════════════════════════════════\n');

  const start = performance.now();
  
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker(i));
  }

  // Запускаем мониторинг в процессе
  const monitor = setInterval(() => {
    const elapsed = ((performance.now() - start) / 1000).toFixed(1);
    process.stdout.write(`\r  [${elapsed}с] Создано: ${stats.created} | Комментов: ${stats.commented} | Удалено: ${stats.deleted} | Ошибок: ${stats.errors}    `);
  }, 500);

  await Promise.all(workers);
  clearInterval(monitor);

  const totalTime = ((performance.now() - start) / 1000).toFixed(2);
  const avgDuration = (stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length).toFixed(1);

  console.log('\n\n════════════════════════════════════════════════════════════════════════');
  console.log('  РЕЗУЛЬТАТЫ СТРЕСС-ТЕСТА');
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log(`  Общее время:      ${totalTime} сек`);
  console.log(`  Всего операций:   ${stats.created + stats.updated + stats.commented + stats.deleted}`);
  console.log(`  Создано записей:  ${stats.created}`);
  console.log(`  Удалено записей:  ${stats.deleted}`);
  console.log(`  Средний ответ:    ${avgDuration} мс`);
  console.log(`  Ошибок:           ${stats.errors}`);
  console.log('────────────────────────────────────────────────────────────────────────');
  
  if (stats.errors === 0) {
    console.log('  🏆 ВЕРДИКТ: СИСТЕМА ПОЛНОСТЬЮ СТАБИЛЬНА ПРИ ТЯЖЕЛОЙ НАГРУЗКЕ');
  } else {
    console.log(`  ⚠️ ВЕРДИКТ: ОБНАРУЖЕНЫ СБОИ (${((stats.errors / (stats.created || 1)) * 100).toFixed(2)}%)`);
  }
  console.log('════════════════════════════════════════════════════════════════════════\n');

  process.exit(0);
}

run();
