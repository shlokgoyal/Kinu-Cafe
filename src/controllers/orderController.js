const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Order = require('../models/Order');
const generateOrderNumber = require('../utils/generateOrderNumber');

exports.place = asyncHandler(async (req, res) => {
  const { tableId: bodyTableId, notes } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) throw new ApiError(400, 'Cart is empty');

  const tableId = bodyTableId || cart.table;
  if (!tableId) throw new ApiError(400, 'A table is required (scan a table QR).');

  const table = await Table.findById(tableId);
  if (!table || !table.isActive) throw new ApiError(400, 'Table not found');

  const menuItemIds = cart.items.map((i) => i.menuItem);
  const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });
  const byId = new Map(menuItems.map((m) => [String(m._id), m]));

  const orderItems = [];
  let subtotal = 0;
  for (const ci of cart.items) {
    const mi = byId.get(String(ci.menuItem));
    if (!mi || !mi.isAvailable) {
      throw new ApiError(400, `Item no longer available: ${mi ? mi.name : ci.menuItem}`);
    }
    const line = {
      menuItem: mi._id,
      name: mi.name,
      price: mi.price,
      quantity: ci.quantity,
      notes: ci.notes,
    };
    subtotal += mi.price * ci.quantity;
    orderItems.push(line);
  }

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: req.user._id,
    table: table._id,
    items: orderItems,
    subtotal,
    notes,
    status: 'placed',
    billingStatus: 'unbilled',
    placedAt: new Date(),
  });

  // mark table occupied, link current order
  table.status = 'occupied';
  table.currentOrder = order._id;
  await table.save();

  // clear cart
  cart.items = [];
  cart.table = null;
  await cart.save();

  res.status(201).json({ order });
});

exports.list = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('table', 'number label');
  res.json({ orders });
});

exports.get = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate(
    'table',
    'number label'
  );
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ order });
});

exports.cancel = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.status !== 'placed') {
    throw new ApiError(400, 'Only freshly placed orders can be cancelled by the customer.');
  }
  order.status = 'cancelled';
  await order.save();

  // free the table if this was its current order
  await Table.updateOne(
    { _id: order.table, currentOrder: order._id },
    { $set: { status: 'available', currentOrder: null } }
  );

  res.json({ order });
});
