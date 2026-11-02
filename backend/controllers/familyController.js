const User = require('../models/User');
const Family = require('../models/Family');
const { asyncHandler, ApiError } = require('../utils/helpers');

exports.get = asyncHandler(async (req, res) => {
  const family = await Family.findById(req.user.familyId);
  const members = await User.find({ familyId: req.user.familyId }).sort({ role: 1, createdAt: 1 });
  res.json({ family, members });
});

exports.update = asyncHandler(async (req, res) => {
  const family = await Family.findByIdAndUpdate(req.user.familyId, { name: req.body.name }, { new: true, runValidators: true });
  res.json(family);
});

exports.addMember = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.findOne({ email: email.toLowerCase() })) throw new ApiError(409, 'An account with this email already exists');
  const user = await User.create({ name, email, password, role: 'Member', familyId: req.user.familyId });
  res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
});

exports.removeMember = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw new ApiError(400, 'You cannot remove yourself');
  const u = await User.findOneAndDelete({ _id: req.params.id, familyId: req.user.familyId, role: 'Member' });
  if (!u) throw new ApiError(404, 'Member not found');
  res.json({ message: 'Member removed' });
});
