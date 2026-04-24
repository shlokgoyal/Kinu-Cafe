const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const Category = require('../../models/Category');
const slugify = require('../../utils/slugify');

exports.create = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.name && !data.slug) data.slug = slugify(data.name);
  const category = await Category.create(data);
  res.status(201).json({ category });
});

exports.list = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ displayOrder: 1, name: 1 });
  res.json({ categories });
});

exports.get = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ category });
});

exports.update = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  const fields = ['name', 'slug', 'description', 'image', 'displayOrder', 'isActive'];
  for (const f of fields) if (req.body[f] !== undefined) category[f] = req.body[f];
  if (req.body.name && !req.body.slug) category.slug = slugify(req.body.name);
  await category.save();
  res.json({ category });
});

exports.remove = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ message: 'Category deleted' });
});
