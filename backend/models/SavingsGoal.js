const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: [true, 'Goal name is required'], trim: true, maxlength: 100 },
  type: { type: String, enum: ['Emergency Fund', "Children's Education", 'House Purchase', 'Vehicle Purchase', 'Family Vacation', 'Other'], default: 'Other' },
  targetAmount: { type: Number, required: true, min: [1, 'Target must be greater than 0'] },
  targetDate: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('SavingsGoal', goalSchema);
