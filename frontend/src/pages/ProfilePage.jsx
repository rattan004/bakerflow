import React, { useState, useEffect } from 'react';
import API from '../api';
import { useStore } from '../context/StoreContext';

const ProfilePage = () => {
  const { customer, wishlist, toggleWishlist, addToCart, token, checkRecipeAvailability } = useStore();
  const [activeTab, setActiveTab] = useState('orders'); // orders | wishlist | settings
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Profile settings state
  const [formData, setFormData] = useState({ name: customer?.name || '', email: customer?.email || '', password: '' });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  // Fetch customer orders on mount
  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;
      try {
        const res = await API.get('/api/user/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
      } catch (err) {
        console.error("Failed fetching customer orders", err);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsSuccess(false);
    setSettingsError('');

    try {
      await API.put('/api/user/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettingsSuccess(true);
    } catch (err) {
      console.error("Failed updating profile", err);
      setSettingsError(err.response?.data?.message || 'Failed updating profile.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const tabs = [
    { id: 'orders', label: 'Order History' },
    { id: 'wishlist', label: 'My Wishlist' },
    { id: 'settings', label: 'Account Settings' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 animate-fadeIn">
      {/* Page Header */}
      <div className="mb-10 space-y-2">
        <h2 className="text-3xl font-extrabold text-bakery-dark tracking-tighter uppercase">My Account</h2>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Manage your profile, orders, and wishlist</p>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">

        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-6 py-4 rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all ${activeTab === tab.id
                  ? 'bg-bakery-brown text-white shadow-md'
                  : 'bg-white text-bakery-brown border border-gray-100 hover:bg-bakery-cream/30'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Content Panel */}
        <div className="lg:col-span-3 bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm min-h-[400px]">

          {/* Order History */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h3 className="text-xl font-extrabold text-bakery-dark tracking-tight border-b border-gray-50 pb-4 uppercase">Orders</h3>

              {ordersLoading ? (
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider animate-pulse">Loading orders...</p>
              ) : orders.length === 0 ? (
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic py-8">No order ledger logs found. Go buy some fresh treats!</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {orders.map(order => (
                    <div key={order._id} className="py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <p className="text-xs font-black text-bakery-dark">{order.recipeName}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                          Ordered on: {new Date(order.timestamp).toLocaleDateString()} at {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 self-end sm:self-auto">
                        <div className="text-right">
                          <p className="text-xs font-bold text-gray-400">Qty: {order.quantity}</p>
                          <p className="text-sm font-black text-bakery-dark mt-0.5">₹{order.totalRevenue}</p>
                        </div>
                        <span className="text-[9px] font-black bg-green-50 text-green-600 border border-green-100 px-3 py-1.5 rounded-full uppercase tracking-widest">
                          Delivered
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Wishlist */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <h3 className="text-xl font-extrabold text-bakery-dark tracking-tight border-b border-gray-50 pb-4 uppercase">Wishlist</h3>

              {wishlist.length === 0 ? (
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic py-8">Your wishlist is empty.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {wishlist.map(recipe => {
                    const isAvailable = checkRecipeAvailability(recipe);
                    return (
                      <div key={recipe._id} className="py-6 first:pt-0 last:pb-0 flex items-center justify-between gap-4 group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-bakery-cream flex items-center justify-center border border-gray-100 group-hover:scale-105 transition-transform">
                            🧁
                          </div>
                          <div>
                            <p className="text-xs font-black text-bakery-dark">{recipe.name}</p>
                            <p className="text-[9px] font-bold text-bakery-accent uppercase tracking-widest mt-0.5">₹{recipe.sellingPrice}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {isAvailable ? (
                            <button
                              onClick={() => addToCart(recipe, 1)}
                              className="bg-bakery-dark text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-bakery-accent transition-all active:scale-95 shadow-sm"
                            >
                              Add Cart
                            </button>
                          ) : (
                            <button
                              disabled
                              className="bg-gray-50 text-gray-300 border border-gray-100 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-not-allowed"
                            >
                              Baking Soon
                            </button>
                          )}
                          <button
                            onClick={() => toggleWishlist(recipe._id)}
                            className="p-2.5 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Account Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-xl font-extrabold text-bakery-dark tracking-tight border-b border-gray-50 pb-4 uppercase">Settings</h3>

              {settingsSuccess && (
                <div className="p-4 text-xs font-bold text-green-600 bg-green-50 border border-green-100 rounded-2xl">
                  ✓ Profile updated successfully!
                </div>
              )}

              {settingsError && (
                <div className="p-4 text-xs font-bold text-red-500 bg-red-50 border border-red-100 rounded-2xl">
                  ⚠️ {settingsError}
                </div>
              )}

              <form onSubmit={handleSettingsSubmit} className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-bakery-accent uppercase tracking-wider transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-bakery-accent uppercase tracking-wider transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Change Password (Optional)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="ENTER NEW PASSWORD"
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-bakery-accent transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="px-8 py-4 bg-bakery-dark text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-bakery-accent transition-all active:scale-95 shadow-sm"
                >
                  {settingsLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
