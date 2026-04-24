const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const Coupon = require('../../models/Coupon');

exports.create = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.code) data.code = String(data.code).toUpperCase();
  const coupon = await Coupon.create(data);
  res.status(201).json({ coupon });
});

exports.list = asyncHandler(async (req, res) => {
  const { isActive } = req.query;
  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
  res.json({ coupons });
});

exports.get = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id)
    .populate('applicableCategories', 'name slug')
    .populate('applicableItems', 'name slug');
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  res.json({ coupon });
});

exports.update = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  const fields = [
    'description',
    'discountType',
    'discountValue',
    'maxDiscount',
    'minOrderAmount',
    'usageLimit',
    'usagePerUser',
    'validFrom',
    'validTo',
    'isActive',
    'applicableCategories',
    'applicableItems',
  ];
  for (const f of fields) if (req.body[f] !== undefined) coupon[f] = req.body[f];
  if (req.body.code !== undefined) coupon.code = String(req.body.code).toUpperCase();
  await coupon.save();
  res.json({ coupon });
});

exports.remove = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  res.json({ message: 'Coupon deleted' });
});
