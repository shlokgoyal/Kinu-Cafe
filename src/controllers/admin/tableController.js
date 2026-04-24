const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const Table = require('../../models/Table');
const { generateQrToken, buildQrUrl } = require('../../utils/generateQrToken');

exports.create = asyncHandler(async (req, res) => {
  const qrToken = generateQrToken();
  const table = await Table.create({
    ...req.body,
    qrToken,
    qrUrl: buildQrUrl(qrToken),
  });
  res.status(201).json({ table });
});

exports.list = asyncHandler(async (_req, res) => {
  const tables = await Table.find().sort({ number: 1 });
  res.json({ tables });
});

exports.get = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id).populate('currentOrder');
  if (!table) throw new ApiError(404, 'Table not found');
  res.json({ table });
});

exports.update = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) throw new ApiError(404, 'Table not found');
  const fields = ['number', 'label', 'capacity', 'status', 'isActive'];
  for (const f of fields) if (req.body[f] !== undefined) table[f] = req.body[f];
  await table.save();
  res.json({ table });
});

exports.regenerateQr = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) throw new ApiError(404, 'Table not found');
  table.qrToken = generateQrToken();
  table.qrUrl = buildQrUrl(table.qrToken);
  await table.save();
  res.json({ table });
});

exports.remove = asyncHandler(async (req, res) => {
  const table = await Table.findByIdAndDelete(req.params.id);
  if (!table) throw new ApiError(404, 'Table not found');
  res.json({ message: 'Table deleted' });
});
