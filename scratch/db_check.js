const { User } = require('../models');

async function run() {
  try {
    const u = await User.findByPk(26, {
      include: [{ model: User, as: 'Following', attributes: ['id', 'username', 'name', 'avatar_url'], through: { attributes: [] } }],
    });
    console.log('Following:', JSON.stringify(u.Following, null, 2));
  } catch (err) {
    console.error('Error fetching following:', err);
  }
  process.exit(0);
}

run();
