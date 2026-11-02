const SavingsGoal = require('../models/SavingsGoal');
const SavingsContribution = require('../models/SavingsContribution');
const { asyncHandler, ApiError } = require('../utils/helpers');

const withProgress = async (familyId) => {
  const goals = await SavingsGoal.find({ familyId }).sort({ targetDate: 1 });
  const sums = await SavingsContribution.aggregate([{ $match: { familyId } }, { $group: { _id: '$goalId', saved: { $sum: '$amount' } } }]);
  return goals.map((g) => {
    const saved = sums.find((s) => String(s._id) === String(g._id))?.saved || 0;
    const monthsLeft = Math.max(0, (new Date(g.targetDate) - new Date()) / (1000 * 60 * 60 * 24 * 30.44));
    const remaining = Math.max(0, g.targetAmount - saved);
    return { ...g.toObject(), saved, remaining, percent: Math.min(100, Math.round((saved / g.targetAmount) * 100)),
      completed: saved >= g.targetAmount, monthlyNeeded: monthsLeft > 0 ? Math.ceil(remaining / monthsLeft) : remaining };
  });
};

const findGoal = async (req) => {
  const g = await SavingsGoal.findOne({ _id: req.params.id, familyId: req.user.familyId });
  if (!g) throw new ApiError(404, 'Goal not found');
  return g;
};

exports.list = asyncHandler(async (req, res) => res.json(await withProgress(req.user.familyId)));

exports.create = asyncHandler(async (req, res) => {
  const { name, type, targetAmount, targetDate } = req.body;
  const goal = await SavingsGoal.create({ name, type, targetAmount, targetDate, familyId: req.user.familyId, createdBy: req.user._id });
  res.status(201).json(goal);
});

exports.update = asyncHandler(async (req, res) => {
  const g = await findGoal(req);
  ['name', 'type', 'targetAmount', 'targetDate'].forEach((f) => { if (req.body[f] !== undefined) g[f] = req.body[f]; });
  await g.save();
  res.json(g);
});

exports.remove = asyncHandler(async (req, res) => {
  const g = await findGoal(req);
  await SavingsContribution.deleteMany({ goalId: g._id });
  await g.deleteOne();
  res.json({ message: 'Goal deleted' });
});

exports.addContribution = asyncHandler(async (req, res) => {
  const g = await findGoal(req);
  const c = await SavingsContribution.create({ goalId: g._id, familyId: req.user.familyId, userId: req.user._id,
    amount: req.body.amount, date: req.body.date || Date.now(), note: req.body.note });
  res.status(201).json(c);
});

exports.listContributions = asyncHandler(async (req, res) => {
  const g = await findGoal(req);
  const items = await SavingsContribution.find({ goalId: g._id }).sort({ date: -1 }).populate('userId', 'name');
  res.json(items);
});

exports.removeContribution = asyncHandler(async (req, res) => {
  const c = await SavingsContribution.findOne({ _id: req.params.cid, familyId: req.user.familyId });
  if (!c) throw new ApiError(404, 'Contribution not found');
  if (req.user.role !== 'Admin' && String(c.userId) !== String(req.user._id)) throw new ApiError(403, 'You can only remove your own contributions');
  await c.deleteOne();
  res.json({ message: 'Contribution removed' });
});
