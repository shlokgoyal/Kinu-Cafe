const express = require('express');
const { body, param } = require('express-validator');

const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const validate = require('../middleware/validate');

const dashboard = require('../controllers/admin/dashboardController');
const users = require('../controllers/admin/userController');
const categories = require('../controllers/admin/categoryController');
const menu = require('../controllers/admin/menuController');
const tables = require('../controllers/admin/tableController');
const orders = require('../controllers/admin/orderController');
const coupons = require('../controllers/admin/couponController');
const reservations = require('../controllers/admin/reservationController');
const analytics = require('../controllers/admin/analyticsController');
const settings = require('../controllers/admin/settingsController');

const router = express.Router();

router.use(auth, requireRole('admin', 'staff'));

/* ---------- Dashboard ---------- */
router.get('/dashboard/stats', dashboard.stats);

/* ---------- Users (admin only) ---------- */
const adminOnly = requireRole('admin');
router.get('/users', adminOnly, users.list);
router.post(
  '/users',
  adminOnly,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 6 }),
    body('role').isIn(['admin', 'staff']),
    body('name').optional().isString().trim(),
  ],
  validate,
  users.create
);
router.get('/users/:id', adminOnly, [param('id').isMongoId()], validate, users.get);
router.patch('/users/:id', adminOnly, [param('id').isMongoId()], validate, users.update);
router.delete('/users/:id', adminOnly, [param('id').isMongoId()], validate, users.remove);

/* ---------- Categories ---------- */
router.post(
  '/categories',
  [body('name').isString().trim().notEmpty()],
  validate,
  categories.create
);
router.get('/categories', categories.list);
router.get('/categories/:id', [param('id').isMongoId()], validate, categories.get);
router.put('/categories/:id', [param('id').isMongoId()], validate, categories.update);
router.delete('/categories/:id', [param('id').isMongoId()], validate, categories.remove);

/* ---------- Menu items ---------- */
router.post(
  '/menu/items',
  [
    body('name').isString().trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('category').isMongoId(),
  ],
  validate,
  menu.create
);
router.get('/menu/items', menu.list);
router.get('/menu/items/:id', [param('id').isMongoId()], validate, menu.get);
router.put('/menu/items/:id', [param('id').isMongoId()], validate, menu.update);
router.patch(
  '/menu/items/:id/availability',
  [param('id').isMongoId()],
  validate,
  menu.toggleAvailability
);
router.delete('/menu/items/:id', [param('id').isMongoId()], validate, menu.remove);

/* ---------- Tables ---------- */
router.post(
  '/tables',
  [body('number').isString().trim().notEmpty(), body('capacity').optional().isInt({ min: 1 })],
  validate,
  tables.create
);
router.get('/tables', tables.list);
router.get('/tables/:id', [param('id').isMongoId()], validate, tables.get);
router.put('/tables/:id', [param('id').isMongoId()], validate, tables.update);
router.post(
  '/tables/:id/regenerate-qr',
  [param('id').isMongoId()],
  validate,
  tables.regenerateQr
);
router.delete('/tables/:id', [param('id').isMongoId()], validate, tables.remove);

/* ---------- Orders ---------- */
router.get('/orders', orders.list);
router.get('/orders/:id', [param('id').isMongoId()], validate, orders.get);
router.patch(
  '/orders/:id/status',
  [
    param('id').isMongoId(),
    body('status').isIn(['placed', 'preparing', 'ready', 'served', 'cancelled']),
  ],
  validate,
  orders.updateStatus
);
router.post(
  '/orders/:id/bill',
  [
    param('id').isMongoId(),
    body('couponCode').optional().isString().trim(),
    body('redeemPoints').optional().isInt({ min: 0 }),
  ],
  validate,
  orders.bill
);
router.post(
  '/orders/:id/pay',
  [param('id').isMongoId(), body('method').isIn(['cash', 'card', 'upi'])],
  validate,
  orders.pay
);
router.patch('/orders/:id/cancel', [param('id').isMongoId()], validate, orders.cancel);

/* ---------- Coupons ---------- */
router.post(
  '/coupons',
  [
    body('code').isString().trim().notEmpty(),
    body('discountType').isIn(['percentage', 'flat']),
    body('discountValue').isFloat({ min: 0 }),
    body('validTo').isISO8601().toDate(),
  ],
  validate,
  coupons.create
);
router.get('/coupons', coupons.list);
router.get('/coupons/:id', [param('id').isMongoId()], validate, coupons.get);
router.put('/coupons/:id', [param('id').isMongoId()], validate, coupons.update);
router.delete('/coupons/:id', [param('id').isMongoId()], validate, coupons.remove);

/* ---------- Reservations ---------- */
router.get('/reservations', reservations.list);
router.patch('/reservations/:id', [param('id').isMongoId()], validate, reservations.update);

/* ---------- Analytics ---------- */
router.get('/analytics/sales', analytics.sales);
router.get('/analytics/top-items', analytics.topItems);
router.get('/analytics/customers', analytics.customers);

/* ---------- Settings ---------- */
router.get('/settings', settings.get);
router.put('/settings', settings.update);

module.exports = router;
