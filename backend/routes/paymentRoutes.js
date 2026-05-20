const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const User = require('../models/User');
const PendingCheckout = require('../models/PendingCheckout');
const authMiddleware = require('../middleware/authMiddleware');
const { completePendingCheckout } = require('../services/completeCheckout');

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const PACKAGING_FEE = 30;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const getStripe = () => {
  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in backend .env');
  }
  return stripe;
};

// Create Stripe Checkout Session from authenticated user's cart
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate({
      path: 'cart.recipeId',
      populate: {
        path: 'ingredients.ingredientId',
        select: 'name currentStock'
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    const checkoutItems = [];
    const lineItems = [];

    for (const cartItem of user.cart) {
      const recipe = cartItem.recipeId;
      if (!recipe) {
        return res.status(400).json({ message: 'One or more cart items are invalid' });
      }

      const quantity = cartItem.quantity || 1;

      for (const ing of recipe.ingredients || []) {
        const stock = ing.ingredientId?.currentStock ?? 0;
        const needed = (ing.amount || 0) * quantity;
        if (needed > stock) {
          return res.status(400).json({
            message: `Insufficient stock for ${recipe.name}. Please update your cart.`
          });
        }
      }

      checkoutItems.push({
        recipeId: recipe._id,
        quantity,
        recipeName: recipe.name,
        unitPrice: recipe.sellingPrice
      });

      lineItems.push({
        price_data: {
          currency: 'inr',
          product_data: {
            name: recipe.name,
            description: recipe.category || 'BakerFlow item'
          },
          unit_amount: Math.round((recipe.sellingPrice || 0) * 100)
        },
        quantity
      });
    }

    const subtotal = checkoutItems.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0
    );
    const packagingFee = PACKAGING_FEE;
    const total = subtotal + packagingFee;

    if (packagingFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'inr',
          product_data: {
            name: 'Premium Packaging Fee'
          },
          unit_amount: Math.round(packagingFee * 100)
        },
        quantity: 1
      });
    }

    const pendingCheckout = await PendingCheckout.create({
      customerId: user._id,
      items: checkoutItems,
      subtotal,
      packagingFee,
      total
    });

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${FRONTEND_URL}/cart?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/cart?checkout=cancelled`,
      customer_email: user.email,
      metadata: {
        pendingCheckoutId: pendingCheckout._id.toString(),
        customerId: user._id.toString()
      }
    });

    pendingCheckout.stripeSessionId = session.id;
    await pendingCheckout.save();

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Create checkout session error:', err);
    res.status(500).json({
      message: err.message || 'Failed to create checkout session'
    });
  }
});

// Verify payment and fulfill orders (called after Stripe redirect)
router.post('/fulfill', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'Missing session ID' });
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    const pendingCheckoutId = session.metadata?.pendingCheckoutId;
    if (!pendingCheckoutId) {
      return res.status(400).json({ message: 'Invalid checkout session metadata' });
    }

    const pendingCheckout = await PendingCheckout.findById(pendingCheckoutId);
    if (!pendingCheckout) {
      return res.status(404).json({ message: 'Checkout record not found' });
    }

    if (pendingCheckout.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized checkout session' });
    }

    const result = await completePendingCheckout(pendingCheckoutId, {
      customerId: req.user.userId
    });

    if (result.alreadyFulfilled) {
      return res.json({ message: 'Order already fulfilled', alreadyFulfilled: true });
    }

    res.json({
      message: 'Order successful! Stock updated and logged.',
      fulfilled: result.fulfilled
    });
  } catch (err) {
    console.error('Fulfill checkout error:', err);
    res.status(500).json({
      message: err.message || 'Failed to fulfill order after payment'
    });
  }
});

// Stripe webhook handler (mounted separately in server.js with raw body parser)
const webhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !stripe) {
    return res.status(500).send('Webhook not configured');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      const pendingCheckoutId = session.metadata?.pendingCheckoutId;
      if (pendingCheckoutId) {
        await completePendingCheckout(pendingCheckoutId);
      }
    } catch (err) {
      console.error('Webhook fulfillment error:', err);
      return res.status(500).json({ error: 'Fulfillment failed' });
    }
  }

  res.json({ received: true });
};

module.exports = router;
module.exports.webhookHandler = webhookHandler;
