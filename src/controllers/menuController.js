const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');

exports.listCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
  res.json({ categories });
});

exports.listItems = asyncHandler(async (req, res) => {
  const { category, tag, search, isVeg } = req.query;
  const filter = { isAvailable: true };

  if (category) {
    // accept id or slug
    if (category.match(/^[0-9a-fA-F]{24}$/)) filter.category = category;
    else {
      const cat = await Category.findOne({ slug: category });
      if (!cat) return res.json({ items: [] });
      filter.category = cat._id;
    }
  }
  if (tag) filter.tags = String(tag).toLowerCase();
  if (isVeg !== undefined) filter.isVeg = isVeg === 'true';
  if (search) filter.$text = { $search: search };

  const items = await MenuItem.find(filter).populate('category', 'name slug').sort({ name: 1 });
  res.json({ items });
});

exports.getItemBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const query = slug.match(/^[0-9a-fA-F]{24}$/) ? { _id: slug } : { slug };
  const item = await MenuItem.findOne(query).populate('category', 'name slug');
  if (!item) throw new ApiError(404, 'Menu item not found');
  res.json({ item });
});

exports.popularItems = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const items = await MenuItem.find({ isAvailable: true })
    .sort({ popularityScore: -1, createdAt: -1 })
    .limit(limit)
    .populate('category', 'name slug');
  res.json({ items });
});
