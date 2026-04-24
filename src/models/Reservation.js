const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    date: { type: Date, required: true, index: true },
    time: { type: String, required: true, trim: true }, // "19:30"
    partySize: { type: Number, required: true, min: 1 },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
      index: true,
    },
    specialRequest: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reservation', reservationSchema);
