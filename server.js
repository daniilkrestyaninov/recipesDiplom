const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { sequelize } = require('./models');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ── Инициализация Firebase Admin SDK ─────────────────────────
try {
  const adminFirebase = require('firebase-admin');
  
  const serviceAccountPath = path.join(__dirname, 'diplom-f35d3-firebase-adminsdk-fbsvc-8ee5cdf97b.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    if (serviceAccount.private_key) {
      let key = serviceAccount.private_key;
      key = key.replace(/\\n/g, '\n');
      if (!key.includes('\n')) {
          key = key.replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\\n')
                   .replace('-----END PRIVATE KEY-----', '\\n-----END PRIVATE KEY-----');
      }
      serviceAccount.private_key = key.trim();
    }
    
    if (!adminFirebase.apps.length) {
      adminFirebase.initializeApp({
        credential: adminFirebase.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin успешно инициализирован');
    }
  }
} catch (error) {
  console.error('❌ Ошибка инициализации Firebase:', error.message);
}

const app = express();

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Swagger ──────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vkusno API',
      version: '2.0.0',
      description: 'Полный API проекта "Вкусно"',
    },
    servers: [{ url: '/', description: 'Текущий сервер' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, './routes/*.js').replace(/\\/g, '/')],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  explorer: true,
  swaggerOptions: { persistAuthorization: true },
}));

// ── Роуты ────────────────────────────────────────────────────
app.use('/auth', require('./routes/authRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/recipes', require('./routes/recipeRoutes'));
app.use('/comments', require('./routes/commentRoutes'));
app.use('/favorites', require('./routes/favoriteRoutes'));
app.use('/meta', require('./routes/metaRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/notifications', require('./routes/notificationRoutes'));
app.use('/reports', require('./routes/reportRoutes'));
app.use('/diet-plans', require('./routes/dietPlanRoutes'));
app.use('/sync', require('./routes/syncRoutes'));
app.use('/upload', require('./routes/uploadRoutes'));
app.use('/tools', require('./routes/toolsRoutes'));
app.use('/ai', require('./routes/toolsRoutes'));

// ── Запуск ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
sequelize.sync().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер запущен: http://188.233.238.70:${PORT}`);
  });
});