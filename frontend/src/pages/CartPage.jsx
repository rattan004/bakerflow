import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api';
import { useStore } from '../context/StoreContext';

const CartPage = () => {
  const { cart, removeFromCart, clearCart, token, showToast } = useStore();
  const [loading, setLoading] = useState(false);
  const [fulfilling, setFulfilling] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const fulfillStartedRef = useRef(false);

  const navigate = useNavigate();

  const subtotal = cart.reduce((acc, curr) => acc + (curr.recipeId.sellingPrice * curr.quantity), 0);
  const packagingFee = cart.length > 0 ? 30 : 0;
  const total = subtotal + packagingFee;

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  // After Stripe redirect: verify payment and fulfill order
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    const sessionId = searchParams.get('session_id');

    if (checkoutStatus === 'cancelled') {
      showToast('Payment cancelled. Your cart is unchanged.', 'info');
      setSearchParams({});
      return;
    }

    if (checkoutStatus !== 'success' || !sessionId || !token) return;

    const storageKey = `stripe_fulfilled_${sessionId}`;
    if (sessionStorage.getItem(storageKey) || fulfillStartedRef.current) {
      setOrderSuccess(true);
      setSearchParams({});
      return;
    }

    fulfillStartedRef.current = true;

    const fulfillPayment = async () => {
      setFulfilling(true);
      setError('');
      try {
        const res = await API.post(
          '/api/payments/fulfill',
          { sessionId },
          getAuthHeaders()
        );

        sessionStorage.setItem(storageKey, '1');
        await clearCart();
        setOrderSuccess(true);
        if (!res.data.alreadyFulfilled) {
          showToast('Payment successful! Your order is confirmed.', 'success');
        }
      } catch (err) {
        fulfillStartedRef.current = false;
        console.error('Payment fulfillment failed:', err);
        setError(
          err.response?.data?.message ||
            'Payment received but order fulfillment failed. Please contact support.'
        );
        showToast('Could not complete your order after payment.', 'error');
      } finally {
        setFulfilling(false);
        setSearchParams({});
      }
    };

    fulfillPayment();
  }, [searchParams, token]);

  const handleCheckout = async () => {
    if (!token) {
      showToast('Please log in to complete your checkout!', 'error');
      navigate('/auth');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await API.post(
        '/api/payments/create-checkout-session',
        {},
        getAuthHeaders()
      );

      if (res.data?.url) {
        window.location.href = res.data.url;
        return;
      }

      throw new Error('No checkout URL returned');
    } catch (err) {
      console.error('Checkout failed:', err);
      setError(
        err.response?.data?.message ||
          'Could not start payment. Check Stripe keys and try again.'
      );
      showToast(err.response?.data?.message || 'Checkout failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fulfilling) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-bakery-brown font-black animate-pulse tracking-widest uppercase text-xs">
          Confirming your payment...
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="max-w-md mx-auto my-16 px-6 text-center space-y-6 animate-fadeIn">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100 shadow-sm text-green-500 text-3xl select-none">
          ✓
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-bakery-dark tracking-tighter uppercase">Order Placed!</h2>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Payment received via Stripe</p>
        </div>
        <p className="text-gray-500 text-xs leading-relaxed font-bold uppercase tracking-tight">
          We have updated our kitchen command ledger. Head to the dashboard to see your order trigger real-time asset updates!
        </p>
        <div className="pt-4">
          <Link to="/" className="inline-block bg-bakery-dark text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-bakery-accent transition-all shadow-sm">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 animate-fadeIn">
      <div className="mb-10 space-y-2">
        <h2 className="text-3xl font-extrabold text-bakery-dark tracking-tighter uppercase">Your Basket</h2>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Review your premium selections</p>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-12 text-center border border-gray-100 shadow-sm space-y-4">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest italic">Your basket is currently empty.</p>
          <div className="pt-2">
            <Link to="/" className="inline-block bg-bakery-brown text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all">
              Go To Shop
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="p-4 text-xs font-bold text-red-500 bg-red-50 border border-red-100 rounded-2xl">
                ⚠️ {error}
              </div>
            )}

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {cart.map((item) => (
                  <div key={item.recipeId._id || item.recipeId} className="p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-bakery-cream flex items-center justify-center text-2xl border border-gray-100 group-hover:scale-105 transition-transform">
                        🧁
                      </div>
                      <div>
                        <h4 className="font-extrabold text-bakery-dark text-sm tracking-tight">{item.recipeId.name}</h4>
                        <p className="text-[10px] font-bold text-bakery-accent uppercase tracking-widest mt-1">
                          ₹{item.recipeId.sellingPrice} each
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-end sm:self-auto">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty:</span>
                        <span className="font-black text-bakery-dark text-sm bg-gray-50 px-4 py-1.5 rounded-xl border border-gray-100">
                          {item.quantity}
                        </span>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.recipeId._id || item.recipeId)}
                        className="p-2.5 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-fit space-y-6">
            <h3 className="font-black text-bakery-brown text-xs uppercase tracking-[0.25em] border-b border-gray-50 pb-4">Order Summary</h3>

            <div className="space-y-3 text-xs font-bold uppercase tracking-tight">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Premium Box Fee</span>
                <span>₹{packagingFee}</span>
              </div>
              <div className="border-t border-gray-50 pt-4 flex justify-between text-base font-black text-bakery-dark tracking-tighter">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>

            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center">
              Secure checkout powered by Stripe
            </p>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-4 bg-bakery-dark text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-bakery-accent transition-all active:scale-95 shadow-sm flex justify-center items-center disabled:opacity-60"
            >
              {loading ? 'Redirecting to Stripe...' : 'Pay with Stripe'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
