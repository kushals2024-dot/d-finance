const Budget = require('../models/Budget');
const { asyncHandler, ApiError, range } = require('../utils/helpers');
const { helpers } = require('../services/analytics');

exports.current = asyncHandler(async (req, res) => {
  const now = new Date();
  const year = Number(req.query.year) || now.getFullYear();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const { start, end } = range(year, month);
  const cats = await helpers.byCategory(req.user.familyId, start, end);
  const usage = await helpers.budgetUsage(req.user.familyId, year, month, cats);
  res.json({ year, month, budget: usage, categories: cats });
});

exports.list = asyncHandler(async (req, res) => {
  const items = await Budget.find({ familyId: req.user.familyId }).sort({ year: -1, month: -1 }).limit(24);
  res.json(items);
});

// Create or update the budget for a given month.
exports.upsert = asyncHandler(async (req, res) => {
  const { month, year, totalBudget, categoryLimits } = req.body;
  const limits = (categoryLimits || []).filter((c) => c.category && Number(c.limit) > 0).map((c) => ({ category: c.category, limit: Number(c.limit) }));
  const budget = await Budget.findOneAndUpdate(
    { familyId: req.user.familyId, month, year },
    { totalBudget, categoryLimits: limits },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  res.json(budget);
});

exports.remove = asyncHandler(async (req, res) => {
  const b = await Budget.findOneAndDelete({ _id: req.params.id, familyId: req.user.familyId });
  if (!b) throw new ApiError(404, 'Budget not found');
  res.json({ message: 'Budget deleted' });
});
