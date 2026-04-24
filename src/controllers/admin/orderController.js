const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const Order = require('../../models/Order');
const User = require('../../models/User');
const MenuItem = require('../../models/MenuItem');
const Table = require('../../models/Table');
const billingService = require('../../services/billingService');
const couponService = require('../../services/couponService');

const STATUS_FLOW = ['placed', 'preparing', 'ready', 'served'];

exports.list = asyncHandler(async (req, res) => {
  const { status, billingStatus, tableId, from, to } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (billingStatus) filter.billingStatus = billingStatus;
  if (tableId) filter.table = tableId;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .populate('table', 'number label')
    .populate('user', 'name phone email');
  res.json({ orders });
});

exports.get = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('table', 'number label')
    .populate('user', 'name phone email dob loyaltyPoints');
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ order });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  if (status === 'cancelled') {
    if (order.billingStatus === 'paid') throw new ApiError(400, 'Paid order cannot be cancelled');
    order.status = 'cancelled';
  } else {
    if (!STATUS_FLOW.includes(status)) throw new ApiError(400, 'Invalid status');
    const currentIdx = STATUS_FLOW.indexOf(order.status);
    const nextIdx = STATUS_FLOW.indexOf(status);
    if (currentIdx === -1 || nextIdx < currentIdx) {
      throw new ApiError(400, `Cannot move from ${order.status} → ${status}`);
    }
    order.status = status;
  }

  await order.save();

  if (order.status === 'cancelled') {
    await Table.updateOne(
      { _id: order.table, currentOrder: order._id },
      { $set: { status: 'available', currentOrder: null } }
    );
  }

  res.json({ order });
});

exports.bill = asyncHandler(async (req, res) => {
  const { couponCode, redeemPoints } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.status === 'cancelled') throw new ApiError(400, 'Cannot bill a cancelled order');

  const user = order.user ? await User.findById(order.user) : null;

  await billingService.generateBill({ order, user, couponCode, redeemPoints });
  await order.save();

  res.json({ order });
});

exports.pay = asyncHandler(async (req, res) => {
  const { method } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.billingStatus !== 'billed') {
    throw new ApiError(400, 'Order must be billed before payment');
  }
  if (!['cash', 'card', 'upi'].includes(method)) {
    throw new ApiError(400, 'Invalid payment method');
  }

  order.billingStatus = 'paid';
  order.paymentMethod = method;
  order.paidAt = new Date();
  if (order.status === 'served') {
    // keep 'served'; billing status captures paid-state
  }

  // Side effects: loyalty earn/redeem, birthday flag, coupon usage, popularity, free table.
  if (order.user) {
    const user = await User.findById(order.user);
    if (user) {
      const redeemed = order.discounts?.loyalty?.pointsRedeemed || 0;
      user.loyaltyPoints = Math.max(0, user.loyaltyPoints - redeemed + (order.pointsEarned || 0));
      if (order.discounts?.birthday?.amount > 0) {
        user.birthdayDiscountUsedYear = new Date().getFullYear();
      }
      await user.save();
    }
  }

  if (order.discounts?.coupon?.code) {
    const Coupon = require('../../models/Coupon');
    const c = await Coupon.findOne({ code: order.discounts.coupon.code });
    if (c) await couponService.recordUsage(c, order.user ? { _id: order.user } : null, order._id);
  }

  // popularity score bump per item sold
  const bulk = order.items.map((i) => ({
    updateOne: {
      filter: { _id: i.menuItem },
      update: { $inc: { popularityScore: i.quantity } },
    },
  }));
  if (bulk.length > 0) await MenuItem.bulkWrite(bulk);

  // free the table
  await Table.updateOne(
    { _id: order.table, currentOrder: order._id },
    { $set: { status: 'available', currentOrder: null } }
  );

  await order.save();
  res.json({ order });
});

exports.cancel = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.billingStatus === 'paid') throw new ApiError(400, 'Cannot cancel a paid order');
  order.status = 'cancelled';
  await order.save();
  await Table.updateOne(
    { _id: order.table, currentOrder: order._id },
    { $set: { status: 'available', currentOrder: null } }
  );
  res.json({ order });
});
