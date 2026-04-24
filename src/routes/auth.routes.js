const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/authController');

const router = express.Router();

const sendOtpLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 1,
  keyGenerator: (req) => `otp:${req.body?.phone || req.ip}`,
  message: { error: { message: 'Please wait before requesting another OTP.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const ipHourlyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests from this IP. Try later.' } },
});

router.post(
  '/customer/send-otp',
  ipHourlyLimiter,
  sendOtpLimiter,
  [body('phone').isString().trim().isLength({ min: 7, max: 15 })],
  validate,
  ctrl.sendCustomerOtp
);

router.post(
  '/customer/verify-otp',
  [
    body('phone').isString().trim().isLength({ min: 7, max: 15 }),
    body('otp').isString().trim().isLength({ min: 4, max: 8 }),
  ],
  validate,
  ctrl.verifyCustomerOtp
);

router.post(
  '/admin/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 4 }),
  ],
  validate,
  ctrl.adminLogin
);

router.get('/me', auth, ctrl.me);

router.put(
  '/me',
  auth,
  [
    body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('dob').optional().isISO8601().toDate(),
  ],
  validate,
  ctrl.updateMe
);

router.put(
  '/me/password',
  auth,
  [
    body('currentPassword').isString().isLength({ min: 4 }),
    body('newPassword').isString().isLength({ min: 6 }),
  ],
  validate,
  ctrl.changePassword
);

router.post('/logout', auth, ctrl.logout);

module.exports = router;
