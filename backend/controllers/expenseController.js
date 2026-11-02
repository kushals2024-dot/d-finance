const Expense = require('../models/Expense');
const { asyncHandler } = require('../utils/helpers');
const { range, ApiError } = require('../utils/helpers');
const { PRIORITY_RANK } = require('../utils/priority');

const crud = require('./crudFactory')(Expense, {
  fields: ['title', 'amount', 'category', 'paymentMethod', 'date', 'description'],
  categoryField: 'category', searchFields: ['title', 'category', 'description'],
});

// Expenses for the month grouped High -> Medium -> Low so users know what to pay first.
const priorityView = asyncHandler(async (req, res) => {
  const { start, end } = range(req.query.year, req.query.month);
  const items = await Expense.find({ familyId: req.user.familyId, date: { $gte: start, $lt: end } }).sort({ amount: -1 }).populate('userId', 'name');
  const groups = ['High', 'Medium', 'Low'].map((priority) => {
    const list = items.filter((i) => i.priority === priority);
    return { priority, total: list.reduce((s, i) => s + i.amount, 0), count: list.length, items: list };
  });
  const grand = groups.reduce((s, g) => s + g.total, 0);
  groups.forEach((g) => { g.share = grand ? Math.round((g.total / grand) * 100) : 0; });
  res.json({ groups, total: grand });
});

module.exports = { ...crud, priorityView, PRIORITY_RANK, ApiError };
