const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { sequelize } = require('./models');
require('dotenv').config();

const app = express();
app.use(express.json());

// ── Swagger ──────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vkusno API',
      version: '2.0.0',
      description: 'Полный API проекта "Вкусно" — рецепты, социалка, модерация, синхронизация',
    },
    servers: [{ url: '/', description: 'Текущий сервер' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  explorer: true,
  swaggerOptions: { persistAuthorization: true },
}));

// ── Роуты ────────────────────────────────────────────────────
app.use('/auth',      require('./routes/authRoutes'));
app.use('/users',     require('./routes/userRoutes'));
app.use('/recipes',   require('./routes/recipeRoutes'));
app.use('/comments',  require('./routes/commentRoutes'));
app.use('/favorites', require('./routes/favoriteRoutes'));
app.use('/meta',      require('./routes/metaRoutes'));
app.use('/admin',     require('./routes/adminRoutes'));
app.use('/tools',     require('./routes/toolsRoutes'));
app.use('/ai',        require('./routes/toolsRoutes'));
app.use('/sync',      require('./routes/syncRoutes'));

// ── Глобальный обработчик ошибок ─────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Внутренняя ошибка сервера', error: err.message });
});

// ── Запуск + авто-создание новых таблиц ──────────────────────
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: false }).then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  Сервер запущен: http://localhost:${PORT}`);
    console.log(`  Swagger UI:     http://localhost:${PORT}/api-docs\n`);
  });
}).catch(err => {
  console.error('Ошибка подключения к БД:', err.message);
});
