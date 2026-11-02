const mongoose = require('mongoose');

const familySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  currency: { type: String, default: 'INR' },
}, { timestamps: true });

module.exports = mongoose.model('Family', familySchema);
