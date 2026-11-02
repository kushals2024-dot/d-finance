const mongoose = require('mongoose');
const { INCOME_CATEGORIES } = require('../utils/priority');

const incomeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
  source: { type: String, enum: INCOME_CATEGORIES, required: [true, 'Income source is required'] },
  amount: { type: Number, required: true, min: [1, 'Amount must be greater than 0'] },
  date: { type: Date, required: true, default: Date.now, index: true },
  description: { type: String, trim: true, maxlength: 300 },
}, { timestamps: true });

module.exports = mongoose.model('Income', incomeSchema);
