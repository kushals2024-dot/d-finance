// Maps each expense category to a priority level. Used automatically on save.
const PRIORITY_MAP = {
  'House Rent': 'High',
  'Electricity Bill': 'High',
  'Water Bill': 'High',
  'Groceries': 'High',
  'Education': 'High',
  'Medical': 'High',
  'EMI / Loan': 'High',
  'Transportation': 'Medium',
  'Internet / Mobile': 'Medium',
  'Household Maintenance': 'Medium',
  'Entertainment': 'Low',
  'Shopping': 'Low',
  'Dining Out': 'Low',
  'Subscriptions': 'Low',
  'Other Expenses': 'Low',
};

const EXPENSE_CATEGORIES = Object.keys(PRIORITY_MAP);
const INCOME_CATEGORIES = ['Salary', 'Business Income', 'Rental Income', 'Freelancing', 'Other Income'];
const PRIORITY_RANK = { High: 1, Medium: 2, Low: 3 };

const classify = (category) => PRIORITY_MAP[category] || 'Low';

module.exports = { PRIORITY_MAP, EXPENSE_CATEGORIES, INCOME_CATEGORIES, PRIORITY_RANK, classify };
