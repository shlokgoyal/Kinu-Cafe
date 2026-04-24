const mongoose = require('mongoose');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

/**
 * Co-purchase + category hybrid recommendations.
 *
 *  1. Co-purchase — find items frequently ordered alongside any of the cart items
 *     (based on historical billed/paid orders). Excludes cart items themselves.
 *  2. Category fallback — if fewer than `limit` results, fill with popular items
 *     sharing the same categories as cart items.
 *  3. Cold-start — if cart is empty, return globally popular items.
 */
async function getRecommendations(cartItemIds = [], limit = 5) {
  const ids = (cartItemIds || [])
    .filter(Boolean)
    .map((id) => new mongoose.Types.ObjectId(id));

  if (ids.length === 0) return globalPopular(limit);

  const coPurchased = await coPurchase(ids, limit);
  if (coPurchased.length >= limit) return coPurchased.slice(0, limit);

  const excludeIds = new Set([
    ...ids.map(String),
    ...coPurchased.map((i) => String(i._id)),
  ]);
  const fallback = await categoryFallback(ids, excludeIds, limit - coPurchased.length);
  const merged = [...coPurchased, ...fallback];

  if (merged.length >= limit) return merged.slice(0, limit);

  // final fill with global popular
  const excludeAll = new Set([...excludeIds, ...merged.map((i) => String(i._id))]);
  const global = await globalPopular(limit - merged.length, excludeAll);
  return [...merged, ...global].slice(0, limit);
}

async function coPurchase(ids, limit) {
  const agg = await Order.aggregate([
    {
      $match: {
        billingStatus: { $in: ['billed', 'paid'] },
        'items.menuItem': { $in: ids },
      },
    },
    { $unwind: '$items' },
    { $match: { 'items.menuItem': { $nin: ids } } },
    {
      $group: {
        _id: '$items.menuItem',
        count: { $sum: '$items.quantity' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);

  if (agg.length === 0) return [];

  const byId = new Map(agg.map((row) => [String(row._id), row.count]));
  const items = await MenuItem.find({
    _id: { $in: agg.map((r) => r._id) },
    isAvailable: true,
  }).populate('category', 'name slug');

  return items
    .map((item) => ({
      ...item.toObject(),
      recommendationReason: 'frequently_bought_together',
      coPurchaseCount: byId.get(String(item._id)) || 0,
    }))
    .sort((a, b) => b.coPurchaseCount - a.coPurchaseCount);
}

async function categoryFallback(cartItemIds, excludeIds, limit) {
  if (limit <= 0) return [];
  const cartItems = await MenuItem.find({ _id: { $in: cartItemIds } }).select('category');
  const categories = [...new Set(cartItems.map((i) => String(i.category)))];
  if (categories.length === 0) return [];

  const items = await MenuItem.find({
    category: { $in: categories },
    _id: { $nin: [...excludeIds].map((id) => new mongoose.Types.ObjectId(id)) },
    isAvailable: true,
  })
    .sort({ popularityScore: -1, createdAt: -1 })
    .limit(limit)
    .populate('category', 'name slug');

  return items.map((item) => ({
    ...item.toObject(),
    recommendationReason: 'popular_in_category',
  }));
}

async function globalPopular(limit, excludeIds = new Set()) {
  const filter = { isAvailable: true };
  if (excludeIds.size > 0) {
    filter._id = {
      $nin: [...excludeIds].map((id) => new mongoose.Types.ObjectId(id)),
    };
  }
  const items = await MenuItem.find(filter)
    .sort({ popularityScore: -1, createdAt: -1 })
    .limit(limit)
    .populate('category', 'name slug');
  return items.map((item) => ({
    ...item.toObject(),
    recommendationReason: 'popular',
  }));
}

module.exports = { getRecommendations };
