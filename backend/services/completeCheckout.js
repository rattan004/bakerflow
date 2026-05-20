const User = require('../models/User');
const PendingCheckout = require('../models/PendingCheckout');
const { fulfillRecipeOrder } = require('./fulfillOrder');

/**
 * Atomically claim and fulfill a pending checkout.
 * Only one caller (redirect or webhook) can succeed per checkout.
 */
async function completePendingCheckout(pendingCheckoutId, options = {}) {
  const { customerId } = options;

  const checkout = await PendingCheckout.findOneAndUpdate(
    { _id: pendingCheckoutId, status: 'pending' },
    { $set: { status: 'processing' } },
    { new: true }
  );

  if (!checkout) {
    const existing = await PendingCheckout.findById(pendingCheckoutId);
    if (existing?.status === 'completed') {
      return { alreadyFulfilled: true, fulfilled: [] };
    }
    if (existing?.status === 'processing') {
      return { alreadyFulfilled: true, fulfilled: [], inProgress: true };
    }
    throw new Error('Checkout not found or no longer pending');
  }

  if (customerId && checkout.customerId.toString() !== customerId.toString()) {
    checkout.status = 'pending';
    await checkout.save();
    throw new Error('Unauthorized checkout session');
  }

  try {
    const fulfilled = [];
    for (const item of checkout.items) {
      const result = await fulfillRecipeOrder(
        item.recipeId,
        item.quantity,
        checkout.customerId
      );
      fulfilled.push(result);
    }

    checkout.status = 'completed';
    await checkout.save();

    const user = await User.findById(checkout.customerId);
    if (user) {
      user.cart = [];
      await user.save();
    }

    return { alreadyFulfilled: false, fulfilled };
  } catch (err) {
    checkout.status = 'pending';
    await checkout.save();
    throw err;
  }
}

module.exports = { completePendingCheckout };
