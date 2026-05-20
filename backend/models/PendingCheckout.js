const mongoose = require('mongoose');

const PendingCheckoutSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    quantity: { type: Number, required: true, min: 1 },
    recipeName: String,
    unitPrice: Number
  }],
  subtotal: { type: Number, required: true },
  packagingFee: { type: Number, default: 0 },
  total: { type: Number, required: true },
  stripeSessionId: { type: String, unique: true, sparse: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'expired'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('PendingCheckout', PendingCheckoutSchema);
