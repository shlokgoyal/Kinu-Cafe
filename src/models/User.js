const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    passwordHash: { type: String, select: false },
    role: {
      type: String,
      enum: ['customer', 'staff', 'admin'],
      default: 'customer',
      index: true,
    },
    dob: { type: Date },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    birthdayDiscountUsedYear: { type: Number, default: null },
    isPhoneVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('validate', function (next) {
  if (this.role === 'customer') {
    if (!this.phone) return next(new Error('phone is required for customer users'));
  } else {
    if (!this.email) return next(new Error('email is required for admin/staff users'));
    if (!this.passwordHash) return next(new Error('passwordHash is required for admin/staff users'));
  }
  next();
});

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject({ versionKey: false });
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
