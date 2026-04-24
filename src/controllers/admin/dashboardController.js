const asyncHandler = require('../../utils/asyncHandler');
const Order = require('../../models/Order');
const Table = require('../../models/Table');
const Reservation = require('../../models/Reservation');

function startOfDay(d = new Date()) {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  return s;
}
function endOfDay(d = new Date()) {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
}

exports.stats = asyncHandler(async (_req, res) => {
  const today = startOfDay();
  const tomorrow = endOfDay();

  const [todaysOrders, revenueAgg, topItemsAgg, tables, pendingReservations] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: today, $lte: tomorrow } }),
    Order.aggregate([
      {
        $match: {
          billingStatus: 'paid',
          paidAt: { $gte: today, $lte: tomorrow },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
          avg: { $avg: '$totalAmount' },
        },
      },
    ]),
    Order.aggregate([
      { $match: { billingStatus: 'paid', paidAt: { $gte: today, $lte: tomorrow } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          name: { $first: '$items.name' },
          quantity: { $sum: '$items.quantity' },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]),
    Table.find({ isActive: true }),
    Reservation.countDocuments({ status: 'pending', date: { $gte: today } }),
  ]);

  const tableStats = tables.reduce(
    (acc, t) => {
      acc.total += 1;
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    },
    { total: 0 }
  );

  const revenue = revenueAgg[0]?.revenue || 0;
  const paidCount = revenueAgg[0]?.count || 0;
  const avgTicket = revenueAgg[0]?.avg ? Math.round(revenueAgg[0].avg * 100) / 100 : 0;

  res.json({
    today: {
      orders: todaysOrders,
      paidOrders: paidCount,
      revenue: Math.round(revenue * 100) / 100,
      avgTicket,
      topItems: topItemsAgg,
    },
    tables: tableStats,
    pendingReservations,
  });
});
