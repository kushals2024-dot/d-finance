const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
  goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'SavingsGoal', required: true, index: true },
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: [1, 'Amount must be greater than 0'] },
  date: { type: Date, default: Date.now, index: true },
  note: { type: String, trim: true, maxlength: 200 },
}, { timestamps: true });

module.exports = mongoose.model('SavingsContribution', contributionSchema);
