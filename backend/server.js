require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Ingredient = require('./models/Ingredients');
const Recipe = require('./models/Recipe');
const Log = require('./models/Logs'); // Import the new Logs model
const Transaction = require('./models/Transaction'); // Import the Transaction model

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const { fulfillRecipeOrder } = require('./services/fulfillOrder');

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Stripe webhook must receive raw body (register before express.json)
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  paymentRoutes.webhookHandler
);

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/payments', paymentRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Database Connected!");
    // Seed default CEO user
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const seedCEO = async () => {
      try {
        const existing = await User.findOne({ email: 'ceo@bakerflow.com' });
        if (!existing) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash('ceo_password_123', salt);
          const newCeo = new User({
            name: 'CEO Chief',
            email: 'ceo@bakerflow.com',
            password: hashedPassword,
            role: 'CEO'
          });
          await newCeo.save();
          console.log("👑 Seeded default CEO user successfully: ceo@bakerflow.com / ceo_password_123");
        } else if (existing.role !== 'CEO') {
          existing.role = 'CEO';
          await existing.save();
          console.log("👑 Set existing user role to CEO: ceo@bakerflow.com");
        }
      } catch (err) {
        console.error("Error seeding default CEO:", err);
      }
    };
    seedCEO();
  })
  .catch(err => console.log("❌ DB Error:", err));

// --- LOGS ROUTE ---

// GET all activity logs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- INGREDIENT ROUTES ---

// Route to SAVE a brand new ingredient (Manual Add)
app.post('/api/ingredients', async (req, res) => {
  try {
    const { name, category, currentStock, cost, minThreshold } = req.body;
    const incomingStock = Number(currentStock) || 0;
    const incomingPrice = Number(cost) || 0;
    const threshold = Number(minThreshold) || 5000; // Default to 5kg in grams

    let ingredient = await Ingredient.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (ingredient) {
      return res.status(400).json({ message: "Ingredient already exists. Use Restock instead." });
    }

    const newIng = new Ingredient({
      name,
      category: category || 'Uncategorized',
      currentStock: incomingStock,
      cost: incomingPrice,
      minThreshold: threshold
    });
    
    await newIng.save();

    // Log the initial addition
    await Log.create({
      ingredientId: newIng._id,
      ingredientName: newIng.name,
      type: 'Addition',
      quantity: incomingStock,
      reason: 'Initial stock entry'
    });

    return res.json(newIng);
  } catch (err) {
    console.error("POST /api/ingredients error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Explicit RESTOCK route
app.post('/api/ingredients/:id/restock', async (req, res) => {
  try {
    const { id } = req.params;
    const { addAmount } = req.body; 

    const ingredient = await Ingredient.findById(id);
    if (!ingredient) return res.status(404).json({ message: "Ingredient not found" });

    const amount = Number(addAmount) || 0;
    ingredient.currentStock += amount;
    await ingredient.save();

    // Log the restock
    await Log.create({
      ingredientId: id,
      ingredientName: ingredient.name,
      type: 'Restock',
      quantity: amount,
      reason: 'Manual Restock'
    });

    res.status(200).json(ingredient);
  } catch (err) {
    res.status(500).json({ message: "Server error during restocking" });
  }
});

// ADJUST stock for waste or expiry (Deduction)
app.post('/api/ingredients/:id/adjust', async (req, res) => {
  const { id } = req.params;
  const { reductionAmount, reason } = req.body;

  try {
    const ingredient = await Ingredient.findById(id);
    if (!ingredient) return res.status(404).json({ message: "Ingredient not found" });

    const amount = Number(reductionAmount) || 0;
    ingredient.currentStock = Math.max(0, ingredient.currentStock - amount);
    await ingredient.save();

    // Log as Waste or Adjustment
    await Log.create({
      ingredientId: id,
      ingredientName: ingredient.name,
      type: reason.includes('Expired') || reason.includes('Damage') ? 'Waste' : 'Adjustment',
      quantity: -amount,
      reason: reason || 'Manual Adjustment'
    });

    res.status(200).json(ingredient);
  } catch (err) {
    res.status(500).json({ message: "Server error during adjustment" });
  }
});

app.get('/api/ingredients', async (req, res) => {
  try {
    const allIng = await Ingredient.find();
    res.json(allIng);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- AI RECEIPT SCAN ROUTE ---
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 } // Limit: 10MB
});

app.post('/api/ingredients/scan-receipt', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No receipt image uploaded." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key is not configured on the server." });
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const mimeType = req.file.mimetype;
    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType
      }
    };

    const prompt = `You are an elite wholesale inventory bill parser for an artisanal bakery.
Analyze the uploaded receipt / invoice image and extract all purchased baking raw ingredients.
Convert all quantities into uniform grams (g) (e.g. if the item says "10kg" or "10 kg", output 10000; if it says "500g", output 500; if it says "5 liters" of milk or liquid, convert it to 5000 grams).
Calculate the total price paid in INR (Indian Rupees) for that specific line item.
Map the item to one of these premium categories: 'Dry Goods', 'Dairy', 'Toppings', 'Packaging'.
Return a JSON response matching the following structure:
{
  "items": [
    {
      "name": "string (Title cased name of ingredient)",
      "quantityGrams": number,
      "totalPrice": number,
      "category": "Dry Goods" | "Dairy" | "Toppings" | "Packaging"
    }
  ]
}`;

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    if (!parsedData.items || !Array.isArray(parsedData.items)) {
      return res.status(400).json({ error: "Failed to parse ingredients from receipt structure." });
    }

    const processedResults = [];

    for (const item of parsedData.items) {
      const { name, quantityGrams, totalPrice, category } = item;
      const amountGrams = Number(quantityGrams) || 0;
      const totalCost = Number(totalPrice) || 0;

      if (amountGrams <= 0) continue;

      // Calculate cost per gram
      const costPerGram = totalCost / amountGrams;

      // Find matching ingredient
      let ingredient = await Ingredient.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
      });

      let actionType = 'Restock';

      if (ingredient) {
        // Update stock
        ingredient.currentStock += amountGrams;
        // Update cost per gram as a running average
        const totalOldValue = (ingredient.currentStock - amountGrams) * (ingredient.cost || 0);
        ingredient.cost = (totalOldValue + totalCost) / ingredient.currentStock;
        await ingredient.save();
      } else {
        // Create new
        ingredient = new Ingredient({
          name: name.trim(),
          category: category || 'Dry Goods',
          currentStock: amountGrams,
          cost: costPerGram,
          minThreshold: 5000 // Default 5kg
        });
        await ingredient.save();
        actionType = 'Addition';
      }

      // Log the transaction/expense inside the Logs collection
      await Log.create({
        ingredientId: ingredient._id,
        ingredientName: ingredient.name,
        type: actionType,
        quantity: amountGrams,
        reason: `AI Receipt Scan Restock (Spent ₹${totalCost})`
      });

      // Also create an expense transaction inside Transactions collection
      await Transaction.create({
        recipeName: `Purchase: ${ingredient.name}`,
        quantity: amountGrams / 1000,
        totalRevenue: -totalCost, // Representing expense as negative revenue
        timestamp: new Date()
      });

      processedResults.push({
        _id: ingredient._id,
        name: ingredient.name,
        category: ingredient.category,
        addedStock: amountGrams,
        newStock: ingredient.currentStock,
        totalCost,
        actionType
      });
    }

    res.json({
      message: "AI receipt scanning completed successfully.",
      items: processedResults
    });

  } catch (err) {
    console.error("AI Scan Receipt error:", err);
    res.status(500).json({ error: "Failed to process receipt via AI: " + err.message });
  }
});

