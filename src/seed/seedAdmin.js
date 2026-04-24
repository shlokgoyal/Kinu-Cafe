const bcrypt = require('bcryptjs');
const User = require('../models/User');
const env = require('../config/env');

async function seedAdmin() {
  const email = env.defaultAdmin.email.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`[seed] default admin already exists (${email})`);
    return existing;
  }
  const passwordHash = await bcrypt.hash(env.defaultAdmin.password, 10);
  const admin = await User.create({
    name: env.defaultAdmin.name,
    email,
    passwordHash,
    role: 'admin',
    isActive: true,
  });
  console.log(
    `[seed] default admin created: ${email} / ${env.defaultAdmin.password}  (⚠️  change the password after first login)`
  );
  return admin;
}

module.exports = seedAdmin;
