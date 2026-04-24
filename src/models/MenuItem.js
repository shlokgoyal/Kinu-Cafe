const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    image: { type: String, trim: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    isVeg: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    preparationTimeMins: { type: Number, default: 10, min: 0 },
    popularityScore: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

menuItemSchema.index({ tags: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });

menuItemSchema.pre('validate', function (next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
