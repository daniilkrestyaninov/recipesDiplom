const axios = require('axios');

const API_URL = 'http://localhost:5000/api'; // or 188.233.238.70 if testing remotely
const TOKEN = 'YOUR_TEST_TOKEN';

async function test() {
  try {
    const res = await axios.post(`${API_URL}/diet-plans`, {
      title: 'Healthy Week',
      description: 'Low carb diet plan',
      is_private: false,
      recipes: [
        { recipe_id: 1, day_of_week: 1, meal_order: 1 },
        { recipe_id: 2, day_of_week: 1, meal_order: 2 }
      ]
    }, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log('Plan created:', res.data);
  } catch (e) {
    console.error('Error:', e.response?.data || e.message);
  }
}

// test();
