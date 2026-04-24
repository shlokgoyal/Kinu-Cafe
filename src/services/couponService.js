const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');

/**
 * Validate a coupon for a user + items + subtotal.
 * Throws ApiError on failure. Returns `{ coupon, amount }` on success.
 *
 *  - `items` is optional; only needed if you want applicableCategories/Items to be enforced.
 *    Each item: `{ menuItem, category, price, quantity }`.
 */
async function validateAndCompute({ code, user, subtotal, items = [] }) {
  if (!code) throw new ApiError(400, 'Coupon code required');
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase() });
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  if (!coupon.isActive) throw new ApiError(400, 'Coupon is inactive');

  const now = new Date();
  if (coupon.validFrom && coupon.validFrom > now) {
    throw new ApiError(400, 'Coupon is not yet valid');
  }
  if (coupon.validTo && coupon.validTo < now) {
    throw new ApiError(400, 'Coupon has expired');
  }
  if (subtotal < (coupon.minOrderAmount || 0)) {
    throw new ApiError(400, `Minimum order amount ₹${coupon.minOrderAmount} not met`);
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, 'Coupon usage limit reached');
  }
  if (user && coupon.usagePerUser != null) {
    const byUser = coupon.usedBy.filter((u) => String(u.user) === String(user._id)).length;
    if (byUser >= coupon.usagePerUser) {
      throw new ApiError(400, 'You have already used this coupon');
    }
  }

  // Scope: applicableCategories / applicableItems
  let applicableSubtotal = subtotal;
  if (
    (coupon.applicableCategories && coupon.applicableCategories.length > 0) ||
    (coupon.applicableItems && coupon.applicableItems.length > 0)
  ) {
    if (!items || items.length === 0) {
      throw new ApiError(400, 'Cannot validate a scoped coupon without cart items');
    }
    const okCats = new Set((coupon.applicableCategories || []).map(String));
    const okItems = new Set((coupon.applicableItems || []).map(String));
    applicableSubtotal = items.reduce((sum, it) => {
      const catId = it.category ? String(it.category) : null;
      const itemId = String(it.menuItem);
      const matches =
        (okCats.size > 0 && catId && okCats.has(catId)) ||
        (okItems.size > 0 && okItems.has(itemId));
      return matches ? sum + it.price * it.quantity : sum;
    }, 0);
    if (applicableSubtotal <= 0) {
      throw new ApiError(400, 'Coupon not applicable to any item in cart');
    }
  }

  let amount =
    coupon.discountType === 'percentage'
      ? (applicableSubtotal * coupon.discountValue) / 100
      : coupon.discountValue;

  if (coupon.maxDiscount != null) amount = Math.min(amount, coupon.maxDiscount);
  amount = Math.min(amount, applicableSubtotal);
  amount = Math.round(amount * 100) / 100;

  return { coupon, amount };
}

async function recordUsage(coupon, user, orderId) {
  coupon.usedCount = (coupon.usedCount || 0) + 1;
  coupon.usedBy.push({ user: user ? user._id : null, orderId, usedAt: new Date() });
  await coupon.save();
}

module.exports = { validateAndCompute, recordUsage };
