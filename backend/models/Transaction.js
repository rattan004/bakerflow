const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  recipeName: { type: String, required: true },
  quantity: { type: Number, required: true },
  totalRevenue: { type: Number, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
