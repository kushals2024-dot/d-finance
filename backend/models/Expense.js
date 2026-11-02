const mongoose = require('mongoose');
const { EXPENSE_CATEGORIES, classify } = require('../utils/priority');

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
  title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
  amount: { type: Number, required: true, min: [1, 'Amount must be greater than 0'] },
  category: { type: String, enum: EXPENSE_CATEGORIES, required: [true, 'Category is required'] },
  priority: { type: String, enum: ['High', 'Medium', 'Low'] },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other'], default: 'Cash' },
  date: { type: Date, required: true, default: Date.now, index: true },
  description: { type: String, trim: true, maxlength: 300 },
}, { timestamps: true });

// Priority is always derived from the category.
expenseSchema.pre('validate', function (next) {
  if (this.category) this.priority = classify(this.category);
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);
