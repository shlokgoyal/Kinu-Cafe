const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const recommendationService = require('../services/recommendationService');

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

async function hydrateCart(cart) {
  await cart.populate({
    path: 'items.menuItem',
    select: 'name price image isAvailable category',
    populate: { path: 'category', select: 'name slug' },
  });
  await cart.populate({ path: 'table', select: 'number label' });
  const subtotal = cart.items.reduce(
    (sum, i) => sum + i.priceAtAdd * i.quantity,
    0
  );
  return { cart, subtotal };
}

exports.getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const { subtotal } = await hydrateCart(cart);
  res.json({ cart, subtotal });
});

exports.addItem = asyncHandler(async (req, res) => {
  const { menuItemId, quantity = 1, notes, tableId } = req.body;
  const menuItem = await MenuItem.findById(menuItemId);
  if (!menuItem || !menuItem.isAvailable) {
    throw new ApiError(400, 'Menu item not available');
  }

  const cart = await getOrCreateCart(req.user._id);

  if (tableId) {
    const table = await Table.findById(tableId);
    if (!table || !table.isActive) throw new ApiError(400, 'Table not found');
    cart.table = table._id;
  }

  const existing = cart.items.find((i) => String(i.menuItem) === String(menuItemId));
  if (existing) {
    existing.quantity += Math.max(1, Number(quantity));
    if (notes !== undefined) existing.notes = notes;
  } else {
    cart.items.push({
      menuItem: menuItem._id,
      quantity: Math.max(1, Number(quantity)),
      priceAtAdd: menuItem.price,
      notes,
    });
  }
  await cart.save();
  const { subtotal } = await hydrateCart(cart);
  res.json({ cart, subtotal });
});

exports.updateItem = asyncHandler(async (req, res) => {
  const { menuItemId } = req.params;
  const { quantity, notes } = req.body;
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => String(i.menuItem) === String(menuItemId));
  if (!item) throw new ApiError(404, 'Cart item not found');
  if (quantity !== undefined) {
    const q = Number(quantity);
    if (q <= 0) {
      cart.items = cart.items.filter((i) => String(i.menuItem) !== String(menuItemId));
    } else {
      item.quantity = q;
    }
  }
  if (notes !== undefined) item.notes = notes;
  await cart.save();
  const { subtotal } = await hydrateCart(cart);
  res.json({ cart, subtotal });
});

exports.removeItem = asyncHandler(async (req, res) => {
  const { menuItemId } = req.params;
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((i) => String(i.menuItem) !== String(menuItemId));
  await cart.save();
  const { subtotal } = await hydrateCart(cart);
  res.json({ cart, subtotal });
});

exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  cart.table = null;
  await cart.save();
  res.json({ cart, subtotal: 0 });
});

exports.recommendations = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const ids = cart.items.map((i) => i.menuItem);
  const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);
  const items = await recommendationService.getRecommendations(ids, limit);
  res.json({ items });
});
