const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/menu', require('./menu.routes'));
router.use('/tables', require('./table.routes'));
router.use('/cart', require('./cart.routes'));
router.use('/orders', require('./order.routes'));
router.use('/coupons', require('./coupon.routes'));
router.use('/reservations', require('./reservation.routes'));
router.use('/admin', require('./admin.routes'));

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

module.exports = router;
