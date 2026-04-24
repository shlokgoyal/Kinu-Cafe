const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Reservation = require('../models/Reservation');

exports.create = asyncHandler(async (req, res) => {
  const { name, phone, email, date, time, partySize, specialRequest } = req.body;
  const reservation = await Reservation.create({
    user: req.user._id,
    name: name || req.user.name,
    phone: phone || req.user.phone,
    email: email || req.user.email,
    date,
    time,
    partySize,
    specialRequest,
    status: 'pending',
  });
  res.status(201).json({ reservation });
});

exports.list = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ user: req.user._id })
    .sort({ date: -1 })
    .populate('table', 'number label');
  res.json({ reservations });
});

exports.get = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).populate('table', 'number label');
  if (!reservation) throw new ApiError(404, 'Reservation not found');
  res.json({ reservation });
});

exports.cancel = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!reservation) throw new ApiError(404, 'Reservation not found');
  if (['completed', 'cancelled'].includes(reservation.status)) {
    throw new ApiError(400, `Reservation already ${reservation.status}`);
  }
  reservation.status = 'cancelled';
  await reservation.save();
  res.json({ reservation });
});
