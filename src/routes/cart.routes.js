const express = require('express');
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/cartController');

const router = express.Router();

router.use(auth, requireRole('customer'));

router.get('/', ctrl.getCart);
router.get('/recommendations', ctrl.recommendations);

router.post(
  '/items',
  [
    body('menuItemId').isMongoId(),
    body('quantity').optional().isInt({ min: 1 }),
    body('tableId').optional().isMongoId(),
    body('notes').optional().isString(),
  ],
  validate,
  ctrl.addItem
);

router.put(
  '/items/:menuItemId',
  [
    param('menuItemId').isMongoId(),
    body('quantity').optional().isInt({ min: 0 }),
    body('notes').optional().isString(),
  ],
  validate,
  ctrl.updateItem
);

router.delete(
  '/items/:menuItemId',
  [param('menuItemId').isMongoId()],
  validate,
  ctrl.removeItem
);

router.delete('/', ctrl.clearCart);

module.exports = router;
