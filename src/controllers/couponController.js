const asyncHandler = require('../utils/asyncHandler');
const Coupon = require('../models/Coupon');
const couponService = require('../services/couponService');

exports.validate = asyncHandler(async (req, res) => {
  const { code, cartTotal } = req.body;
  const { coupon, amount } = await couponService.validateAndCompute({
    code,
    user: req.user,
    subtotal: Number(cartTotal),
  });
  res.json({
    coupon: {
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount,
    },
    discountAmount: amount,
  });
});

exports.listAvailable = asyncHandler(async (req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true,
    validFrom: { $lte: now },
    validTo: { $gte: now },
  }).select('code description discountType discountValue maxDiscount minOrderAmount validTo usagePerUser');

  // filter out coupons the user already maxed
  const filtered = [];
  for (const c of coupons) {
    if (c.usagePerUser != null) {
      const fresh = await Coupon.findById(c._id);
      const used = fresh.usedBy.filter((u) => String(u.user) === String(req.user._id)).length;
      if (used >= c.usagePerUser) continue;
    }
    filtered.push(c);
  }
  res.json({ coupons: filtered });
});
