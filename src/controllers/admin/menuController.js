const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const MenuItem = require('../../models/MenuItem');
const slugify = require('../../utils/slugify');

exports.create = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.name && !data.slug) data.slug = slugify(data.name);
  const item = await MenuItem.create(data);
  res.status(201).json({ item });
});

exports.list = asyncHandler(async (req, res) => {
  const { category, search, isAvailable } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };
  if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
  const items = await MenuItem.find(filter).populate('category', 'name slug').sort({ name: 1 });
  res.json({ items });
});

exports.get = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id).populate('category', 'name slug');
  if (!item) throw new ApiError(404, 'Menu item not found');
  res.json({ item });
});

exports.update = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Menu item not found');
  const fields = [
    'name',
    'slug',
    'description',
    'price',
    'category',
    'image',
    'tags',
    'isVeg',
    'isAvailable',
    'preparationTimeMins',
  ];
  for (const f of fields) if (req.body[f] !== undefined) item[f] = req.body[f];
  if (req.body.name && !req.body.slug) item.slug = slugify(req.body.name);
  await item.save();
  res.json({ item });
});

exports.toggleAvailability = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Menu item not found');
  item.isAvailable =
    req.body.isAvailable !== undefined ? Boolean(req.body.isAvailable) : !item.isAvailable;
  await item.save();
  res.json({ item });
});

exports.remove = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, 'Menu item not found');
  res.json({ message: 'Menu item deleted' });
});
