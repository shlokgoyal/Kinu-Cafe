const express = require('express');
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/orderController');

const router = express.Router();

router.use(auth, requireRole('customer'));

router.post(
  '/',
  [
    body('tableId').optional().isMongoId(),
    body('notes').optional().isString(),
  ],
  validate,
  ctrl.place
);

router.get('/', ctrl.list);
router.get('/:id', [param('id').isMongoId()], validate, ctrl.get);
router.patch(
  '/:id/cancel',
  [param('id').isMongoId()],
  validate,
  ctrl.cancel
);

module.exports = router;
