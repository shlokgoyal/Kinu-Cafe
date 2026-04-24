const crypto = require('crypto');
const Otp = require('../models/Otp');
const env = require('../config/env');
const smsService = require('./smsService');
const ApiError = require('../utils/ApiError');

const MAX_ATTEMPTS = 5;

function generateCode(length = env.otp.length) {
  // Cryptographically strong numeric code of the given length.
  const max = 10 ** length;
  const n = crypto.randomInt(0, max);
  return String(n).padStart(length, '0');
}

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

async function issue(phone) {
  // Invalidate prior unconsumed OTPs for this phone.
  await Otp.updateMany(
    { phone, consumedAt: null },
    { $set: { consumedAt: new Date() } }
  );

  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + env.otp.expiryMinutes * 60 * 1000);

  const doc = await Otp.create({ phone, codeHash, expiresAt });

  try {
    await smsService.sendOtp(phone, code);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[otp] sms send failed:', err.message);
    throw new ApiError(502, 'Failed to deliver OTP. Please try again.');
  }

  const payload = {
    requestId: doc._id.toString(),
    expiresAt,
  };
  if (!env.isProduction) payload.devOtp = code;
  return payload;
}

async function verify(phone, code) {
  if (!phone || !code) throw new ApiError(400, 'phone and otp are required');

  const otp = await Otp.findOne({ phone, consumedAt: null }).sort({ createdAt: -1 });
  if (!otp) throw new ApiError(400, 'No active OTP for this phone. Request a new one.');

  if (otp.expiresAt < new Date()) {
    otp.consumedAt = new Date();
    await otp.save();
    throw new ApiError(400, 'OTP expired. Request a new one.');
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    otp.consumedAt = new Date();
    await otp.save();
    throw new ApiError(429, 'Too many attempts on this OTP. Request a new one.');
  }

  otp.attempts += 1;

  const codeHash = hashCode(code);
  if (codeHash !== otp.codeHash) {
    await otp.save();
    throw new ApiError(400, 'Invalid OTP.');
  }

  otp.consumedAt = new Date();
  await otp.save();
  return true;
}

module.exports = { issue, verify };
