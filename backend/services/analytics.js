const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const SavingsContribution = require('../models/SavingsContribution');
const { range, prevMonth } = require('../utils/helpers');
const { PRIORITY_MAP } = require('../utils/priority');

const sum = async (Model, familyId, start, end, field = 'amount', extra = {}) => {
  const [r] = await Model.aggregate([
    { $match: { familyId, date: { $gte: start, $lt: end }, ...extra } },
    { $group: { _id: null, total: { $sum: `$${field}` } } },
  ]);
  return r ? r.total : 0;
};

const byCategory = (familyId, start, end) =>
  Expense.aggregate([
    { $match: { familyId, date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 }, priority: { $first: '$priority' } } },
    { $sort: { total: -1 } },
    { $project: { _id: 0, category: '$_id', total: 1, count: 1, priority: 1 } },
  ]);

const byPriority = async (familyId, start, end) => {
  const rows = await Expense.aggregate([
    { $match: { familyId, date: { $gte: start, $lt: end } } },
    { $group: { _id: '$priority', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  return ['High', 'Medium', 'Low'].map((p) => {
    const r = rows.find((x) => x._id === p);
    return { priority: p, total: r ? r.total : 0, count: r ? r.count : 0 };
  });
};

// Last N months (oldest first) of income, expense, savings contributions.
const monthlySeries = async (familyId, year, month, n = 6) => {
  const out = [];
  let y = year, m = month;
  for (let i = 0; i < n; i++) { out.unshift({ year: y, month: m }); ({ year: y, month: m } = prevMonth(y, m)); }
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return Promise.all(out.map(async ({ year: yy, month: mm }) => {
    const { start, end } = range(yy, mm);
    const [income, expense, savings] = await Promise.all([
      sum(Income, familyId, start, end),
      sum(Expense, familyId, start, end),
      sum(SavingsContribution, familyId, start, end),
    ]);
    return { label: `${labels[mm - 1]} ${String(yy).slice(2)}`, year: yy, month: mm, income, expense, savings };
  }));
};

const budgetUsage = async (familyId, year, month, catRows) => {
  const budget = await Budget.findOne({ familyId, year, month });
  if (!budget) return null;
  const spent = catRows.reduce((s, c) => s + c.total, 0);
  const categories = budget.categoryLimits.filter((c) => c.limit > 0).map((c) => {
    const row = catRows.find((r) => r.category === c.category);
    const cs = row ? row.total : 0;
    return { category: c.category, limit: c.limit, spent: cs, utilization: Math.round((cs / c.limit) * 100), exceeded: cs > c.limit };
  });
  return {
    _id: budget._id, month, year, totalBudget: budget.totalBudget, spent,
    remaining: budget.totalBudget - spent,
    utilization: Math.round((spent / budget.totalBudget) * 100),
    exceeded: spent > budget.totalBudget,
    categories, categoryLimits: budget.categoryLimits,
  };
};

exports.dashboard = async (familyId, year, month) => {
  const { start, end } = range(year, month);
  const [totalIncome, categories, priorities, series, savedAgg, incomes, expenses] = await Promise.all([
    sum(Income, familyId, start, end),
    byCategory(familyId, start, end),
    byPriority(familyId, start, end),
    monthlySeries(familyId, year, month),
    SavingsContribution.aggregate([{ $match: { familyId } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Income.find({ familyId }).sort({ date: -1 }).limit(6).populate('userId', 'name'),
    Expense.find({ familyId }).sort({ date: -1 }).limit(6).populate('userId', 'name'),
  ]);
  const totalExpenses = categories.reduce((s, c) => s + c.total, 0);
  const budget = await budgetUsage(familyId, year, month, categories);
  const recent = [
    ...incomes.map((i) => ({ id: i._id, type: 'income', title: i.source, amount: i.amount, date: i.date, category: i.source, by: i.userId?.name })),
    ...expenses.map((e) => ({ id: e._id, type: 'expense', title: e.title, amount: e.amount, date: e.date, category: e.category, priority: e.priority, by: e.userId?.name })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

  return {
    year, month, totalIncome, totalExpenses,
    remainingBalance: totalIncome - totalExpenses,
    totalSavings: savedAgg[0] ? savedAgg[0].total : 0,
    monthlySavings: series[series.length - 1].savings,
    budget, categories, priorities, series, recent,
  };
};

exports.analysis = async (familyId, year, month) => {
  const { start, end } = range(year, month);
  const prev = prevMonth(year, month);
  const { start: ps, end: pe } = range(prev.year, prev.month);
  const [cur, prv, series, budget] = await Promise.all([
    byCategory(familyId, start, end), byCategory(familyId, ps, pe),
    monthlySeries(familyId, year, month, 6),
    Budget.findOne({ familyId, year, month }),
  ]);
  const income = await sum(Income, familyId, start, end);
  const curTotal = cur.reduce((s, c) => s + c.total, 0);
  const prevTotal = prv.reduce((s, c) => s + c.total, 0);
  const changePct = prevTotal ? Math.round(((curTotal - prevTotal) / prevTotal) * 100) : null;

  const comparison = [...new Set([...cur.map((c) => c.category), ...prv.map((c) => c.category)])].map((category) => {
    const a = cur.find((c) => c.category === category)?.total || 0;
    const b = prv.find((c) => c.category === category)?.total || 0;
    return { category, current: a, previous: b, change: a - b };
  }).sort((x, y) => y.current - x.current);

  const lowPriority = cur.filter((c) => c.priority === 'Low');
  const unnecessaryTotal = lowPriority.reduce((s, c) => s + c.total, 0);

  const overspending = [];
  if (income > 0 && curTotal > income) overspending.push({ type: 'income', message: `Expenses (₹${curTotal.toLocaleString('en-IN')}) are higher than income (₹${income.toLocaleString('en-IN')}).` });
  if (budget && curTotal > budget.totalBudget) overspending.push({ type: 'budget', message: `Total spending is ₹${(curTotal - budget.totalBudget).toLocaleString('en-IN')} over the monthly budget.` });
  if (budget) budget.categoryLimits.forEach((l) => {
    const spent = cur.find((c) => c.category === l.category)?.total || 0;
    if (l.limit > 0 && spent > l.limit) overspending.push({ type: 'category', category: l.category, message: `${l.category} is ₹${(spent - l.limit).toLocaleString('en-IN')} over its limit.` });
  });

  const active = series.filter((s) => s.expense > 0);
  const avgMonthlyExpense = active.length ? Math.round(active.reduce((s, m) => s + m.expense, 0) / active.length) : 0;

  return {
    highestCategory: cur[0] || null,
    currentTotal: curTotal, previousTotal: prevTotal, changePct, comparison,
    unnecessary: { total: unnecessaryTotal, share: curTotal ? Math.round((unnecessaryTotal / curTotal) * 100) : 0, items: lowPriority },
    overspending, avgMonthlyExpense, trend: series,
  };
};

// Share of each low-priority category we suggest trimming.
const CUT_RATE = { 'Dining Out': 0.3, Shopping: 0.3, Entertainment: 0.25, Subscriptions: 0.25, 'Other Expenses': 0.2 };

exports.recommendations = async (familyId, year, month) => {
  const { start, end } = range(year, month);
  const [income, cats, budget] = await Promise.all([
    sum(Income, familyId, start, end), byCategory(familyId, start, end), Budget.findOne({ familyId, year, month }),
  ]);
  const expenses = cats.reduce((s, c) => s + c.total, 0);
  const remaining = income - expenses;

  const reductions = cats.filter((c) => PRIORITY_MAP[c.category] === 'Low').map((c) => {
    let cut = c.total * (CUT_RATE[c.category] || 0.2);
    const limit = budget?.categoryLimits.find((l) => l.category === c.category)?.limit;
    if (limit > 0 && c.total > limit) cut = Math.max(cut, c.total - limit); // bring it back to its limit
    cut = Math.min(c.total, Math.floor(cut / 50) * 50); // round down to ₹50
    return { category: c.category, current: c.total, reduceBy: cut, newAmount: c.total - cut,
      tip: `Spent ₹${c.total.toLocaleString('en-IN')} on ${c.category} this month. Trimming ₹${cut.toLocaleString('en-IN')} is realistic.` };
  }).filter((r) => r.reduceBy > 0).sort((a, b) => b.reduceBy - a.reduceBy);

  const potential = reductions.reduce((s, r) => s + r.reduceBy, 0);
  const currentSavings = Math.max(remaining, 0);
  const suggested = currentSavings + potential;
  const targetRate = 20; // common rule of thumb: save at least 20% of income
  const targetAmount = Math.round((income * targetRate) / 100);

  const notes = [];
  if (income === 0) notes.push('Add this month\'s income to get savings recommendations.');
  else if (remaining < 0) notes.push(`You are spending ₹${Math.abs(remaining).toLocaleString('en-IN')} more than you earn. Cut low-priority spending first.`);
  else if (suggested >= targetAmount) notes.push(`Suggested savings meet the ${targetRate}% target (₹${targetAmount.toLocaleString('en-IN')}).`);
  else notes.push(`To reach the ${targetRate}% target (₹${targetAmount.toLocaleString('en-IN')}), you would need ₹${(targetAmount - suggested).toLocaleString('en-IN')} more. Review medium-priority bills too.`);
  if (income > 0 && !reductions.length) notes.push('No low-priority spending found this month. Nice discipline.');

  return { month, year, income, expenses, remaining, reductions, potentialSavings: potential, suggestedSavings: suggested, targetRate, targetAmount, notes };
};

exports.helpers = { sum, byCategory, byPriority, monthlySeries, budgetUsage };
