import React, { useState, useEffect } from 'react';
import API from '../api';
import { useStore } from '../context/StoreContext';

const StoreHome = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (selectedRecipe) {
      setQuantity(1);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [selectedRecipe]);

  const { addToCart, removeFromCart, cart, toggleWishlist, wishlist, checkRecipeAvailability, token } = useStore();
  const [pastOrderedRecipes, setPastOrderedRecipes] = useState([]);

  useEffect(() => {
    const fetchStoreItems = async () => {
      try {
        const res = await API.get('/api/recipes');
        // Only show recipes that have a selling price > 0
        const saleable = res.data.filter(r => r.sellingPrice > 0);
        setRecipes(saleable);
      } catch (err) {
        console.error("Failed fetching store menu", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStoreItems();
  }, []);

  useEffect(() => {
    const fetchPastOrders = async () => {
      if (!token) {
        setPastOrderedRecipes([]);
        return;
      }
      try {
        const res = await API.get('/api/user/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const uniqueNames = [];
        res.data.forEach(t => {
          if (t.recipeName && !uniqueNames.includes(t.recipeName)) {
            uniqueNames.push(t.recipeName);
          }
        });
        const orderedRecipes = uniqueNames
          .map(name => recipes.find(r => r.name?.toLowerCase() === name?.toLowerCase()))
          .filter(Boolean);
        setPastOrderedRecipes(orderedRecipes);
      } catch (err) {
        console.error("Failed to fetch customer past orders", err);
      }
    };
    
    if (recipes.length > 0) {
      fetchPastOrders();
    }
  }, [token, recipes]);

  const categories = ['All', 'Cakes', 'Pastries', 'Breads', 'Cookies'];

  const filteredRecipes = recipes.filter(r => {
    if (activeCategory === 'All') return true;
    return r.category?.toLowerCase() === activeCategory.toLowerCase();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-bakery-brown font-black animate-pulse tracking-widest uppercase text-xs">
          Loading Fresh Batches...
        </div>
      </div>
    );
  }

  // Helper to extract default nutritional facts
  const getNutritionFacts = (recipe) => {
    if (recipe.nutritionalFacts) return recipe.nutritionalFacts;
    // Premium defaults based on category
    const cat = recipe.category?.toLowerCase() || '';
    if (cat.includes('cake')) {
      return { calories: '380 kcal', protein: '5g', carbs: '48g', fat: '18g' };
    } else if (cat.includes('pastry') || cat.includes('croissant')) {
      return { calories: '310 kcal', protein: '6g', carbs: '38g', fat: '15g' };
    } else if (cat.includes('bread') || cat.includes('sourdough')) {
      return { calories: '240 kcal', protein: '8g', carbs: '44g', fat: '2g' };
    } else {
      return { calories: '180 kcal', protein: '3g', carbs: '22g', fat: '9g' };
    }
  };

  // Helper to extract default allergens
  const getAllergens = (recipe) => {
    if (recipe.allergens && recipe.allergens.length > 0) return recipe.allergens;
    const cat = recipe.category?.toLowerCase() || '';
    if (cat.includes('cake') || cat.includes('pastry')) {
      return ['Gluten', 'Dairy', 'Eggs'];
    } else if (cat.includes('bread') || cat.includes('sourdough')) {
      return ['Gluten'];
    } else {
      return ['Gluten', 'Dairy'];
    }
  };

  // Helper to extract default ingredients list sorted by weight descending
  const getIngredients = (recipe) => {
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      // Sort ingredients in descending order of amount (weight)
      const sorted = [...recipe.ingredients].sort((a, b) => (b.amount || 0) - (a.amount || 0));
      // Map to get the populated ingredient name
      const names = sorted.map(item => item.ingredientId?.name).filter(Boolean);
      if (names.length > 0) return names;
    }
    
    const cat = recipe.category?.toLowerCase() || '';
    if (cat.includes('bread') || cat.includes('sourdough')) {
      return ['Organic Stone-ground Wheat', 'Wild Sourdough Yeast Starter', 'Mineral Spring Water', 'Sea Salt'];
    } else if (cat.includes('cake')) {
      return ['Madagascar Bourbon Vanilla', 'Organic Raw Cane Sugar', 'A2 Grass-fed Dairy Cream', 'Pasture-raised Eggs', 'Organic Khapli Wheat Flour'];
    } else if (cat.includes('pastry')) {
      return ['Cultured French Butter (84% Fat)', 'Organic Khapli Wheat Flour', 'Pure Spring Water', 'Raw Sugar', 'Sea Salt'];
    } else {
      return ['Single-origin Madagascar Cocoa', 'A2 Cultured Butter', 'Khapli Wheat Flour', 'Wild Forest Honey'];
    }
  };

  const getRecommendations = () => {
    const others = recipes.filter(r => r._id !== selectedRecipe._id);
    const sameCategory = others.filter(r => r.category?.toLowerCase() === selectedRecipe.category?.toLowerCase());
    const differentCategory = others.filter(r => r.category?.toLowerCase() !== selectedRecipe.category?.toLowerCase());
    return [...sameCategory, ...differentCategory].slice(0, 3);
  };

  if (selectedRecipe) {
    const isAvailable = checkRecipeAvailability(selectedRecipe);
    const nutrition = getNutritionFacts(selectedRecipe);
    const allergens = getAllergens(selectedRecipe);
    const ingredients = getIngredients(selectedRecipe);
    const isWished = wishlist.some(item => item._id === selectedRecipe._id || item === selectedRecipe._id);

    return (
      <div className="animate-fadeIn max-w-7xl mx-auto px-6 md:px-12 py-12">
        {/* Back navigation & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <span>Catalogue</span>
            <span>&gt;</span>
            <span className="text-bakery-accent">{selectedRecipe.category || 'Gourmet'}</span>
            <span>&gt;</span>
            <span className="text-bakery-brown">{selectedRecipe.name}</span>
          </div>
          <button
            onClick={() => setSelectedRecipe(null)}
            className="flex items-center gap-2 text-bakery-brown hover:text-bakery-accent font-black text-xs uppercase tracking-widest transition-colors"
          >
            ← Back to Catalogue
          </button>
        </div>

        {/* Master Two-Column Presentation (Match reference layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT SIDE COLUMN: 5 Columns for Gourmet image & nutritional grid */}
          <div className="lg:col-span-5 space-y-8">
            {/* Gourmet Hero Image Card */}
            <div className="w-full aspect-square bg-bakery-cream rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm relative select-none">
              {selectedRecipe.image ? (
                <img
                  src={selectedRecipe.image}
                  alt={selectedRecipe.name}
                  className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-700"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = e.target.parentNode.querySelector('.emoji-fallback');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="emoji-fallback absolute inset-0 flex items-center justify-center text-[10rem]" style={{ display: selectedRecipe.image ? 'none' : 'flex' }}>
                {selectedRecipe.category?.toLowerCase().includes('cake') ? '🎂' : selectedRecipe.category?.toLowerCase().includes('bread') ? '🍞' : selectedRecipe.category?.toLowerCase().includes('pastry') ? '🥐' : '🍪'}
              </div>
            </div>

            {/* Premium Nutritional Grid Card (Matches Frosty Food style) */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-6">
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nutritional Value</h4>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Estimated metrics per 100g serving</p>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {/* Calories */}
                <div className="bg-amber-50/50 border border-amber-100/50 p-2.5 rounded-2xl text-center flex flex-col justify-center gap-1 h-16">
                  <p className="text-[8px] text-gray-400 font-black uppercase tracking-tight">Energy</p>
                  <p className="text-xs font-black text-bakery-dark">{nutrition.calories || '320 kcal'}</p>
                </div>
                {/* Fats */}
                <div className="bg-gray-50/70 border border-gray-100 p-2.5 rounded-2xl text-center flex flex-col justify-center gap-1 h-16">
                  <p className="text-[8px] text-gray-400 font-black uppercase tracking-tight">Fats</p>
                  <p className="text-xs font-black text-bakery-dark">{nutrition.fat || '12g'}</p>
                </div>
                {/* Protein */}
                <div className="bg-gray-50/70 border border-gray-100 p-2.5 rounded-2xl text-center flex flex-col justify-center gap-1 h-16">
                  <p className="text-[8px] text-gray-400 font-black uppercase tracking-tight">Protein</p>
                  <p className="text-xs font-black text-bakery-dark">{nutrition.protein || '6g'}</p>
                </div>
                {/* Carbs */}
                <div className="bg-gray-50/70 border border-gray-100 p-2.5 rounded-2xl text-center flex flex-col justify-center gap-1 h-16">
                  <p className="text-[8px] text-gray-400 font-black uppercase tracking-tight">Carbs</p>
                  <p className="text-xs font-black text-bakery-dark">{nutrition.carbs || '40g'}</p>
                </div>
                {/* Salt / Water */}
                <div className="bg-gray-50/70 border border-gray-100 p-2.5 rounded-2xl text-center flex flex-col justify-center gap-1 h-16">
                  <p className="text-[8px] text-gray-400 font-black uppercase tracking-tight">Salt</p>
                  <p className="text-xs font-black text-bakery-dark">0.2g</p>
                </div>
              </div>
            </div>

            {/* Allergens warning board */}
            {allergens && allergens.length > 0 ? (
              <div className="bg-red-50/50 border border-red-100 rounded-[2.5rem] p-8 shadow-sm space-y-3">
                <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest">Allergen Safety Disclaimers</h4>
                <div className="flex flex-wrap gap-2">
                  {allergens.map((all, i) => (
                    <span key={i} className="bg-white border border-red-200 text-red-500 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide">
                      ⚠️ Contains {all}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* RIGHT SIDE COLUMN: 7 Columns for Title, Description, Checkout details */}
          <div className="lg:col-span-7 space-y-8">
            {/* Purchase & Title Card (Frosty style top container) */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 md:p-10 shadow-sm space-y-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
        
                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${isAvailable ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                    {isAvailable ? '● In Stock' : '○ Sold Out'}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-bakery-dark tracking-tight leading-tight uppercase">
                  {selectedRecipe.name}
                </h1>
              </div>

              {/* Price & Weight info */}
              <div className="border-y border-gray-50 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Gourmet Price</p>
                  <p className="text-3xl font-black text-bakery-dark mt-1">₹{selectedRecipe.sellingPrice}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Weight</p>
                  <p className="text-lg font-black text-bakery-accent mt-1 lowercase">{selectedRecipe.baseYield || '1 unit'}</p>
                </div>
              </div>

              {/* Add to Cart Actions */}
              <div className="flex items-center gap-4">
                {isAvailable ? (() => {
                  const detailCartItem = cart.find(item => {
                    const itemRecipeId = (item.recipeId?._id || item.recipeId)?.toString();
                    return itemRecipeId === selectedRecipe._id.toString();
                  });
                  const detailCartQty = detailCartItem ? detailCartItem.quantity : 0;

                  if (detailCartQty > 0) {
                    return (
                      <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-1.5 rounded-2xl">
                        <button
                          onClick={() => {
                            if (detailCartQty === 1) {
                              removeFromCart(selectedRecipe._id);
                            } else {
                              addToCart(selectedRecipe, -1);
                            }
                          }}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 hover:bg-gray-50 text-bakery-dark font-black text-sm active:scale-95 transition-all select-none"
                        >
                          －
                        </button>
                        <span className="w-8 text-center text-sm font-black text-bakery-dark">
                          {detailCartQty}
                        </span>
                        <button
                          onClick={() => {
                            addToCart(selectedRecipe, 1);
                          }}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 hover:bg-gray-50 text-bakery-dark font-black text-sm active:scale-95 transition-all select-none"
                        >
                          ＋
                        </button>
                      </div>
                    );
                  }

                  return (
                    <button
                      onClick={() => {
                        addToCart(selectedRecipe, 1);
                      }}
                      className="flex-1 bg-bakery-accent hover:bg-amber-500 text-white font-black uppercase tracking-widest text-xs py-4 px-8 rounded-2xl shadow-md transition-all active:scale-95 text-center animate-pulseSlow"
                    >
                      Add to Cart
                    </button>
                  );
                })() : (
                  <button
                    disabled
                    className="flex-1 bg-gray-100 text-gray-300 border border-gray-200 font-black uppercase tracking-widest text-xs py-4 px-8 rounded-2xl cursor-not-allowed text-center"
                  >
                    Sold Out
                  </button>
                )}
                
                {/* Wishlist button */}
                <button
                  onClick={() => toggleWishlist(selectedRecipe._id)}
                  className="p-4 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50 text-slate-500 hover:text-red-500 shadow-sm transition-colors active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill={isWished ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Description</h4>
              <p className="text-gray-600 text-sm leading-relaxed font-bold tracking-tight">
                {selectedRecipe.description || "Indulge in a premium artisanal recipe meticulously proofed and baked by hand daily in our stone ovens."}
              </p>
            </div>

            {/* Ingredients Card */}
            {ingredients && ingredients.length > 0 ? (
              <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ingredients</h4>
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ing, i) => (
                    <span key={i} className="bg-bakery-cream/20 text-bakery-brown px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide">
                       {ing}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Recommended Items Grid */}
        <div className="border-t border-gray-100 pt-16 mt-16 space-y-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-bakery-dark tracking-tight uppercase">People Also Bought</h3>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Handcrafted items that pair perfectly with this selection</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getRecommendations().map((rec) => {
              const isRecAvailable = checkRecipeAvailability(rec);
              const recCartItem = cart.find(item => (item.recipeId?._id || item.recipeId)?.toString() === rec._id.toString());
              const recCartQty = recCartItem ? recCartItem.quantity : 0;

              return (
                <div 
                  key={rec._id} 
                  onClick={() => {
                    setSelectedRecipe(rec);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-white rounded-[2.5rem] border border-gray-100 p-6 flex flex-col justify-between group hover:shadow-md hover:border-bakery-accent/20 transition-all duration-300 cursor-pointer relative"
                >
                  {/* Image & Header */}
                  <div className="space-y-4">
                    <div className="w-full aspect-[4/3] bg-bakery-cream rounded-3xl overflow-hidden relative select-none">
                      {rec.image ? (
                        <img
                          src={rec.image}
                          alt={rec.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.parentNode.querySelector('.emoji-fallback');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="emoji-fallback absolute inset-0 flex items-center justify-center text-5xl" style={{ display: rec.image ? 'none' : 'flex' }}>
                        {rec.category?.toLowerCase().includes('cake') ? '🎂' : rec.category?.toLowerCase().includes('bread') ? '🍞' : rec.category?.toLowerCase().includes('pastry') ? '🥐' : '🍪'}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-bakery-accent uppercase tracking-wider">{rec.category}</span>
                      <h4 className="text-sm font-extrabold text-bakery-dark tracking-tight uppercase group-hover:text-bakery-accent transition-colors leading-snug line-clamp-1">{rec.name}</h4>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="border-t border-gray-50 pt-4 mt-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-black text-bakery-dark">₹{rec.sellingPrice}</p>
                      <p className="text-[8px] text-gray-400 font-bold lowercase mt-0.5">{rec.baseYield || '1 unit'}</p>
                    </div>

                    {isRecAvailable ? (() => {
                      if (recCartQty > 0) {
                        return (
                          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 p-0.5 rounded-lg" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                if (recCartQty === 1) {
                                  removeFromCart(rec._id);
                                } else {
                                  addToCart(rec, -1);
                                }
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-md bg-white border border-gray-100 hover:bg-gray-50 text-bakery-dark font-black text-xs active:scale-95 transition-all select-none"
                            >
                              －
                            </button>
                            <span className="w-4 text-center text-[10px] font-black text-bakery-dark">
                              {recCartQty}
                            </span>
                            <button
                              onClick={() => {
                                addToCart(rec, 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-md bg-white border border-gray-100 hover:bg-gray-50 text-bakery-dark font-black text-xs active:scale-95 transition-all select-none"
                            >
                              ＋
                            </button>
                          </div>
                        );
                      }

                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(rec, 1);
                          }}
                          className="bg-bakery-dark text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-bakery-accent hover:text-white transition-all shadow-sm active:scale-95"
                        >
                          Add
                        </button>
                      );
                    })() : (
                      <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Sold Out</span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="animate-fadeIn relative">
      {/* Premium Hero Section */}
      <section className="relative bg-bakery-dark text-white py-24 md:py-36 px-6 md:px-12 overflow-hidden flex flex-col justify-center border-b border-black">
        <div className="absolute inset-0 bg-[radial-gradient(#4A3728_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />

        <div className="relative max-w-4xl mx-auto text-center space-y-6 z-10">
          <p className="text-bakery-accent font-black text-[10px] uppercase tracking-[0.3em] animate-bounce">Aroma in the Air</p>
          <h1 className="text-5xl md:text-7xl font-handwritten text-bakery-cream select-none leading-none">
            Baked Fresh, Daily.
          </h1>
          <p className="text-slate-300 text-xs md:text-sm font-bold uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
            Experience organic bread, artisanal pastries, and luxury custom cakes crafted daily by hand in our Ludhiana ovens.
          </p>
          <div className="pt-4">
            <a href="#menu" className="inline-block bg-bakery-accent text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-amber-500 hover:shadow-lg active:scale-95 transition-all shadow-md">
              Explore Our Menu
            </a>
          </div>
        </div>
      </section>

      {/* Menu / Product Grid Section */}
      <section id="menu" className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <style dangerouslySetInnerHTML={{__html: `
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}} />

        {/* Order Again Section */}
        {pastOrderedRecipes && pastOrderedRecipes.length > 0 ? (
          <div className="mb-16 space-y-6">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-bakery-accent uppercase tracking-[0.3em]">Welcome Back</span>
              <h2 className="text-3xl font-extrabold text-bakery-dark tracking-tighter uppercase">Order It Again</h2>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Your favorite treats, freshly baked and ready to re-order</p>
            </div>

            {/* Horizontal Scroll Wrapper */}
            <div className="flex gap-6 overflow-x-auto pb-6 pt-2 scrollbar-hide snap-x snap-mandatory scroll-smooth -mx-6 px-6 md:-mx-12 md:px-12">
              {pastOrderedRecipes.map((recipe) => {
                const isAvailable = checkRecipeAvailability(recipe);
                const isWished = wishlist.some(item => item._id === recipe._id || item === recipe._id);
                const itemCartItem = cart.find(item => (item.recipeId?._id || item.recipeId)?.toString() === recipe._id.toString());
                const itemCartQty = itemCartItem ? itemCartItem.quantity : 0;

                return (
                  <div 
                    key={recipe._id} 
                    className="min-w-[280px] md:min-w-[320px] snap-start flex-shrink-0 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between group hover:shadow-md hover:border-bakery-accent/20 transition-all duration-300 relative"
                  >
                    {/* Floating Availability Badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm ${isAvailable ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                        {isAvailable ? '● Fresh' : '○ Baking Soon'}
                      </span>
                    </div>

                    {/* Card Main Body */}
                    <div 
                      onClick={() => setSelectedRecipe(recipe)}
                      className="p-6 space-y-4 cursor-pointer"
                    >
                      <div className="w-full h-40 bg-bakery-cream rounded-3xl flex items-center justify-center overflow-hidden border border-gray-100 relative select-none">
                        {recipe.image ? (
                          <img 
                            src={recipe.image} 
                            alt={recipe.name} 
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" 
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = e.target.parentNode.querySelector('.emoji-fallback');
                              if (fallback) fallback.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <span className="emoji-fallback text-4xl" style={{ display: recipe.image ? 'none' : 'block' }}>
                          {recipe.category?.toLowerCase().includes('cake') ? '🎂' : recipe.category?.toLowerCase().includes('bread') ? '🍞' : recipe.category?.toLowerCase().includes('pastry') ? '🥐' : '🍪'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-bakery-accent uppercase tracking-[0.2em]">{recipe.category || 'Bakery Premium'}</p>
                        <h3 className="text-lg font-extrabold text-bakery-dark tracking-tight leading-snug line-clamp-1 uppercase">{recipe.name}</h3>
                      </div>
                    </div>

                    {/* Card Bottom / Actions */}
                    <div className="p-6 pt-0 border-t border-gray-50 flex items-center justify-between gap-4 mt-auto">
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Price & Weight</p>
                        <p className="text-base font-black text-bakery-dark">
                          ₹{recipe.sellingPrice} <span className="text-xs font-bold text-gray-300 mx-1">|</span> <span className="text-xs font-bold text-bakery-accent lowercase">{recipe.baseYield || '1 unit'}</span>
                        </p>
                      </div>

                      {isAvailable ? (() => {
                        if (itemCartQty > 0) {
                          return (
                            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 p-0.5 rounded-lg" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  if (itemCartQty === 1) {
                                    removeFromCart(recipe._id);
                                  } else {
                                    addToCart(recipe, -1);
                                  }
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded-md bg-white border border-gray-100 hover:bg-gray-50 text-bakery-dark font-black text-xs active:scale-95 transition-all select-none"
                              >
                                －
                              </button>
                              <span className="w-4 text-center text-xs font-black text-bakery-dark">
                                {itemCartQty}
                              </span>
                              <button
                                onClick={() => {
                                  addToCart(recipe, 1);
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded-md bg-white border border-gray-100 hover:bg-gray-50 text-bakery-dark font-black text-xs active:scale-95 transition-all select-none"
                              >
                                ＋
                              </button>
                            </div>
                          );
                        }

                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(recipe, 1);
                            }}
                            className="bg-bakery-dark text-white px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-bakery-accent hover:text-white transition-all shadow-sm active:scale-95"
                          >
                            Add
                          </button>
                        );
                      })() : (
                        <button
                          disabled
                          className="bg-gray-50 text-gray-300 border border-gray-100 px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest cursor-not-allowed"
                        >
                          Sold Out
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="text-center mb-12 space-y-2">
          <h2 className="text-3xl font-extrabold text-bakery-dark tracking-tighter uppercase">Our Fresh Menu</h2>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Handcrafted items ready for delivery</p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3 rounded-2xl text-[11px] font-black tracking-widest transition-all uppercase ${activeCategory === cat
                ? 'bg-bakery-brown text-white shadow-lg'
                : 'bg-white text-bakery-brown border border-gray-100 hover:bg-bakery-cream/30'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-bold text-sm italic uppercase tracking-widest">
            Baking new items in this category soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRecipes.map((recipe) => {
              const isAvailable = checkRecipeAvailability(recipe);
              const isWished = wishlist.some(item => item._id === recipe._id || item === recipe._id);

              return (
                <div key={recipe._id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between group hover:shadow-md hover:border-bakery-accent/20 transition-all duration-300 relative">

                  {/* Floating Availability Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm ${isAvailable ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                      {isAvailable ? '● Freshly Baked' : '○ Baking Soon'}
                    </span>
                  </div>

                  {/* Floating Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(recipe._id);
                    }}
                    className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/80 backdrop-blur-md text-slate-500 hover:text-red-500 transition-colors shadow-sm active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill={isWished ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>

                  {/* Card Main Body (Clicking opens details modal) */}
                  <div 
                    onClick={() => setSelectedRecipe(recipe)}
                    className="p-8 space-y-4 cursor-pointer hover:bg-bakery-cream/5 transition-all duration-300"
                  >
                    {/* Placeholder image or nice stylized card header */}
                    <div className="w-full h-48 bg-bakery-cream rounded-3xl flex items-center justify-center overflow-hidden border border-gray-100 relative group-hover:scale-[1.02] transition-transform duration-500 select-none">
                      {recipe.image ? (
                        <img 
                          src={recipe.image} 
                          alt={recipe.name} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.parentNode.querySelector('.emoji-fallback');
                            if (fallback) fallback.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <span className="emoji-fallback text-4xl" style={{ display: recipe.image ? 'none' : 'block' }}>
                        {recipe.category?.toLowerCase().includes('cake') ? '🎂' : recipe.category?.toLowerCase().includes('bread') ? '🍞' : recipe.category?.toLowerCase().includes('pastry') ? '🥐' : '🍪'}
                      </span>
                      <div className="absolute inset-0 bg-bakery-dark/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-3 text-[8px] font-black uppercase tracking-widest text-bakery-brown bg-white/80 backdrop-blur-md px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        View Details
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-bakery-accent uppercase tracking-[0.2em]">{recipe.category || 'Bakery Premium'}</p>
                      <h3 className="text-xl font-extrabold text-bakery-dark tracking-tight leading-snug">{recipe.name}</h3>
                      <p className="text-gray-400 text-xs line-clamp-2">{recipe.description || 'Delicately handcrafted using luxury organic ingredients.'}</p>
                    </div>
                  </div>

                  {/* Card Bottom / Actions */}
                  <div className="p-8 pt-0 border-t border-gray-50 flex items-center justify-between gap-4 mt-auto">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Price & Weight</p>
                      <p className="text-xl font-black text-bakery-dark">
                        ₹{recipe.sellingPrice} <span className="text-xs font-bold text-gray-300 mx-1">|</span> <span className="text-sm font-bold text-bakery-accent lowercase">{recipe.baseYield || '1 unit'}</span>
                      </p>
                    </div>

                    {isAvailable ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(recipe, 1);
                        }}
                        className="bg-bakery-dark text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-bakery-accent hover:text-white transition-all shadow-sm active:scale-95"
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <button
                        disabled
                        className="bg-gray-50 text-gray-300 border border-gray-100 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
                      >
                        Sold Out
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};

export default StoreHome;
