const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, ApiError } = require('../utils/helpers');

exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new ApiError(401, 'Not authenticated. Please log in.');
  let decoded;
  try { decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET); }
  catch { throw new ApiError(401, 'Session expired. Please log in again.'); }
  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'User no longer exists.');
  req.user = user;
  next();
});

exports.adminOnly = (req, res, next) => {
  if (req.user.role !== 'Admin') return next(new ApiError(403, 'Only the family admin can do this.'));
  next();
};
