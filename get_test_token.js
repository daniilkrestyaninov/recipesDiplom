const { User } = require('./models');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

async function main() {
  try {
    const user = await User.create({
      username: `testuser_${Date.now()}`,
      name: 'Test User',
      email: `test_${Date.now()}@example.com`,
      password: 'hashedpassword',
      role_id: 2,
      is_verified: true
    });

    const token = jwt.sign(
      { id: Number(user.id), username: user.username, role: 'User' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`__TOKEN__${token}__TOKEN__`);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

main();
