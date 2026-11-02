const jwt = require('jsonwebtoken');

const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Wraps async controllers so errors reach the error middleware.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// Returns { start, end } for a month (1-12) in a year. Month = 0 means whole year.
const range = (year, month) => {
  const y = Number(year) || new Date().getFullYear();
  const m = Number(month);
  if (!m) return { start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1) };
  return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
};

const prevMonth = (year, month) => (month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 });

module.exports = { signToken, asyncHandler, ApiError, range, prevMonth };
