const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const app = express();
app.use(express.json());

// ── Swagger ──────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Recipes API',
      version: '1.0.0',
      description: 'Полный API для проекта "Вкусно" с авторизацией, рецептами и социальными функциями',
    },
    servers: [{ url: '/', description: 'Текущий сервер' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
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
app.use('/auth',          require('./routes/authRoutes'));
app.use('/users',         require('./routes/userRoutes'));
app.use('/recipes',       require('./routes/recipeRoutes'));
app.use('/comments',      require('./routes/commentRoutes'));
app.use('/favorites',     require('./routes/favoriteRoutes'));
app.use('/',              require('./routes/metaRoutes'));   // /categories, /national-kitchens, etc.

// ── Глобальный обработчик ошибок ─────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Внутренняя ошибка сервера', error: err.message });
});

// ── Запуск ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅  Сервер запущен: http://localhost:${PORT}`);
  console.log(`📚  Swagger UI:     http://localhost:${PORT}/api-docs`);
});
