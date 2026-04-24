const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/jwt');
const otpService = require('../services/otpService');
const User = require('../models/User');

function issueJwt(user) {
  return signToken({ sub: user._id.toString(), role: user.role });
}

exports.sendCustomerOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const result = await otpService.issue(phone);
  res.json({
    message: 'OTP sent',
    ...result,
  });
});

exports.verifyCustomerOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  await otpService.verify(phone, otp);

  let user = await User.findOne({ phone });
  if (!user) {
    user = await User.create({
      phone,
      role: 'customer',
      isPhoneVerified: true,
    });
  } else if (!user.isPhoneVerified) {
    user.isPhoneVerified = true;
    await user.save();
  }

  if (!user.isActive) throw new ApiError(403, 'Account is deactivated.');

  const token = issueJwt(user);
  res.json({
    token,
    user: user.toSafeJSON(),
  });
});

exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() }).select(
    '+passwordHash'
  );
  if (!user) throw new ApiError(401, 'Invalid credentials');
  if (user.role === 'customer') throw new ApiError(403, 'Use customer OTP login.');
  if (!user.isActive) throw new ApiError(403, 'Account is deactivated.');

  const ok = await bcrypt.compare(password, user.passwordHash || '');
  if (!ok) throw new ApiError(401, 'Invalid credentials');

  const token = issueJwt(user);
  res.json({ token, user: user.toSafeJSON() });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

exports.updateMe = asyncHandler(async (req, res) => {
  const allowed = ['name', 'email', 'dob'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) req.user[key] = req.body[key];
  }
  if (req.user.email) req.user.email = String(req.user.email).toLowerCase();
  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
});

exports.changePassword = asyncHandler(async (req, res) => {
  if (req.user.role === 'customer') {
    throw new ApiError(400, 'Customers do not use passwords. Use OTP login.');
  }
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash');
  const ok = await bcrypt.compare(currentPassword, user.passwordHash || '');
  if (!ok) throw new ApiError(401, 'Current password is incorrect');
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: 'Password updated' });
});

exports.logout = asyncHandler(async (_req, res) => {
  // JWT is stateless; the client should discard the token.
  res.json({ message: 'Logged out' });
});
