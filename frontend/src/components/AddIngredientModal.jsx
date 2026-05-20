import { useState } from 'react';
import API from '../api';
import { toTitleCase } from '../utils/formatText';

const AddIngredientModal = ({ isOpen, onClose, onRefresh, categories }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Dry Goods',
    currentStock: '',
    cost: '',
    minThreshold: '5' // Added default of 5kg
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert kg to grams before sending to the backend
      const payload = {
        ...formData,
        name: toTitleCase(formData.name),
        currentStock: parseFloat(formData.currentStock) * 1000,
        cost: parseFloat(formData.cost),
        minThreshold: parseFloat(formData.minThreshold) * 1000
      };

      await API.post('/api/ingredients', payload);
      onRefresh(); // Refresh the list in InventoryPage
      onClose(); // Close modal
      setFormData({ name: '', category: 'Dry Goods', currentStock: '', cost: '', minThreshold: '5' });
    } catch (err) {
      console.error("Error adding ingredient:", err);
      alert(err.response?.data?.message || "Failed to add ingredient");
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-bakery-dark/30">
      <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-fadeIn">
        <h3 className="text-2xl font-bold text-bakery-dark mb-6">New Ingredient</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-bakery-brown uppercase tracking-widest mb-2 ml-1">Name</label>
            <input 
              required
              className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-bakery-accent font-bold"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. All Purpose Flour"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-bakery-brown uppercase tracking-widest mb-2 ml-1">Category</label>
              <select 
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-bakery-brown uppercase tracking-widest mb-2 ml-1">Min Threshold (kg)</label>
              <input 
                type="number"
                step="0.1"
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold"
                value={formData.minThreshold}
                onChange={(e) => setFormData({...formData, minThreshold: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-bakery-brown uppercase tracking-widest mb-2 ml-1">Initial Stock (kg)</label>
              <input 
                type="number"
                step="0.01"
                required
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold"
                value={formData.currentStock}
                onChange={(e) => setFormData({...formData, currentStock: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-bakery-brown uppercase tracking-widest mb-2 ml-1">Cost (per kg)</label>
              <input 
                type="number"
                step="0.01"
                required
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
                placeholder="₹"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-gray-400">Cancel</button>
            <button type="submit" className="flex-1 py-4 bg-bakery-dark text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all">Save to Pantry</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddIngredientModal;