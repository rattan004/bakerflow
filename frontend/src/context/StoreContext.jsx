import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../api';

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('customer_token') || '');
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Custom Toast State
  const [toast, setToast] = useState(null); // { message: '', type: 'info' | 'success' | 'error' }
  const [toastTimeoutId, setToastTimeoutId] = useState(null);

  const showToast = (message, type = 'info') => {
    if (toastTimeoutId) clearTimeout(toastTimeoutId);
    setToast({ message, type });
    const id = setTimeout(() => setToast(null), 4000);
    setToastTimeoutId(id);
  };

  // Set auth header helper
  const getAuthHeaders = () => {
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  // Sync profile details (cart + wishlist) from server if token exists
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setCart(JSON.parse(localStorage.getItem('guest_cart')) || []);
        setLoading(false);
        return;
      }
      try {
        const res = await API.get('/api/user/profile', getAuthHeaders());
        setCustomer({
          _id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role
        });
        setWishlist(res.data.wishlist || []);
        setCart(res.data.cart || []);
      } catch (err) {
        console.error("Error fetching customer profile:", err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  // Save guest cart to localStorage
  useEffect(() => {
    if (!token) {
      localStorage.setItem('guest_cart', JSON.stringify(cart));
    }
  }, [cart, token]);

  const login = async (email, password) => {
    const res = await API.post('/api/auth/login', { email, password });
    localStorage.setItem('customer_token', res.data.token);
    
    // Carryforward guest cart if present
    const guestCart = JSON.parse(localStorage.getItem('guest_cart')) || [];
    if (guestCart.length > 0) {
      try {
        const mergeRes = await API.post('/api/user/cart/merge', 
          { guestCart }, 
          { headers: { Authorization: `Bearer ${res.data.token}` } }
        );
        setCart(mergeRes.data);
        localStorage.removeItem('guest_cart');
      } catch (err) {
        console.error("Failed to merge guest cart on login", err);
      }
    }
    
    setToken(res.data.token);
    showToast(`Welcome back, ${res.data.user.name}!`, "success");
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await API.post('/api/auth/register', { name, email, password });
    localStorage.setItem('customer_token', res.data.token);
    
    // Carryforward guest cart if present
    const guestCart = JSON.parse(localStorage.getItem('guest_cart')) || [];
    if (guestCart.length > 0) {
      try {
        const mergeRes = await API.post('/api/user/cart/merge', 
          { guestCart }, 
          { headers: { Authorization: `Bearer ${res.data.token}` } }
        );
        setCart(mergeRes.data);
        localStorage.removeItem('guest_cart');
      } catch (err) {
        console.error("Failed to merge guest cart on register", err);
      }
    }
    
    setToken(res.data.token);
    showToast(`Account created! Welcome, ${name}.`, "success");
    return res.data;
  };

  const loginWithGoogle = async (googleToken) => {
    const res = await API.post('/api/auth/google', { token: googleToken });
    localStorage.setItem('customer_token', res.data.token);
    
    // Carryforward guest cart if present
    const guestCart = JSON.parse(localStorage.getItem('guest_cart')) || [];
    if (guestCart.length > 0) {
      try {
        const mergeRes = await API.post('/api/user/cart/merge', 
          { guestCart }, 
          { headers: { Authorization: `Bearer ${res.data.token}` } }
        );
        setCart(mergeRes.data);
        localStorage.removeItem('guest_cart');
      } catch (err) {
        console.error("Failed to merge guest cart on Google login", err);
      }
    }
    
    setToken(res.data.token);
    showToast(`Welcome back, ${res.data.user.name}!`, "success");
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('customer_token');
    setToken('');
    setCustomer(null);
    setCart([]);
    setWishlist([]);
    showToast("Logged out successfully.", "info");
  };

  // Calculate cumulative recipe availability based on active cart reserves
  const checkRecipeAvailability = (recipe) => {
    const recipeId = (recipe._id || recipe).toString();
    
    // Calculate reserves of all OTHER items in the cart
    const reserves = {};
    cart.forEach(item => {
      const itemRecipeId = (item.recipeId?._id || item.recipeId)?.toString();
      if (itemRecipeId === recipeId) return; // Skip target recipe

      const r = item.recipeId;
      if (r && r.ingredients) {
        r.ingredients.forEach(ing => {
          const ingId = (ing.ingredientId?._id || ing.ingredientId)?.toString();
          if (ingId) {
            reserves[ingId] = (reserves[ingId] || 0) + ((ing.amount || 0) * (item.quantity || 0));
          }
        });
      }
    });

    if (!recipe.ingredients || recipe.ingredients.length === 0) return true;
    return recipe.ingredients.every(ing => {
      const ingId = (ing.ingredientId?._id || ing.ingredientId)?.toString();
      if (!ingId) return true;
      const stock = ing.ingredientId?.currentStock ?? 0;
      const reserved = reserves[ingId] || 0;
      const available = Math.max(0, stock - reserved);
      const needed = ing.amount ?? 0;
      return available >= needed;
    });
  };

  // Add item to Cart
  const addToCart = async (recipe, quantity = 1) => {
    const recipeId = (recipe._id || recipe).toString();
    
    // Find existing quantity in cart
    const existingCartItem = cart.find(item => {
      const itemRecipeId = (item.recipeId?._id || item.recipeId)?.toString();
      return itemRecipeId === recipeId;
    });
    const currentCartQty = existingCartItem ? existingCartItem.quantity : 0;
    const newQty = currentCartQty + quantity;

    // Calculate reserves of all OTHER items in the cart
    const reserves = {};
    cart.forEach(item => {
      const itemRecipeId = (item.recipeId?._id || item.recipeId)?.toString();
      if (itemRecipeId === recipeId) return;

      const r = item.recipeId;
      if (r && r.ingredients) {
        r.ingredients.forEach(ing => {
          const ingId = (ing.ingredientId?._id || ing.ingredientId)?.toString();
          if (ingId) {
            reserves[ingId] = (reserves[ingId] || 0) + ((ing.amount || 0) * (item.quantity || 0));
          }
        });
      }
    });

    // Calculate maximum available units based on remaining ingredient stocks
    let maxAvailable = 999;
    if (typeof recipe === 'object' && recipe.ingredients && recipe.ingredients.length > 0) {
      recipe.ingredients.forEach(item => {
        const ingId = (item.ingredientId?._id || item.ingredientId)?.toString();
        if (ingId) {
          const stock = item.ingredientId?.currentStock ?? 0;
          const reserved = reserves[ingId] || 0;
          const available = Math.max(0, stock - reserved);
          const needed = item.amount ?? 0;
          if (needed > 0) {
            const possible = Math.floor(available / needed);
            if (possible < maxAvailable) {
              maxAvailable = possible;
            }
          }
        }
      });
    }

    if (newQty > maxAvailable) {
      showToast(`Only limited quantities of this fresh batch are available today (${maxAvailable} max).`, 'error');
      return;
    }

    if (token) {
      try {
        const res = await API.post('/api/user/cart', { recipeId, quantity }, getAuthHeaders());
        setCart(res.data);
        showToast("Added to your basket!", "success");
      } catch (err) {
        console.error("Failed adding to online cart", err);
        showToast("Could not update basket.", "error");
      }
    } else {
      setCart(prev => {
        const existing = prev.find(item => {
          const itemRecipeId = (item.recipeId?._id || item.recipeId)?.toString();
          return itemRecipeId === recipeId;
        });
        if (existing) {
          return prev.map(item => {
            const itemRecipeId = (item.recipeId?._id || item.recipeId)?.toString();
            return (itemRecipeId === recipeId)
              ? { ...item, quantity: item.quantity + quantity }
              : item;
          });
        } else {
          return [...prev, { recipeId: recipe, quantity }];
        }
      });
      showToast("Added to your basket!", "success");
    }
  };

  // Remove item from Cart
  const removeFromCart = async (recipeId) => {
    const id = (recipeId._id || recipeId).toString();
    if (token) {
      try {
        const res = await API.delete(`/api/user/cart/${id}`, getAuthHeaders());
        setCart(res.data);
        showToast("Removed from your basket.", "info");
      } catch (err) {
        console.error("Failed removing from online cart", err);
        showToast("Could not remove item.", "error");
      }
    } else {
      setCart(prev => prev.filter(item => (item.recipeId._id || item.recipeId)?.toString() !== id));
      showToast("Removed from your basket.", "info");
    }
  };

  // Clear Cart
  const clearCart = async () => {
    if (token) {
      try {
        await API.delete('/api/user/cart', getAuthHeaders());
        setCart([]);
        showToast("Cleared your basket.", "info");
      } catch (err) {
        console.error("Failed to clear online cart", err);
      }
    } else {
      setCart([]);
      showToast("Cleared your basket.", "info");
    }
  };

  // Toggle Wishlist
  const toggleWishlist = async (recipeId) => {
    if (!token) {
      showToast("Please log in to use your wishlist!", "error");
      return;
    }
    try {
      const res = await API.post('/api/user/wishlist', { recipeId }, getAuthHeaders());
      setWishlist(res.data);
      const isFavorited = res.data.some(r => r._id === recipeId);
      showToast(isFavorited ? "Added to your wishlist! 💖" : "Removed from your wishlist.", "success");
    } catch (err) {
      console.error("Failed to toggle wishlist", err);
      showToast("Could not update wishlist.", "error");
    }
  };

  return (
    <StoreContext.Provider value={{
      customer, token, cart, wishlist, loading, showToast, checkRecipeAvailability,
      login, register, loginWithGoogle, logout, addToCart, removeFromCart, clearCart, toggleWishlist
    }}>
      {children}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 right-10 z-50 animate-slideIn flex items-center gap-4 bg-white/95 border border-gray-100 p-5 rounded-3xl shadow-xl max-w-sm backdrop-blur-md">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${
            toast.type === 'success' ? 'bg-green-50 text-green-600' :
            toast.type === 'error' ? 'bg-red-50 text-red-500' :
            'bg-bakery-accent/10 text-bakery-accent'
          }`}>
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠️' : '🧁'}
          </div>
          <div className="flex-1">
            <p className="text-xs font-black text-bakery-dark uppercase tracking-tight leading-relaxed">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(null)} 
            className="ml-2 text-gray-400 hover:text-bakery-dark text-xs font-bold transition-colors"
          >
            ×
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
