const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  totalBudget: { type: Number, required: true, min: [1, 'Budget must be greater than 0'] },
  categoryLimits: [{ category: String, limit: { type: Number, min: 0 }, _id: false }],
}, { timestamps: true });

budgetSchema.index({ familyId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
