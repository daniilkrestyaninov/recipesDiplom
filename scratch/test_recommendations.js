const rc = require('../controllers/recipeController');
const { sequelize } = require('../models');

async function runTest() {
  try {
    console.log('--- STARTING CONTROLLER TEST ---');
    const req = {
      user: { id: 1 }, // Mock user ID
      query: { page: 1, limit: 5 }
    };
    const res = {
      json: (data) => {
        console.log('SUCCESS! Controller returned data:', Array.isArray(data) ? `${data.length} recipes` : typeof data);
      },
      status: (code) => {
        console.log('STATUS CODE:', code);
        return res;
      }
    };

    await rc.getRecommendations(req, res);
  } catch (err) {
    console.error('CRITICAL CONTROLLER ERROR:');
    console.error(err.stack);
  } finally {
    await sequelize.close();
  }
}

runTest();
