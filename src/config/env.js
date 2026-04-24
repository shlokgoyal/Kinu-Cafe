require('dotenv').config();

const required = (key) => {
  const val = process.env[key];
  if (!val || !String(val).trim()) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return val;
};

const num = (key, fallback) => {
  const val = process.env[key];
  if (val === undefined || val === '') return fallback;
  const parsed = Number(val);
  if (Number.isNaN(parsed)) throw new Error(`Invalid number for env var ${key}: ${val}`);
  return parsed;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: num('PORT', 5000),

  mongoUri: required('MONGO_URI'),

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  defaultAdmin: {
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@kinucafe.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
    name: process.env.DEFAULT_ADMIN_NAME || 'Kinu Admin',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  taxRate: num('TAX_RATE', 0.05),
  birthdayDiscountPercent: num('BIRTHDAY_DISCOUNT_PERCENT', 10),

  sms: {
    provider: (process.env.SMS_PROVIDER || 'dev').toLowerCase(),
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      from: process.env.TWILIO_FROM || '',
    },
    msg91: {
      authKey: process.env.MSG91_AUTH_KEY || '',
      templateId: process.env.MSG91_TEMPLATE_ID || '',
    },
  },

  otp: {
    length: num('OTP_LENGTH', 6),
    expiryMinutes: num('OTP_EXPIRY_MINUTES', 5),
  },
};

module.exports = env;
