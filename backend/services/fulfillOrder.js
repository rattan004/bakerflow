const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredients');
const Log = require('../models/Logs');
const Transaction = require('../models/Transaction');

/**
 * Deduct inventory, write logs, and record revenue for one recipe sale.
 */
async function fulfillRecipeOrder(recipeId, quantitySold, customerId) {
  const recipe = await Recipe.findById(recipeId).populate('ingredients.ingredientId');
  if (!recipe) {
    throw new Error('Recipe not found');
  }

  const qty = Number(quantitySold) || 0;
  if (qty <= 0) {
    throw new Error('Invalid quantity');
  }

  for (const item of recipe.ingredients) {
    const ingredient = item.ingredientId;
    if (!ingredient) {
      throw new Error(`Missing ingredient data for ${item.name || 'recipe item'}`);
    }
    const amountNeeded = item.amount * qty;
    if (ingredient.currentStock < amountNeeded) {
      throw new Error(`Insufficient stock for ${ingredient.name}.`);
    }
  }

  for (const item of recipe.ingredients) {
    const ingredient = await Ingredient.findById(item.ingredientId._id);
    const amountConsumed = item.amount * qty;

    ingredient.currentStock -= amountConsumed;
    await ingredient.save();

    await Log.create({
      ingredientId: ingredient._id,
      ingredientName: ingredient.name,
      type: 'Order',
      quantity: -amountConsumed,
      reason: `Sold ${qty}x ${recipe.name}`
    });
  }

  const totalRevenue = (recipe.sellingPrice || 0) * qty;
  await Transaction.create({
    recipeName: recipe.name,
    quantity: qty,
    totalRevenue,
    customerId: customerId || null
  });

  return { recipeName: recipe.name, quantity: qty, totalRevenue };
}

module.exports = { fulfillRecipeOrder };
