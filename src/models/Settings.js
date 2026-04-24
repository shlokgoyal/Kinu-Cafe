const mongoose = require('mongoose');
const env = require('../config/env');

const loyaltySchema = new mongoose.Schema(
  {
    earnRatePerRupee: { type: Number, default: 0.1 },   // 0.1 pts per ₹1 spent
    redeemRate: { type: Number, default: 1 },           // 1 pt = ₹1
    maxRedeemPercent: { type: Number, default: 20 },    // up to 20% of subtotal
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: 'global', unique: true },
    cafeName: { type: String, default: "Kinu's Cafe" },
    address: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    openingHours: { type: String, default: '09:00 - 22:00' },

    taxRate: { type: Number, default: env.taxRate },
    birthdayDiscountPercent: { type: Number, default: env.birthdayDiscountPercent },
    allowCouponStackingWithBirthday: { type: Boolean, default: false },

    loyalty: { type: loyaltySchema, default: () => ({}) },
  },
  { timestamps: true }
);

settingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne({ singletonKey: 'global' });
  if (!doc) doc = await this.create({ singletonKey: 'global' });
  return doc;
};

module.exports = mongoose.model('Settings', settingsSchema);