app.put('/api/ingredients/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.minThreshold) updateData.minThreshold = Number(updateData.minThreshold);

    const updatedIngredient = await Ingredient.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    );
    res.json(updatedIngredient);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/ingredients/:id', async (req, res) => {
  try {
    await Ingredient.findByIdAndDelete(req.params.id);
    res.json({ message: "Ingredient Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- RECIPE & ORDER ROUTES ---

app.post('/api/recipes', async (req, res) => {
  try {
    const newRecipe = new Recipe(req.body);
    await newRecipe.save();
    res.json(newRecipe);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/recipes', async (req, res) => {
  try {
    // Populate the ingredient details so we can check currentStock on the frontend
    const recipes = await Recipe.find()
      .populate('ingredients.ingredientId', 'name currentStock cost unit minThreshold'); 
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/recipes/:id', async (req, res) => {
  try {
    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ message: "Recipe removed from menu" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/recipes/:id', async (req, res) => {
  try {
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedRecipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    res.json(updatedRecipe);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// BAKE BATCH: Deducts ingredients for production
app.post('/api/recipes/:id/bake', async (req, res) => {
  try {
    const { batches } = req.body; // e.g., baking 2 batches of cookies
    const recipe = await Recipe.findById(req.params.id).populate('ingredients.ingredientId');

    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    // 1. Pre-check: Do we have enough for ALL batches?
    for (let item of recipe.ingredients) {
      const needed = item.amount * (batches || 1);
      if (item.ingredientId.currentStock < needed) {
        return res.status(400).json({ message: `Need ${needed}g of ${item.name}, but only ${item.ingredientId.currentStock}g available.` });
      }
    }

    // 2. Deduct and Log
    for (let item of recipe.ingredients) {
      const amountConsumed = item.amount * (batches || 1);
      const ingredient = await Ingredient.findById(item.ingredientId._id);
      
      ingredient.currentStock -= amountConsumed;
      await ingredient.save();

      await Log.create({
        ingredientId: ingredient._id,
        ingredientName: ingredient.name,
        type: 'Production', // Categorized as production
        quantity: -amountConsumed,
        reason: `Baked ${batches || 1} batch(es) of ${recipe.name}`
      });
    }

    // 3. Create Transaction for Finance Tracking from Production
    const totalRevenue = (recipe.sellingPrice || 0) * (batches || 1);
    if (totalRevenue > 0) {
      await Transaction.create({
        recipeName: recipe.name,
        quantity: (batches || 1),
        totalRevenue: totalRevenue
      });
    }

    res.json({ message: "Production complete! Inventory updated." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { recipeId, quantitySold, customerId } = req.body;
    await fulfillRecipeOrder(recipeId, quantitySold, customerId);
    res.json({ message: "Order successful! Stock updated and logged." });
  } catch (err) {
    const status = err.message?.includes('Insufficient') || err.message?.includes('not found')
      ? 400
      : 500;
    res.status(status).json({ message: err.message });
  }
});

// --- TRANSACTION ROUTES ---
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ timestamp: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on Port ${PORT}`));