const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
  ingredientName: String, // Snapshot in case ingredient is deleted
  type: { 
    type: String, 
    enum: ['Addition','Restock',  'Adjustment', 'Order', 'Waste', 'Production'], 
    required: true 
  },
  quantity: Number, // Positive for addition, negative for deduction
  reason: String,   // e.g., "Customer Order #123" or "Expired"
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', LogSchema);