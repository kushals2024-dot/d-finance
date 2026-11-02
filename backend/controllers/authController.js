const User = require('../models/User');
const Family = require('../models/Family');
const { asyncHandler, ApiError, signToken } = require('../utils/helpers');

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, familyId: u.familyId, phone: u.phone });

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, familyName } = req.body;
  if (await User.findOne({ email: email.toLowerCase() })) throw new ApiError(409, 'An account with this email already exists');
  const user = new User({ name, email, password, role: 'Admin' });
  const family = await Family.create({ name: familyName, adminId: user._id });
  user.familyId = family._id;
  await user.save();
  res.status(201).json({ token: signToken(user), user: publicUser(user), family });
});

exports.login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(req.body.password))) throw new ApiError(401, 'Incorrect email or password');
  const family = await Family.findById(user.familyId);
  res.json({ token: signToken(user), user: publicUser(user), family });
});

exports.me = asyncHandler(async (req, res) => {
  const family = await Family.findById(req.user.familyId);
  res.json({ user: publicUser(req.user), family });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (name) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  await req.user.save();
  res.json({ user: publicUser(req.user) });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(req.body.currentPassword))) throw new ApiError(400, 'Current password is incorrect');
  user.password = req.body.newPassword;
  await user.save();
  res.json({ message: 'Password updated' });
});
