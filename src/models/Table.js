const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true, trim: true },
    label: { type: String, trim: true },
    capacity: { type: Number, default: 2, min: 1 },
    qrToken: { type: String, required: true, unique: true, index: true },
    qrUrl: { type: String },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved'],
      default: 'available',
      index: true,
    },
    currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Table', tableSchema);
