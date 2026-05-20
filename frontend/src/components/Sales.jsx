import React, { useState, useEffect } from 'react';
import API from '../api';

const Sales = ({ onOrderComplete }) => {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    API.get('/api/recipes').then(res => setRecipes(res.data));
  }, []);

  const handleSale = async () => {
    try {
      const res = await API.post('/api/orders', {
        recipeId: selectedRecipe,
        quantitySold: Number(qty)
      });
      alert(res.data.message);
      onOrderComplete(); // This will refresh our inventory table!
    } catch (err) {
      alert(err.response?.data?.message || "Sale failed");
    }
  };

  return (
    <div className="p-6 bg-green-50 rounded-xl shadow-inner border-2 border-green-200 mt-6">
      <h2 className="text-xl font-bold text-green-800 mb-4">Register a Sale</h2>
      <div className="flex gap-4">
        <select 
          className="p-2 border flex-1" 
          onChange={(e) => setSelectedRecipe(e.target.value)}
          value={selectedRecipe}
        >
          <option value="">Select a Product...</option>
          {recipes.map(r => (
            <option key={r._id} value={r._id}>{r.productName}</option>
          ))}
        </select>
        
        <input 
          type="number" 
          className="w-20 p-2 border" 
          value={qty} 
          onChange={(e) => setQty(e.target.value)} 
          min="1"
        />
        
        <button 
          onClick={handleSale}
          className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800"
        >
          Sell & Deduct Stock
        </button>
      </div>
    </div>
  );
};

export default Sales;