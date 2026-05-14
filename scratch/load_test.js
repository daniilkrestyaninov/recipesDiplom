/**
 * Нагрузочный тест: постепенно увеличиваем количество параллельных запросов,
 * пока сервер не начнёт отказывать или время ответа не станет критическим.
 */
const jwt = require('jsonwebtoken');

const BASE = 'http://localhost:5000';
const JWT_SECRET = 'super_secret_key';
const adminToken = jwt.sign({ id: 1, username: 'admin', role: 'Admin' }, JWT_SECRET, { expiresIn: '1h' });
const userToken = jwt.sign({ id: 2, username: 'testuser', role: 'User' }, JWT_SECRET, { expiresIn: '1h' });

// Уровни нагрузки для тестирования
const LEVELS = [10, 25, 50, 100, 200, 300, 500, 750, 1000];

// Эндпоинты для тестирования (лёгкие и тяжёлые)
const ENDPOINTS = [
  { name: 'GET /admin/stats (лёгкий)', method: 'GET', path: '/admin/stats', token: adminToken },
  { name: 'GET /admin/analytics (тяжёлый, агрегация)', method: 'GET', path: '/admin/analytics', token: adminToken },
  { name: 'GET /recipes (публичный)', method: 'GET', path: '/recipes', token: null },
];

async function sendRequest(endpoint) {
  const opts = {
    method: endpoint.method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (endpoint.token) opts.headers['Authorization'] = `Bearer ${endpoint.token}`;

  const start = performance.now();
  try {
    const res = await fetch(`${BASE}${endpoint.path}`, opts);
    const elapsed = performance.now() - start;
    return { ok: res.status >= 200 && res.status < 500, status: res.status, elapsed };
  } catch (err) {
    const elapsed = performance.now() - start;
    return { ok: false, status: 0, elapsed, error: err.code || err.message };
  }
}

async function testLevel(endpoint, concurrency) {
  const promises = [];
  for (let i = 0; i < concurrency; i++) {
    promises.push(sendRequest(endpoint));
  }
  
  const start = performance.now();
  const results = await Promise.all(promises);
  const totalTime = performance.now() - start;

  const successful = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  const times = results.map(r => r.elapsed);
  const avgTime = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1);
  const maxTime = Math.max(...times).toFixed(1);
  const minTime = Math.min(...times).toFixed(1);
  const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)].toFixed(1);
  const rps = (concurrency / (totalTime / 1000)).toFixed(0);
  const errors = results.filter(r => !r.ok).map(r => r.error || r.status).filter(Boolean);

  return { concurrency, successful, failed, avgTime, maxTime, minTime, p95, rps, totalTime: totalTime.toFixed(0), errors };
}

async function run() {
  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log('  НАГРУЗОЧНЫЙ ТЕСТ — ОПРЕДЕЛЕНИЕ ПРЕДЕЛЬНОЙ НАГРУЗКИ');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  for (const endpoint of ENDPOINTS) {
    console.log(`\n┌─────────────────────────────────────────────────────────────────────┐`);
    console.log(`│  ${endpoint.name}`);
    console.log(`├──────────┬──────────┬──────────┬──────────┬──────────┬──────────────┤`);
    console.log(`│ Запросов │ Успешно  │ Ошибок   │ Среднее  │  P95     │  RPS         │`);
    console.log(`├──────────┼──────────┼──────────┼──────────┼──────────┼──────────────┤`);

    let lastGoodLevel = 0;

    for (const level of LEVELS) {
      const r = await testLevel(endpoint, level);

      const statusIcon = r.failed === 0 ? '✅' : r.failed < level * 0.1 ? '⚠️' : '❌';
      console.log(
        `│ ${String(r.concurrency).padStart(6)}   │ ${String(r.successful).padStart(6)}   │ ${String(r.failed).padStart(6)}   │ ${String(r.avgTime + 'ms').padStart(8)} │ ${String(r.p95 + 'ms').padStart(8)} │ ${String(r.rps + ' req/s').padStart(12)} │ ${statusIcon}`
      );

      if (r.failed === 0) {
        lastGoodLevel = level;
      }

      // Если более 20% провалилось — дальше не идём
      if (r.failed > level * 0.2) {
        console.log(`│  ⛔ Остановлено: более 20% ошибок на уровне ${level} параллельных запросов`);
        break;
      }

      // Небольшая пауза между уровнями чтобы сервер восстановился
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`├──────────────────────────────────────────────────────────────────────┤`);
    console.log(`│  🏆 Стабильный предел: ${lastGoodLevel} параллельных запросов без ошибок`);
    console.log(`└──────────────────────────────────────────────────────────────────────┘`);
  }

  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log('  ТЕСТ ЗАВЕРШЁН');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  process.exit(0);
}

run().catch(err => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});
