const ApiError = require('../utils/ApiError');
const Settings = require('../models/Settings');
const couponService = require('./couponService');
const loyaltyService = require('./loyaltyService');
const isBirthdayMonth = require('../utils/isBirthdayMonth');

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Produce a bill for an order.
 *  - Calculates coupon / birthday / loyalty discounts, tax and total.
 *  - Mutates `order` with the computed fields but does NOT save it.
 *  - Returns `{ order, coupon }` so the caller can persist usage on payment.
 */
async function generateBill({ order, user, couponCode, redeemPoints }) {
  if (order.billingStatus === 'paid') {
    throw new ApiError(400, 'Order already paid');
  }

  const settings = await Settings.getSingleton();

  // subtotal from items (authoritative — cart prices may be stale)
  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);

  let couponDiscount = { amount: 0 };
  let appliedCoupon = null;
  if (couponCode) {
    if (!user) throw new ApiError(400, 'Coupons require a linked customer');
    const result = await couponService.validateAndCompute({
      code: couponCode,
      user,
      subtotal,
      items: order.items.map((i) => ({
        menuItem: i.menuItem,
        category: null,
        price: i.price,
        quantity: i.quantity,
      })),
    });
    couponDiscount = { amount: result.amount };
    appliedCoupon = result.coupon;
  }

  let birthdayDiscount = { amount: 0 };
  const currentYear = new Date().getFullYear();
  const birthdayEligible =
    user &&
    user.dob &&
    isBirthdayMonth(user.dob) &&
    user.birthdayDiscountUsedYear !== currentYear &&
    (settings.allowCouponStackingWithBirthday || !appliedCoupon);

  if (birthdayEligible) {
    const percent = settings.birthdayDiscountPercent || 0;
    const amount = round2((subtotal * percent) / 100);
    birthdayDiscount = { percent, amount };
  }

  let loyaltyDiscount = { points: 0, amount: 0 };
  if (redeemPoints && Number(redeemPoints) > 0) {
    const r = loyaltyService.computeRedemption({
      points: redeemPoints,
      user,
      subtotal,
      settings,
    });
    loyaltyDiscount = { points: r.points, amount: r.amount };
  }

  const totalDiscount = round2(
    couponDiscount.amount + birthdayDiscount.amount + loyaltyDiscount.amount
  );
  const taxable = Math.max(0, round2(subtotal - totalDiscount));
  const taxAmount = round2(taxable * settings.taxRate);
  const total = round2(taxable + taxAmount);

  const pointsEarned = loyaltyService.computePointsEarned({ total, settings });

  order.subtotal = round2(subtotal);
  order.taxRate = settings.taxRate;
  order.taxAmount = taxAmount;
  order.totalAmount = total;
  order.pointsEarned = pointsEarned;
  order.discounts = {
    coupon: appliedCoupon
      ? { code: appliedCoupon.code, amount: round2(couponDiscount.amount) }
      : null,
    birthday: birthdayDiscount.amount > 0
      ? { percent: birthdayDiscount.percent, amount: round2(birthdayDiscount.amount) }
      : null,
    loyalty: loyaltyDiscount.amount > 0
      ? { pointsRedeemed: loyaltyDiscount.points, amount: round2(loyaltyDiscount.amount) }
      : null,
  };
  order.billingStatus = 'billed';
  order.billedAt = new Date();

  return { order, coupon: appliedCoupon, birthdayEligible };
}

module.exports = { generateBill };
