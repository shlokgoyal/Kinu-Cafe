const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Table = require('../models/Table');

exports.getByQr = asyncHandler(async (req, res) => {
  const table = await Table.findOne({ qrToken: req.params.qrToken, isActive: true });
  if (!table) throw new ApiError(404, 'Table not found for this QR token');
  res.json({
    table: {
      _id: table._id,
      number: table.number,
      label: table.label,
      capacity: table.capacity,
      status: table.status,
    },
  });
});
