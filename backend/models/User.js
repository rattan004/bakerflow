const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'Customer', enum: ['Customer', 'Baker', 'Manager', 'CEO'] },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
  cart: [{
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
    quantity: { type: Number, default: 1 }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
