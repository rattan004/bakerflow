const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  currentStock: { type: Number, default: 0 }, // Store in grams
  cost: { type: Number, default: 0 },         // Cost per gram
  minThreshold: { type: Number, default: 1000 } // Default 1kg alert
});

module.exports = mongoose.model('Ingredient', IngredientSchema);