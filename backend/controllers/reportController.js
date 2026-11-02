const PDFDocument = require('pdfkit');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const SavingsContribution = require('../models/SavingsContribution');
const Family = require('../models/Family');
const { asyncHandler, range } = require('../utils/helpers');
const analytics = require('../services/analytics');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const build = async (req) => {
  const familyId = req.user.familyId;
  const now = new Date();
  const year = Number(req.query.year) || now.getFullYear();
  const month = req.query.month === undefined ? now.getMonth() + 1 : Number(req.query.month); // 0 = whole year
  const { start, end } = range(year, month);
  const { sum, byCategory, byPriority } = analytics.helpers;

  const [incomeTotal, expenseTotal, savingsTotal, categories, priorities, incomeBySource, contributions, family] = await Promise.all([
    sum(Income, familyId, start, end), sum(Expense, familyId, start, end), sum(SavingsContribution, familyId, start, end),
    byCategory(familyId, start, end), byPriority(familyId, start, end),
    Income.aggregate([{ $match: { familyId, date: { $gte: start, $lt: end } } }, { $group: { _id: '$source', total: { $sum: '$amount' }, count: { $sum: 1 } } }, { $sort: { total: -1 } }]),
    SavingsContribution.find({ familyId, date: { $gte: start, $lt: end } }).populate('goalId', 'name'),
    Family.findById(familyId),
  ]);

  // Budget utilization: one month -> that budget; whole year -> every month's budget.
  const Budget = require('../models/Budget');
  const budgets = await Budget.find({ familyId, year, ...(month ? { month } : {}) }).sort({ month: 1 });
  const budgetRows = await Promise.all(budgets.map(async (b) => {
    const r = range(year, b.month);
    const spent = await sum(Expense, familyId, r.start, r.end);
    return { period: `${MONTHS[b.month - 1]} ${year}`, budget: b.totalBudget, spent, utilization: Math.round((spent / b.totalBudget) * 100) };
  }));

  return {
    title: month ? `${MONTHS[month - 1]} ${year}` : `Year ${year}`, family: family?.name, year, month,
    summary: { income: incomeTotal, expenses: expenseTotal, balance: incomeTotal - expenseTotal, savings: savingsTotal },
    incomeBySource: incomeBySource.map((r) => ({ source: r._id, total: r.total, count: r.count })),
    categories, priorities, budgets: budgetRows,
    savings: contributions.map((c) => ({ goal: c.goalId?.name || 'Deleted goal', amount: c.amount, date: c.date })),
  };
};

const inr = (n) => `Rs. ${Number(n).toLocaleString('en-IN')}`;

exports.json = asyncHandler(async (req, res) => res.json(await build(req)));

exports.csv = asyncHandler(async (req, res) => {
  const r = await build(req);
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [
    ['D Finance Report', r.title], ['Family', r.family], [],
    ['SUMMARY'], ['Total Income', r.summary.income], ['Total Expenses', r.summary.expenses], ['Balance', r.summary.balance], ['Savings Contributed', r.summary.savings], [],
    ['INCOME REPORT'], ['Source', 'Amount', 'Entries'], ...r.incomeBySource.map((x) => [x.source, x.total, x.count]), [],
    ['EXPENSE REPORT (BY CATEGORY)'], ['Category', 'Priority', 'Amount', 'Entries'], ...r.categories.map((x) => [x.category, x.priority, x.total, x.count]), [],
    ['PRIORITY REPORT'], ['Priority', 'Amount', 'Entries'], ...r.priorities.map((x) => [x.priority, x.total, x.count]), [],
    ['SAVINGS REPORT'], ['Goal', 'Amount', 'Date'], ...r.savings.map((x) => [x.goal, x.amount, new Date(x.date).toISOString().slice(0, 10)]), [],
    ['BUDGET UTILIZATION'], ['Period', 'Budget', 'Spent', 'Utilization %'], ...r.budgets.map((x) => [x.period, x.budget, x.spent, x.utilization]),
  ];
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="d-finance-${r.title.replace(/\s+/g, '-')}.csv"`);
  res.send(rows.map((row) => row.map(esc).join(',')).join('\n'));
});

exports.pdf = asyncHandler(async (req, res) => {
  const r = await build(req);
  const doc = new PDFDocument({ margin: 48, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="d-finance-${r.title.replace(/\s+/g, '-')}.pdf"`);
  doc.pipe(res);

  const section = (title) => { doc.moveDown(1).fontSize(13).fillColor('#14213D').font('Helvetica-Bold').text(title).moveDown(0.3); doc.font('Helvetica').fontSize(10).fillColor('#222'); };
  const row = (a, b, c) => {
    const y = doc.y;
    doc.text(String(a), 48, y, { width: 220 });
    doc.text(String(b), 270, y, { width: 130, align: 'right' });
    if (c !== undefined) doc.text(String(c), 410, y, { width: 130, align: 'right' });
    doc.moveDown(0.3);
  };

  doc.rect(0, 0, 595, 70).fill('#14213D');
  doc.fillColor('#fff').fontSize(20).font('Helvetica-Bold').text('D FINANCE', 48, 22);
  doc.fontSize(10).font('Helvetica').text(`${r.family} | Financial report: ${r.title}`, 48, 46);
  doc.y = 90;

  section('Summary');
  row('Total income', inr(r.summary.income)); row('Total expenses', inr(r.summary.expenses));
  row('Balance', inr(r.summary.balance)); row('Savings contributed', inr(r.summary.savings));
  section('Income report'); r.incomeBySource.forEach((x) => row(x.source, inr(x.total), `${x.count} entries`));
  if (!r.incomeBySource.length) doc.text('No income recorded.');
  section('Expense report (by category)'); r.categories.forEach((x) => row(`${x.category} (${x.priority})`, inr(x.total), `${x.count} entries`));
  if (!r.categories.length) doc.text('No expenses recorded.');
  section('Priority-wise expenses'); r.priorities.forEach((x) => row(`${x.priority} priority`, inr(x.total), `${x.count} entries`));
  section('Savings report'); r.savings.forEach((x) => row(x.goal, inr(x.amount), new Date(x.date).toLocaleDateString('en-IN')));
  if (!r.savings.length) doc.text('No savings contributions in this period.');
  section('Budget utilization'); r.budgets.forEach((x) => row(x.period, `${inr(x.spent)} / ${inr(x.budget)}`, `${x.utilization}%`));
  if (!r.budgets.length) doc.text('No budget set for this period.');
  doc.end();
});
