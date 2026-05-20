import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

const WishlistPage = () => {
  const { wishlist, toggleWishlist, addToCart, checkRecipeAvailability } = useStore();

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 animate-fadeIn">
      <div className="mb-10 space-y-2">
        <h2 className="text-3xl font-extrabold text-bakery-dark tracking-tighter uppercase">My Wishlist</h2>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Your favorite handcrafted recipes</p>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-12 text-center border border-gray-100 shadow-sm space-y-4">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest italic">Your wishlist is empty.</p>
          <div className="pt-2">
            <Link to="/" className="inline-block bg-bakery-brown text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all">
              Explore Menu
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-8">
          <div className="divide-y divide-gray-50">
            {wishlist.map((recipe) => {
              const isAvailable = checkRecipeAvailability(recipe);
              return (
                <div key={recipe._id} className="py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-bakery-cream flex items-center justify-center text-2xl border border-gray-100 group-hover:scale-105 transition-transform">
                      🧁
                    </div>
                    <div>
                      <h4 className="font-extrabold text-bakery-dark text-sm tracking-tight">{recipe.name}</h4>
                      <p className="text-[10px] font-bold text-bakery-accent uppercase tracking-widest mt-1">
                        ₹{recipe.sellingPrice}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    {isAvailable ? (
                      <button 
                        onClick={() => addToCart(recipe, 1)}
                        className="bg-bakery-dark text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-bakery-accent transition-all active:scale-95 shadow-sm"
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <button 
                        disabled
                        className="bg-gray-50 text-gray-300 border border-gray-100 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
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
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
