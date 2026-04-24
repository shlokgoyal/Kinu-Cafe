const express = require('express');
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/reservationController');

const router = express.Router();

router.use(auth, requireRole('customer'));

router.post(
  '/',
  [
    body('name').optional().isString().trim(),
    body('phone').optional().isString().trim(),
    body('email').optional().isEmail(),
    body('date').isISO8601().toDate(),
    body('time').isString().trim().isLength({ min: 3, max: 8 }),
    body('partySize').isInt({ min: 1, max: 50 }),
    body('specialRequest').optional().isString(),
  ],
  validate,
  ctrl.create
);

router.get('/', ctrl.list);
router.get('/:id', [param('id').isMongoId()], validate, ctrl.get);
router.patch('/:id/cancel', [param('id').isMongoId()], validate, ctrl.cancel);

module.exports = router;
