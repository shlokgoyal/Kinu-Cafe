const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const discountsSchema = new mongoose.Schema(
  {
    coupon: {
      code: String,
      amount: { type: Number, default: 0 },
    },
    birthday: {
      percent: Number,
      amount: { type: Number, default: 0 },
    },
    loyalty: {
      pointsRedeemed: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true, index: true },
    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },

    subtotal: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },

    discounts: { type: discountsSchema, default: () => ({}) },

    totalAmount: { type: Number, default: 0 },
    pointsEarned: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['placed', 'preparing', 'ready', 'served', 'cancelled'],
      default: 'placed',
      index: true,
    },
    billingStatus: {
      type: String,
      enum: ['unbilled', 'billed', 'paid'],
      default: 'unbilled',
      index: true,
    },
    paymentMethod: { type: String, enum: ['cash', 'card', 'upi', null], default: null },

    notes: { type: String, trim: true },

    placedAt: { type: Date, default: Date.now },
    billedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
