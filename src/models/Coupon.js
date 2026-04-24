const mongoose = require('mongoose');

const couponUsageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    usedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    discountType: { type: String, enum: ['percentage', 'flat'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, default: null, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },

    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    usagePerUser: { type: Number, default: 1 },

    validFrom: { type: Date, default: Date.now },
    validTo: { type: Date, required: true },
    isActive: { type: Boolean, default: true },

    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    applicableItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],

    usedBy: [couponUsageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
