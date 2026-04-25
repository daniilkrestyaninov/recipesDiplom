const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());

// Настройка Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Recipes API',
      version: '1.0.0',
      description: 'API для проекта "Рецепты" с авторизацией и CRUD операциями',
    },
    servers: [
      {
        url: '/',
        description: 'Current server (Internet/Local)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./server.js', './routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Настройка Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
  }
}));

// Импорт роутов
const recipeRoutes = require('./routes/recipeRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/recipes', recipeRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger UI is available at http://localhost:${PORT}/api-docs`);
});
