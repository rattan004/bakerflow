import { useState, useEffect } from 'react';
import API from '../api';
import { toTitleCase } from '../utils/formatText';

const AddRecipeModal = ({ isOpen, onClose, onRefresh }) => {
  const [ingredients, setIngredients] = useState([]);
  const [recipe, setRecipe] = useState({
    name: '',
    category: 'Cakes',
    ingredients: [{ ingredientId: '', quantity: '' }],
    sellingPrice: '',
    estYield: '',
    description: '',
    allergens: [],
    image: '',
    nutritionalFacts: {
      calories: '',
      carbs: '',
      protein: '',
      fat: ''
    }
  });

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const res = await API.get('/api/ingredients');
        setIngredients(res.data);
      } catch (err) {
        console.error("Error fetching ingredients", err);
      }
    };
    if (isOpen) fetchIngredients();
  }, [isOpen]);

  const handleAddIngredient = () => {
    setRecipe({ ...recipe, ingredients: [...recipe.ingredients, { ingredientId: '', quantity: '' }] });
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...recipe.ingredients];
    newIngredients[index][field] = value;
    setRecipe({ ...recipe, ingredients: newIngredients });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!recipe.image || !recipe.image.trim()) {
    alert("Recipe Image URL is required to present a premium storefront!");
    return;
  }

  const formattedRecipe = {
    name: recipe.name,
    category: recipe.category,
    image: recipe.image,
    sellingPrice: parseFloat(recipe.sellingPrice) || 0,
    // Map your frontend 'estYield' to the schema's 'baseYield'
    baseYield: recipe.estYield || '1 Batch', 
    description: recipe.description,
    allergens: recipe.allergens,
    nutritionalFacts: {
      calories: recipe.nutritionalFacts.calories || '',
      carbs: recipe.nutritionalFacts.carbs || '',
      protein: recipe.nutritionalFacts.protein || '',
      fat: recipe.nutritionalFacts.fat || ''
    },
    ingredients: recipe.ingredients.map(item => ({
      ingredientId: item.ingredientId,
      // Map 'quantity' to 'amount' as required by your schema
      amount: parseFloat(item.quantity) || 0 
    }))
  };

  try {
    const response = await API.post('/api/recipes', formattedRecipe);
    console.log("Recipe saved successfully:", response.data);
    onRefresh();
    onClose();
  } catch (err) {
    console.error("Server Error Details:", err.response?.data);
    // This helps you see validation errors like missing categories or IDs
  }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fadeIn">
      {/* max-w-2xl is the "Sweet Spot" - wider than original but not full screen */}
      <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] shadow-2xl relative border border-gray-50 flex flex-col overflow-hidden">
        
        {/* Fixed Header */}
        <div className="p-8 pb-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-bakery-dark tracking-tighter mb-0.5">New Recipe</h2>
            <p className="text-[10px] font-bold text-bakery-accent uppercase tracking-[0.2em]">Add to Menu</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-red-500 transition-colors text-3xl font-light">×</button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Recipe Name</label>
              <input 
                className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none"
                placeholder="e.g. Truffle Cake"
                value={recipe.name}
                onChange={(e) => setRecipe({...recipe, name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
              <select 
                className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none"
                value={recipe.category}
                onChange={(e) => setRecipe({...recipe, category: e.target.value})}
              >
                <option>Cakes</option>
                <option>Breads</option>
                <option>Cookies</option>
                <option>Pastries</option>
                <option>Savories</option>
              </select>
            </div>
          </div>

          {/* Ingredient List Container */}
          <div className="bg-gray-50/50 rounded-3xl p-6 mb-8 border border-gray-100">
            <label className="text-[10px] font-black text-bakery-brown uppercase tracking-widest block mb-4 ml-1">Ingredients Breakdown</label>
            <div className="space-y-3">
              {recipe.ingredients.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <select 
                    className="flex-1 p-3.5 bg-white border border-gray-100 rounded-xl text-sm font-bold outline-none"
                    value={item.ingredientId}
                    onChange={(e) => handleIngredientChange(index, 'ingredientId', e.target.value)}
                    required
                  >
                    <option value="">Select...</option>
                    {ingredients.map(ing => (
                      <option key={ing._id} value={ing._id}>{toTitleCase(ing.name)}</option>
                    ))}
                  </select>
                  <input 
                    type="number"
                    className="w-24 p-3.5 bg-white border border-gray-100 rounded-xl text-sm font-bold outline-none text-center"
                    placeholder="Grams"
                    value={item.quantity}
                    onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                    required
                  />
                </div>
              ))}
            </div>
            <button 
              type="button"
              onClick={handleAddIngredient}
              className="mt-4 text-[10px] font-black text-bakery-accent uppercase tracking-[0.15em] hover:text-bakery-brown transition-all flex items-center gap-1"
            >
              <span className="text-lg">+</span> Add Item
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price (₹)</label>
              <input 
                type="number"
                className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none"
                placeholder="0.00"
                value={recipe.sellingPrice}
                onChange={(e) => setRecipe({...recipe, sellingPrice: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Est. Yield</label>
              <input 
                className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none"
                placeholder="e.g. 1 Unit"
                value={recipe.estYield}
                onChange={(e) => setRecipe({...recipe, estYield: e.target.value})}
              />
            </div>
          </div>

          {/* PREMIUM STOREFRONT CARD METADATA */}
          <div className="mt-8 border-t border-gray-100 pt-6 space-y-6">
            <h3 className="text-xs font-black text-bakery-brown uppercase tracking-widest">Storefront Item Card Presentation</h3>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Luxury Item Description</label>
              <textarea 
                className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none resize-none h-20"
                placeholder="Indulge in a premium artisanal recipe meticulously proofed and baked by hand daily..."
                value={recipe.description}
                onChange={(e) => setRecipe({...recipe, description: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gourmet Image URL <span className="text-red-500">*</span></label>
              <input 
                className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold outline-none focus:border-bakery-accent/30 transition-all"
                placeholder="e.g. https://images.unsplash.com/photo-1578985545062-69928b1d9587 (Required)"
                value={recipe.image}
                onChange={(e) => setRecipe({...recipe, image: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Allergens Disclaimer</label>
              <div className="flex flex-wrap gap-2">
                {['Gluten', 'Dairy', 'Eggs', 'Nuts', 'Soy'].map(allergen => {
                  const isActive = recipe.allergens.includes(allergen);
                  return (
                    <button
                      key={allergen}
                      type="button"
                      onClick={() => {
                        const newAllergens = isActive
                          ? recipe.allergens.filter(a => a !== allergen)
                          : [...recipe.allergens, allergen];
                        setRecipe({...recipe, allergens: newAllergens});
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                        isActive
                          ? 'bg-red-50 text-red-600 border-red-200 shadow-sm'
                          : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      {isActive ? '✓ ' : ''}{allergen}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Nutritional Information Facts</label>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block ml-1">Energy</label>
                  <input 
                    className="w-full p-3.5 bg-gray-50 border-none rounded-xl text-xs font-bold outline-none text-center"
                    placeholder="e.g. 350 kcal"
                    value={recipe.nutritionalFacts.calories}
                    onChange={(e) => setRecipe({
                      ...recipe,
                      nutritionalFacts: { ...recipe.nutritionalFacts, calories: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block ml-1">Carbs</label>
                  <input 
                    className="w-full p-3.5 bg-gray-50 border-none rounded-xl text-xs font-bold outline-none text-center"
                    placeholder="e.g. 45g"
                    value={recipe.nutritionalFacts.carbs}
                    onChange={(e) => setRecipe({
                      ...recipe,
                      nutritionalFacts: { ...recipe.nutritionalFacts, carbs: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block ml-1">Protein</label>
                  <input 
                    className="w-full p-3.5 bg-gray-50 border-none rounded-xl text-xs font-bold outline-none text-center"
                    placeholder="e.g. 6g"
                    value={recipe.nutritionalFacts.protein}
                    onChange={(e) => setRecipe({
                      ...recipe,
                      nutritionalFacts: { ...recipe.nutritionalFacts, protein: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block ml-1">Fat</label>
                  <input 
                    className="w-full p-3.5 bg-gray-50 border-none rounded-xl text-xs font-bold outline-none text-center"
                    placeholder="e.g. 12g"
                    value={recipe.nutritionalFacts.fat}
                    onChange={(e) => setRecipe({
                      ...recipe,
                      nutritionalFacts: { ...recipe.nutritionalFacts, fat: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Fixed Footer */}
        <div className="p-8 pt-4 flex gap-3">
          <button onClick={onClose} type="button" className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 py-4 bg-bakery-dark text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">Save Recipe</button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
      `}} />
    </div>
  );
};

export default AddRecipeModal;