import { useState, useEffect } from 'react';
import API from '../api';
import AddIngredientModal from '../components/AddIngredientModal';
import { toTitleCase } from '../utils/formatText';

const InventoryPage = () => {
  const [ingredients, setIngredients] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Modal & Edit States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: '', category: '', cost: 0, minThreshold: 5 });
  
  // Filter & Search State
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false); 
  const [logFilter, setLogFilter] = useState('All'); // New state for log filtering
  
  const categories = ['All', 'Dry Goods', 'Dairy', 'Toppings', 'Packaging'];

  // Sorting & Adjustment State
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [restockAmount, setRestockAmount] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('Expired / Spoilage');
  
  // AI Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResults, setScannedResults] = useState(null);
  const [showScanModal, setShowScanModal] = useState(false);

  useEffect(() => {
    fetchIngredients();
    fetchLogs();
  }, []);

  const fetchIngredients = async () => {
    try {
      const res = await API.get('/api/ingredients');
      setIngredients(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data", err);
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await API.get('/api/logs');
      setLogs(res.data.slice(0, 20)); // Increased slice to 20 for better filtering
    } catch (err) {
      console.error("Error fetching logs", err);
    }
  };

  // --- PROCESSING LOGIC ---

  const processedIngredients = ingredients
    .filter(ing => activeCategory === 'All' || ing.category === activeCategory)
    .filter(ing => (ing.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(ing => {
      if (showLowStockOnly) {
        return ing.currentStock < (ing.minThreshold || 5000);
      }
      return true;
    })
    .sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (sortConfig.key === 'totalValue') {
        aValue = (a.currentStock * a.cost);
        bValue = (b.currentStock * b.cost);
      }
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });

  const processedLogs = logs.filter(log => {
    const type = (log.type || '').toLowerCase();
    const selected = logFilter.toLowerCase();
    if (selected === 'all') return true;
    return type === selected;
  });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // --- ACTION HANDLERS ---

  const handleRefresh = () => {
    fetchIngredients();
    fetchLogs();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this ingredient?")) {
      try {
        await API.delete(`/api/ingredients/${id}`);
        handleRefresh();
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  const handleUpdate = async () => {
    try {
      await API.put(`/api/ingredients/${selectedItem._id}`, editData);
      setShowEditModal(false);
      handleRefresh();
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleManualAdjustment = async () => {
    if (!adjustAmount || !selectedItem) return;
    try {
      await API.post(`/api/ingredients/${selectedItem._id}/adjust`, {
        reductionAmount: parseFloat(adjustAmount) * 1000, 
        reason: adjustReason
      });
      setShowAdjustModal(false);
      setAdjustAmount('');
      handleRefresh();
    } catch (err) {
      console.error("Adjustment failed", err);
    }
  };

  const handleRestock = async () => {
    if (!restockAmount || !selectedItem) return;
    try {
      await API.post(`/api/ingredients/${selectedItem._id}/restock`, {
        addAmount: parseFloat(restockAmount) * 1000 
      });
      setShowRestockModal(false);
      setRestockAmount('');
      handleRefresh();
    } catch (err) {
      console.error("Restock failed", err);
    }
  };

  const handleAIScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('receipt', file);

    setIsScanning(true);

    try {
      const res = await API.post('/api/ingredients/scan-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setScannedResults(res.data.items);
      setShowScanModal(true);
      handleRefresh();
    } catch (err) {
      console.error("AI Scan failed", err);
      alert(err.response?.data?.error || "AI Scan failed to parse receipt. Please check image quality and verify your Gemini key.");
    } finally {
      setIsScanning(false);
      e.target.value = '';
    }
  };

  const SortIcon = ({ columnKey }) => {
    const isActive = sortConfig.key === columnKey;
    const isAsc = sortConfig.direction === 'ascending';
    return (
      <div className="flex flex-col ml-2 opacity-70">
        <svg className={`w-2.5 h-2.5 mb-0.5 ${isActive && isAsc ? 'text-bakery-accent' : 'text-bakery-brown'}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3l8 8H4l8-8z" />
        </svg>
        <svg className={`w-2.5 h-2.5 ${isActive && !isAsc ? 'text-bakery-accent' : 'text-bakery-brown'}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21l-8-8h16l-8 8z" />
        </svg>
      </div>
    );
  };

  return (
    <div className="animate-fadeIn pb-10 px-4 md:px-0">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-6 right-6 flex items-center gap-4 bg-bakery-dark text-white p-4 pr-8 rounded-2xl shadow-xl z-[9999] animate-bounce border border-white/5">
          <div className="flex items-center justify-center w-10 h-10 bg-bakery-accent/20 rounded-xl border border-bakery-accent/30 text-bakery-accent font-black">✓</div>
          <div>
            <p className="font-bold text-sm">Inventory Synced</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Database Updated</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 pt-4">
        <div>
          <h2 className="text-4xl font-handwritten text-bakery-brown">The Pantry</h2>
          <p className="text-gray-500 text-sm italic">Manage your bakery essentials</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 group">
          <p className="text-black font-black text-[10px] uppercase tracking-[0.2em] mb-1">Live Alerts</p>
          <div className={`h-1.5 w-10 rounded-full mb-4 transition-all duration-500 group-hover:w-24 ${ingredients.some(i => i.currentStock < (i.minThreshold || 5000)) ? 'bg-red-500' : 'bg-green-500'}`} />
          <h3 className="text-3xl font-extrabold text-bakery-brown tracking-tighter ">
            {ingredients.filter(i => i.currentStock < (i.minThreshold || 5000)).length > 0 ? 'Refill Needed' : 'All Healthy'}
          </h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 group">
          <p className="text-black font-black text-[10px] uppercase tracking-[0.2em] mb-1">Total Valuation</p>
          <div className="h-1.5 w-10 bg-bakery-accent rounded-full mb-4 group-hover:w-24 transition-all duration-500" />
          <h3 className="text-3xl font-extrabold text-bakery-dark tracking-tighter">
            ₹{processedIngredients.reduce((acc, curr) => acc + (curr.currentStock * curr.cost / 1000), 0).toLocaleString('en-IN')}
          </h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 group">
          <p className="text-black font-black text-[10px] uppercase tracking-[0.2em] mb-1">Item Count</p>
          <div className="h-1.5 w-10 bg-bakery-brown rounded-full mb-4 group-hover:w-24 transition-all duration-500" />
          <h3 className="text-3xl font-extrabold text-bakery-dark tracking-tighter">{processedIngredients.length} Items</h3>
        </div>
      </div>

      {/* Ingredient Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setShowLowStockOnly(false); }}
              className={`px-8 py-3 rounded-2xl text-[11px] font-black tracking-widest transition-all uppercase ${
                activeCategory === cat && !showLowStockOnly ? 'bg-bakery-brown text-white shadow-lg' : 'bg-white text-bakery-brown border border-gray-100 hover:bg-bakery-cream/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`px-6 py-3 rounded-2xl text-[11px] font-black tracking-widest transition-all uppercase flex items-center gap-2 ${
            showLowStockOnly ? 'bg-red-500 text-white shadow-red-200 shadow-lg' : 'bg-white text-red-500 border border-red-100 hover:bg-red-50'
          }`}
        >
          <span className={`w-2 h-2 rounded-full animate-pulse ${showLowStockOnly ? 'bg-white' : 'bg-red-500'}`} />
          {showLowStockOnly ? 'Showing Low Stock' : 'Low Stock Filter'}
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden mb-12">
        <div className="p-8 border-b border-gray-50 flex flex-col xl:flex-row justify-between items-center gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full xl:w-auto">
            <h3 className="font-black text-bakery-brown text-xs uppercase tracking-[0.25em] whitespace-nowrap">Inventory Ledger</h3>
            <div className="relative w-full sm:w-64 group">
              <input 
                type="text"
                placeholder="Search ledger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-[11px] font-bold focus:bg-white focus:border-bakery-accent outline-none transition-all"
              />
              <span className="absolute left-3.5 top-3 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
              </span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 w-full xl:w-auto">
            <input 
              type="file" 
              id="ai-scan-input" 
              accept="image/*" 
              className="hidden" 
              onChange={handleAIScan} 
            />
            <button 
              onClick={() => document.getElementById('ai-scan-input').click()}
              disabled={isScanning}
              className={`flex-1 sm:flex-none bg-bakery-accent/10 text-bakery-brown border border-bakery-accent/20 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-bakery-accent/20 transition-all ${isScanning ? 'animate-pulse opacity-70 cursor-wait' : ''}`}
            >
              {isScanning ? '⏳ Scanning...' : '📸 AI Scan'}
            </button>
            <button onClick={() => setShowRestockModal(true)} className="flex-1 sm:flex-none bg-bakery-cream text-bakery-brown px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg active:scale-95 transition-all">Restock Item</button>
            <button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none bg-bakery-dark text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg active:scale-95 transition-all">+ Add New</button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-10 py-6 cursor-pointer group" onClick={() => requestSort('name')}>
                  <div className="flex items-center text-black font-black text-[11px] uppercase tracking-[0.15em]">Ingredient <SortIcon columnKey="name" /></div>
                </th>
                <th className="px-10 py-6 text-center text-black font-black text-[11px] uppercase tracking-[0.15em]">Category</th>
                <th className="px-10 py-6 cursor-pointer group" onClick={() => requestSort('currentStock')}>
                  <div className="flex items-center justify-center text-black font-black text-[11px] uppercase tracking-[0.15em]">Stock <SortIcon columnKey="currentStock" /></div>
                </th>
                <th className="px-10 py-6 text-right text-black font-black text-[11px] uppercase tracking-[0.15em]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {processedIngredients.length === 0 ? (
                <tr><td colSpan="4" className="py-20 text-center text-gray-400 font-bold text-sm italic">No items match this filter</td></tr>
              ) : (
                processedIngredients.map((ing) => (
                  <tr key={ing._id} className="group hover:bg-bakery-cream/10 transition-all">
                    <td className="px-10 py-6 font-bold text-bakery-brown">{toTitleCase(ing.name)}</td>
                    <td className="px-10 py-6 text-center">
                      <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-4 py-1.5 rounded-full uppercase tracking-widest border border-gray-100">{ing.category}</span>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <div className="font-bold text-gray-700">{(ing.currentStock / 1000).toFixed(2)} kg</div>
                      <div className={`text-[9px] font-black tracking-widest mt-1 ${ing.currentStock <= 0 ? 'text-red-500' : ing.currentStock < (ing.minThreshold || 5000) ? 'text-yellow-500' : 'text-green-500'}`}>
                        {ing.currentStock <= 0 ? '● OUT OF STOCK' : ing.currentStock < (ing.minThreshold || 5000) ? '● LOW' : '● STOCKED'}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => {setSelectedItem(ing); setShowAdjustModal(true);}} className="p-2.5 rounded-xl bg-bakery-accent/10 text-bakery-brown hover:bg-bakery-accent hover:text-white transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg></button>
                        <button onClick={() => { setSelectedItem(ing); setEditData({ name: ing.name, category: ing.category, cost: ing.cost, minThreshold: ing.minThreshold / 1000 || 5 }); setShowEditModal(true); }} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-bakery-dark hover:text-white transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
                        <button onClick={() => handleDelete(ing._id)} className="p-2.5 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ACTIVITY LOGS SECTION --- */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <h3 className="font-black text-bakery-brown text-xs uppercase tracking-[0.25em]">Recent Activity Logs</h3>
          <div className="flex gap-2">
            {['All', 'Addition', 'Restock', 'Adjustment', 'Waste', 'Order', 'Production'].map((f) => (
              <button
                key={f}
                onClick={() => setLogFilter(f)}
                className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase transition-all border ${
                  logFilter === f ? 'bg-bakery-brown text-white border-bakery-brown' : 'bg-transparent text-gray-400 border-gray-100 hover:border-bakery-accent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4">
          {processedLogs.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm font-bold italic">No matching activities recorded.</p>
          ) : (
            <div className="space-y-3">
              {processedLogs.map((log, idx) => {
                const type = (log.type || 'Adjustment').toLowerCase();
                const isPositive = (log.quantity || 0) > 0;
                const typeLabelMap = {
                  addition: 'Added',
                  restock: 'Restocked',
                  adjustment: 'Adjusted',
                  waste: 'Wasted',
                  order: 'Used in Order',
                  production: 'Used in Production'
                };
                const typeLabel = typeLabelMap[type] || log.type || 'Updated';
                return (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-bakery-accent/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-400'}`} />
                      <div>
                        <p className="text-sm font-bold text-bakery-brown">
                          {typeLabel} <span className="text-bakery-dark">{toTitleCase(log.ingredientName)}</span>
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{((log.quantity || 0) / 1000).toFixed(2)} kg
                      </p>
                      <p className="text-[9px] text-gray-400 italic">{log.reason || 'Manual Update'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showRestockModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative border border-gray-50">
            <h2 className="text-2xl font-black text-bakery-dark tracking-tighter mb-1">Restock Item</h2>
            <p className="text-[10px] font-bold text-bakery-accent uppercase tracking-widest mb-8">Increase Inventory Levels</p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Ingredient</label>
                <select 
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none"
                  onChange={(e) => setSelectedItem(ingredients.find(i => i._id === e.target.value))}
                  value={selectedItem?._id || ''}
                >
                  <option value="">Choose item...</option>
                  {ingredients.map(ing => (
                    <option key={ing._id} value={ing._id}>{toTitleCase(ing.name)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quantity to Add (kg)</label>
                <input 
                  type="number"
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none"
                  placeholder="e.g. 5.5"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowRestockModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
                <button onClick={handleRestock} className="flex-2 px-8 py-4 bg-bakery-dark text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">Confirm Restock</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ADJUST MODAL --- */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative border border-gray-50">
            <h2 className="text-2xl font-black text-bakery-dark tracking-tighter mb-1">Manual Adjustment</h2>
            <p className="text-[10px] font-bold text-bakery-accent uppercase tracking-widest mb-8">Reduce {toTitleCase(selectedItem?.name)}</p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reduction Amount (kg)</label>
                <input 
                  type="number"
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none"
                  placeholder="e.g. 0.5"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason</label>
                <select 
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                >
                  <option>Expired / Spoilage</option>
                  <option>Spillage</option>
                  <option>Quality Control</option>
                  <option>Theft / Loss</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowAdjustModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
                <button onClick={handleManualAdjustment} className="flex-2 px-8 py-4 bg-bakery-dark text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">Submit Loss</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {showEditModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative border border-gray-50">
            <h2 className="text-2xl font-black text-bakery-dark tracking-tighter mb-1">Edit Ingredient</h2>
            <p className="text-[10px] font-bold text-bakery-accent uppercase tracking-widest mb-8">Updating Details</p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ingredient Name</label>
                <input 
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none"
                  value={editData.name}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  placeholder="Name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                <select 
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none"
                  value={editData.category}
                  onChange={(e) => setEditData({...editData, category: e.target.value})}
                >
                  {categories.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cost per kg</label>
                  <input 
                    type="number"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none"
                    value={editData.cost}
                    onChange={(e) => setEditData({...editData, cost: e.target.value})}
                    placeholder="Cost per kg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Min Stock (kg)</label>
                  <input 
                    type="number"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none"
                    value={editData.minThreshold}
                    onChange={(e) => setEditData({...editData, minThreshold: e.target.value})}
                    placeholder="Min Threshold (kg)"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowEditModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
                <button onClick={handleUpdate} className="flex-2 px-8 py-4 bg-bakery-dark text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AddIngredientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={handleRefresh}
        categories={categories.filter(c => c !== 'All')} 
      />

      {/* --- AI SCAN SUMMARY MODAL --- */}
      {showScanModal && scannedResults && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl relative border border-gray-50 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-bakery-dark tracking-tighter mb-1">📸 AI Scan Completed</h2>
                <p className="text-[10px] font-bold text-bakery-accent uppercase tracking-widest">Inventory & Financial Ledger Synced</p>
              </div>
              <button 
                onClick={() => setShowScanModal(false)}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <p className="text-gray-400 text-xs leading-relaxed font-bold uppercase tracking-tight">
                Gemini parsed your bill and dynamically updated your ingredients list, running cost valuations, and logged the total material expense in the finance database.
              </p>

              <div className="divide-y divide-gray-50 border border-gray-100 rounded-3xl overflow-hidden shadow-sm bg-gray-50/50">
                {scannedResults.map((item, idx) => (
                  <div key={idx} className="p-5 flex justify-between items-center bg-white hover:bg-bakery-cream/5 transition-all">
                    <div>
                      <h4 className="font-extrabold text-bakery-dark text-sm tracking-tight">{toTitleCase(item.name)}</h4>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider mt-0.5">{item.category}</p>
                    </div>
                    <div className="text-right flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs font-black text-green-600">+{ (item.addedStock / 1000).toFixed(2) } kg</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Value: ₹{ item.totalCost }</p>
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                        item.actionType === 'Addition' 
                          ? 'bg-amber-50 text-amber-600 border-amber-100' 
                          : 'bg-green-50 text-green-600 border-green-100'
                      }`}>
                        {item.actionType === 'Addition' ? '✨ NEW ITEM' : '✓ RESTOCKED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowScanModal(false)} 
                  className="w-full py-4 bg-bakery-dark text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-md"
                >
                  Close & View Inventory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;