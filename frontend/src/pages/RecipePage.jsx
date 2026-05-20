import React, { useState, useEffect } from 'react';
import API from '../api';
import RecipeCard from '../components/RecipeCard';
import AddRecipeModal from '../components/AddRecipeModal';
import EditRecipeModal from '../components/EditRecipeModal'; // 1. Import the new modal

const RecipePage = ({ userRole }) => {
  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // 2. Edit Modal state
  const [selectedRecipe, setSelectedRecipe] = useState(null);    // 3. Track which recipe to edit
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', subtitle: '' });
  const [viewMode, setViewMode] = useState('grid');

  const categories = ['All', 'Cakes', 'Breads', 'Cookies', 'Pastries', 'Savories'];

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const res = await API.get('/api/recipes');
      setRecipes(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching recipes:", err);
      setLoading(false);
    }
  };

  // 4. Function to trigger the Edit Modal
  const handleEditClick = (recipe) => {
    setSelectedRecipe(recipe);
    setIsEditModalOpen(true);
  };

  const handleStartProduction = async (recipeId, batches) => {
    try {
      await API.post(`/api/recipes/${recipeId}/bake`, { batches });
      fetchRecipes();
      setSuccessMessage({ title: 'Production Started', subtitle: 'Inventory Updated' });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Error starting production:", err);
      alert(err.response?.data?.message || "Error starting production");
    }
  };

  const handleDeleteRecipe = async (recipeId) => {
    if (window.confirm("Are you sure you want to delete this recipe?")) {
      try {
        await API.delete(`/api/recipes/${recipeId}`);
        fetchRecipes();
        setSuccessMessage({ title: 'Recipe Deleted', subtitle: 'Menu Updated' });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (err) {
        console.error("Delete failed", err);
        alert("Failed to delete recipe");
      }
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const name = recipe?.name || "";
    const category = recipe?.category || "Uncategorized";
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const totalRecipes = recipes.length;
  const bakeableCount = recipes.filter(recipe => 
    recipe?.ingredients?.every(ing => 
      (ing.ingredientId?.currentStock || 0) >= (ing.amount || 0)
    )
  ).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-bakery-brown font-black animate-pulse tracking-widest uppercase text-xs">
        Loading Menu...
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-full animate-fadeIn relative">
      
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-6 right-6 flex items-center gap-4 bg-bakery-dark text-white p-4 pr-8 rounded-2xl shadow-xl z-[9999] animate-bounce border border-white/5">
          <div className="flex items-center justify-center w-10 h-10 bg-bakery-accent/20 rounded-xl border border-bakery-accent/30 text-bakery-accent font-black">✓</div>
          <div>
            <p className="font-bold text-sm">{successMessage.title}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">{successMessage.subtitle}</p>
          </div>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-bakery-dark tracking-tighter">Recipe Dashboard</h2>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Menu & Production</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-bakery-dark text-white px-6 py-3 rounded-2xl font-black text-xs tracking-widest hover:bg-black transition-all shadow-lg shadow-bakery-dark/10"
        >
          + ADD NEW RECIPE
        </button>
      </div>

      {/* Stats Row (unchanged) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Menu</p>
          <p className="text-3xl font-black text-bakery-dark">{totalRecipes}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Ready to Bake</p>
          <p className="text-3xl font-black text-bakery-dark">{bakeableCount}</p>
        </div>
        <div className="bg-bakery-brown p-5 rounded-3xl shadow-lg shadow-bakery-brown/20 border border-bakery-brown">
          <p className="text-[10px] font-black text-bakery-accent uppercase tracking-widest mb-1">Kitchen Status</p>
          <p className="text-lg font-bold text-white leading-tight">
            {bakeableCount === totalRecipes ? "Optimal" : "Stock Shortage"}
          </p>
        </div>
      </div>

      {/* Filter Bar (unchanged) */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8 justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap tracking-widest border ${
                activeCategory === cat 
                ? 'bg-bakery-dark text-white border-bakery-dark shadow-md' 
                : 'bg-white text-gray-400 border-gray-100 hover:border-bakery-accent'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <input 
              type="text"
              placeholder="Search recipes..."
              className="w-full lg:w-72 px-5 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-bold focus:ring-2 focus:ring-bakery-accent outline-none transition-all shadow-sm"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex bg-white rounded-2xl border border-gray-100 p-1 shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-bakery-dark text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
              title="Grid View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-bakery-dark text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
              title="List View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {filteredRecipes.length > 0 ? (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6" : "flex flex-col gap-4"}>
          {filteredRecipes.map(recipe => (
            <RecipeCard 
              key={recipe._id} 
              recipe={recipe} 
              userRole={userRole} 
              viewMode={viewMode}
              onEdit={() => handleEditClick(recipe)} // 5. Pass edit handler to card
              onDelete={() => handleDeleteRecipe(recipe._id)}
              onStartProduction={(batches) => handleStartProduction(recipe._id, batches)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] p-20 text-center border border-dashed border-gray-200">
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No recipes found in this selection.</p>
        </div>
      )}

      {/* Modals */}
      <AddRecipeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={fetchRecipes} 
      />

      {/* 6. Edit Modal Integration */}
      <EditRecipeModal 
        isOpen={isEditModalOpen}
        recipeToEdit={selectedRecipe}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedRecipe(null);
        }}
        onRefresh={fetchRecipes}
      />
    </div>
  );
};

export default RecipePage;