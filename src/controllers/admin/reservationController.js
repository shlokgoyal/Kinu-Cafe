const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const Reservation = require('../../models/Reservation');

exports.list = asyncHandler(async (req, res) => {
  const { status, from, to } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  const reservations = await Reservation.find(filter)
    .sort({ date: 1, time: 1 })
    .populate('table', 'number label')
    .populate('user', 'name phone email');
  res.json({ reservations });
});

exports.update = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) throw new ApiError(404, 'Reservation not found');
  const fields = ['status', 'table', 'specialRequest', 'date', 'time', 'partySize'];
  for (const f of fields) if (req.body[f] !== undefined) reservation[f] = req.body[f];
  await reservation.save();
  res.json({ reservation });
});
