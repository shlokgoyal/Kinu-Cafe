const asyncHandler = require('../../utils/asyncHandler');
const Settings = require('../../models/Settings');

exports.get = asyncHandler(async (_req, res) => {
  const settings = await Settings.getSingleton();
  res.json({ settings });
});

exports.update = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  const fields = [
    'cafeName',
    'address',
    'contactEmail',
    'contactPhone',
    'openingHours',
    'taxRate',
    'birthdayDiscountPercent',
    'allowCouponStackingWithBirthday',
  ];
  for (const f of fields) if (req.body[f] !== undefined) settings[f] = req.body[f];
  if (req.body.loyalty && typeof req.body.loyalty === 'object') {
    Object.assign(settings.loyalty, req.body.loyalty);
  }
  await settings.save();
  res.json({ settings });
});
