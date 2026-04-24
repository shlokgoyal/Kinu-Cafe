const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/couponController');

const router = express.Router();

router.use(auth, requireRole('customer'));

router.post(
  '/validate',
  [
    body('code').isString().trim().isLength({ min: 2 }),
    body('cartTotal').isFloat({ min: 0 }),
  ],
  validate,
  ctrl.validate
);

router.get('/available', ctrl.listAvailable);

module.exports = router;
