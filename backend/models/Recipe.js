const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  category: { 
    type: String, 
    required: true, 
    enum: ['Cakes', 'Breads', 'Cookies', 'Pastries', 'Savories'], // Aligns with your bakery focus
    default: 'Cakes'
  },
  image: {
    type: String,
    required: true,
    default: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop'
  },
  // The Bill of Materials (BOM)
  ingredients: [{
    ingredientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Ingredient', // Links directly to your Inventory collection
      required: true 
    },
    name: String, // Cached name for quick UI rendering without populating
    amount: { 
      type: Number, 
      required: true // Stored in grams/ml to match your inventory units
    }
  }],
  // Financials (Owner-only access in the UI)
  sellingPrice: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  // Optional: For the scaling logic we discussed
  baseYield: { 
    type: String, 
    default: '1 Batch' 
  },
  // Premium details for interactive item cards
  description: {
    type: String,
    default: ''
  },
  allergens: [{
    type: String
  }],
  nutritionalFacts: {
    calories: { type: String, default: '' },
    carbs: { type: String, default: '' },
    protein: { type: String, default: '' },
    fat: { type: String, default: '' }
  },
  ingredientsList: [{
    type: String
  }],
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Recipe', recipeSchema);