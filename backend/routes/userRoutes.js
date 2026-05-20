const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');

// Get User Profile (Includes populated cart and wishlist)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('wishlist')
      .populate({
        path: 'cart.recipeId',
        populate: {
          path: 'ingredients.ingredientId',
          select: 'name currentStock cost unit minThreshold'
        }
      });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update User Profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get User Orders
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Transaction.find({ customerId: req.user.userId }).sort({ timestamp: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Merge Guest Cart with User Cart
router.post('/cart/merge', authMiddleware, async (req, res) => {
  try {
    const { guestCart } = req.body;
    if (!guestCart || !Array.isArray(guestCart)) {
      return res.status(400).json({ message: "Invalid guest cart format" });
    }

    const user = await User.findById(req.user.userId);
    
    for (const item of guestCart) {
      if (!item.recipeId) continue;
      const recipeId = (item.recipeId._id || item.recipeId).toString();
      const quantity = item.quantity || 1;

      const existingItem = user.cart.find(c => c.recipeId && c.recipeId.toString() === recipeId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        user.cart.push({ recipeId, quantity });
      }
    }

    await user.save();

    const updatedUser = await User.findById(req.user.userId)
      .select('-password')
      .populate({
        path: 'cart.recipeId',
        populate: {
          path: 'ingredients.ingredientId',
          select: 'name currentStock cost unit minThreshold'
        }
      });

    res.json(updatedUser.cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add to Cart
router.post('/cart', authMiddleware, async (req, res) => {
  try {
    const { recipeId, quantity } = req.body;
    const user = await User.findById(req.user.userId);
    
    const existingItem = user.cart.find(item => item.recipeId && item.recipeId.toString() === recipeId.toString());
    if (existingItem) {
      existingItem.quantity += (quantity || 1);
    } else {
      user.cart.push({ recipeId, quantity: quantity || 1 });
    }
    
    await user.save();
    const updatedUser = await User.findById(req.user.userId)
      .select('-password')
      .populate({
        path: 'cart.recipeId',
        populate: {
          path: 'ingredients.ingredientId',
          select: 'name currentStock cost unit minThreshold'
        }
      });
    res.json(updatedUser.cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove from Cart
router.delete('/cart/:recipeId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    user.cart = user.cart.filter(item => item.recipeId.toString() !== req.params.recipeId);
    await user.save();
    
    const updatedUser = await User.findById(req.user.userId)
      .select('-password')
      .populate({
        path: 'cart.recipeId',
        populate: {
          path: 'ingredients.ingredientId',
          select: 'name currentStock cost unit minThreshold'
        }
      });
    res.json(updatedUser.cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear Cart
router.delete('/cart', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    user.cart = [];
    await user.save();
    res.json(user.cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle Wishlist
router.post('/wishlist', authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.body;
    const user = await User.findById(req.user.userId);
    
    const index = user.wishlist.indexOf(recipeId);
    if (index === -1) {
      user.wishlist.push(recipeId);
    } else {
      user.wishlist.splice(index, 1);
    }
    
    await user.save();
    const updatedUser = await User.findById(req.user.userId).select('-password').populate('wishlist');
    res.json(updatedUser.wishlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
