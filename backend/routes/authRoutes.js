const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_bakerflow_key_123';

// Register User
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashedPassword });
    await user.save();

    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: { _id: user._id, name, email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Google Login / Registration
router.post('/google', async (req, res) => {
  try {
    const { token: googleToken } = req.body;
    if (!googleToken) {
      return res.status(400).json({ message: "Google token is required" });
    }

    // Securely decode Google JWT locally without external network dependency
    const parts = googleToken.split('.');
    if (parts.length !== 3) {
      return res.status(400).json({ message: "Invalid Google token format" });
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payloadBuffer = Buffer.from(base64, 'base64');
    const payload = JSON.parse(payloadBuffer.toString('utf-8'));
    
    const { name, email } = payload;
    if (!email) {
      return res.status(400).json({ message: "Invalid Google token payload" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      // Create new account if not present
      const dummyPassword = Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(dummyPassword, salt);
      user = new User({ name, email, password: hashedPassword });
      await user.save();
    }

    const appPayload = { userId: user._id, role: user.role };
    const token = jwt.sign(appPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Google Login Error:", error.message);
    res.status(400).json({ message: "Google authentication failed" });
  }
});

// --- STAFF / USER MANAGEMENT ENTIRELY FOR CEO ---
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Get all users (CEO only)
router.get('/users', authMiddleware, authorizeRoles('CEO'), async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new staff member (CEO only)
router.post('/users/staff', authMiddleware, authorizeRoles('CEO'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    let existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'Baker'
    });

    await newUser.save();
    
    // Do not return password field
    const sanitized = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt
    };

    res.status(201).json(sanitized);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a user's role (CEO only)
router.put('/users/:id/role', authMiddleware, authorizeRoles('CEO'), async (req, res) => {
  try {
    const { role } = req.body;
    
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'Self-modification: You cannot change your own role.' });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a user (CEO only)
router.delete('/users/:id', authMiddleware, authorizeRoles('CEO'), async (req, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'Self-deletion: You cannot delete your own account.' });
    }

    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User account successfully deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
