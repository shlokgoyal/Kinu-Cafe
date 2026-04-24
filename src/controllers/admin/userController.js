const bcrypt = require('bcryptjs');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const User = require('../../models/User');

exports.list = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    const re = new RegExp(String(search).trim(), 'i');
    filter.$or = [{ name: re }, { email: re }, { phone: re }];
  }
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);
  res.json({ users: users.map((u) => u.toSafeJSON()), total, page: Number(page) });
});

exports.get = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ user: user.toSafeJSON() });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!['admin', 'staff'].includes(role)) {
    throw new ApiError(400, 'Only admin/staff users can be created here');
  }
  if (!email || !password) throw new ApiError(400, 'email and password are required');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: String(email).toLowerCase(),
    passwordHash,
    role,
  });
  res.status(201).json({ user: user.toSafeJSON() });
});

exports.update = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  const fields = ['name', 'role', 'isActive', 'dob'];
  for (const f of fields) if (req.body[f] !== undefined) user[f] = req.body[f];
  if (req.body.email) user.email = String(req.body.email).toLowerCase();
  if (req.body.password) user.passwordHash = await bcrypt.hash(req.body.password, 10);
  await user.save();
  res.json({ user: user.toSafeJSON() });
});

exports.remove = asyncHandler(async (req, res) => {
  if (String(req.user._id) === String(req.params.id)) {
    throw new ApiError(400, 'You cannot delete your own account');
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ message: 'User deleted' });
});
