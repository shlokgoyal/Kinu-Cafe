const asyncHandler = require('../../utils/asyncHandler');
const Order = require('../../models/Order');
const User = require('../../models/User');

function parseRange(req) {
  const now = new Date();
  const from = req.query.from ? new Date(req.query.from) : new Date(now.getTime() - 30 * 86400e3);
  const to = req.query.to ? new Date(req.query.to) : now;
  return { from, to };
}

exports.sales = asyncHandler(async (req, res) => {
  const { from, to } = parseRange(req);
  const groupBy = req.query.groupBy || 'day';

  const formatMap = {
    day: '%Y-%m-%d',
    week: '%G-W%V',
    month: '%Y-%m',
  };
  const format = formatMap[groupBy] || formatMap.day;

  const rows = await Order.aggregate([
    {
      $match: {
        billingStatus: 'paid',
        paidAt: { $gte: from, $lte: to },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format, date: '$paidAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ from, to, groupBy, rows });
});

exports.topItems = asyncHandler(async (req, res) => {
  const { from, to } = parseRange(req);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

  const rows = await Order.aggregate([
    { $match: { billingStatus: 'paid', paidAt: { $gte: from, $lte: to } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.menuItem',
        name: { $first: '$items.name' },
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: limit },
  ]);

  res.json({ from, to, items: rows });
});

exports.customers = asyncHandler(async (_req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [totalCustomers, newThisMonth, birthdayThisMonth, returningAgg] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: startOfMonth, $lt: endOfMonth } }),
    User.aggregate([
      { $match: { role: 'customer', dob: { $ne: null } } },
      {
        $project: {
          name: 1,
          phone: 1,
          email: 1,
          month: { $month: '$dob' },
        },
      },
      { $match: { month: now.getMonth() + 1 } },
    ]),
    Order.aggregate([
      { $match: { billingStatus: 'paid', user: { $ne: null } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: 'returning' },
    ]),
  ]);

  res.json({
    totalCustomers,
    newThisMonth,
    returning: returningAgg[0]?.returning || 0,
    birthdayThisMonth,
  });
});
