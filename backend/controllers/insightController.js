const { asyncHandler } = require('../utils/helpers');
const analytics = require('../services/analytics');
const { PRIORITY_MAP, EXPENSE_CATEGORIES, INCOME_CATEGORIES } = require('../utils/priority');

const period = (req) => {
  const now = new Date();
  return [req.user.familyId, Number(req.query.year) || now.getFullYear(), Number(req.query.month) || now.getMonth() + 1];
};

exports.dashboard = asyncHandler(async (req, res) => res.json(await analytics.dashboard(...period(req))));
exports.analysis = asyncHandler(async (req, res) => res.json(await analytics.analysis(...period(req))));
exports.recommendations = asyncHandler(async (req, res) => res.json(await analytics.recommendations(...period(req))));
exports.meta = (req, res) => res.json({ expenseCategories: EXPENSE_CATEGORIES, incomeCategories: INCOME_CATEGORIES, priorityMap: PRIORITY_MAP });
