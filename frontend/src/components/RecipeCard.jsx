import React, { useState } from 'react';
import { toTitleCase } from '../utils/formatText';

const RecipeCard = ({ recipe, onEdit, onDelete, onStartProduction, userRole, viewMode = 'grid' }) => {
  const [batches, setBatches] = useState(1);

  // Profit Margin Calc
  const totalCost = recipe?.ingredients?.reduce((acc, ing) => {
    const costPerKg = ing.ingredientId?.cost ?? 0;
    const amountInGrams = ing.amount ?? 0;
    return acc + (costPerKg * amountInGrams) / 1000;
  }, 0) ?? 0;
  
  const sellingPrice = recipe?.sellingPrice ?? 0;
  const profit = sellingPrice - totalCost;
  const marginPercent = sellingPrice > 0 ? ((profit / sellingPrice) * 100).toFixed(0) : 0;

  // Safety Guard: Pre-calculate if bakeable
  const isBakeable = recipe?.ingredients?.every(ing => {
    const currentStock = ing.ingredientId?.currentStock ?? 0;
    const requiredAmount = (ing.amount ?? 0) * batches;
    return currentStock >= requiredAmount;
  }) ?? false;

  // ------------------------------------------
  // LIST VIEW
  // ------------------------------------------
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:bg-gray-50 transition-all flex flex-col md:flex-row items-center justify-between gap-4 group">
        
        {/* Info Section */}
        <div className="flex-1 flex items-center gap-6 w-full">
          <div className="w-24 shrink-0">
            <span className="text-[10px] font-black text-bakery-accent uppercase tracking-widest block mb-1">
              {recipe?.category || 'Uncategorized'}
            </span>
            <div className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-tight inline-block ${
              isBakeable ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              ● {isBakeable ? 'READY' : 'SHORTAGE'}
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-black text-bakery-dark">{recipe?.name || "Unnamed Recipe"}</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
              Yields: {recipe?.baseYield || '1 Batch'}
            </p>
          </div>

          {userRole === 'CEO' && (
            <div className="w-32 text-right border-r border-gray-200 pr-6 mr-2 shrink-0 hidden sm:block">
              <p className="text-sm font-black text-bakery-dark">₹{sellingPrice}</p>
              <p className="text-[9px] font-bold text-green-500 uppercase">
                {marginPercent}% Margin
              </p>
            </div>
          )}
        </div>

        {/* Action Section */}
        <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0 justify-end shrink-0">
          {/* Batches */}
          <div className="flex items-center justify-between bg-white rounded-xl px-2 py-1.5 border border-gray-200 w-20">
            <button onClick={() => setBatches(Math.max(1, batches - 1))} className="text-gray-400 hover:text-bakery-dark font-black text-md leading-none px-1">-</button>
            <span className="font-black text-bakery-dark text-xs">{batches}</span>
            <button onClick={() => setBatches(batches + 1)} className="text-gray-400 hover:text-bakery-dark font-black text-md leading-none px-1">+</button>
          </div>

          <button 
            disabled={!isBakeable}
            onClick={() => onStartProduction(batches)}
            className={`px-6 py-2.5 rounded-xl font-black text-[10px] tracking-[0.1em] uppercase transition-all whitespace-nowrap ${
              isBakeable 
              ? 'bg-bakery-dark text-white hover:bg-black active:scale-95 shadow-lg shadow-bakery-dark/10' 
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            BAKE
          </button>

          {/* Edit / Delete Icons */}
          {userRole === 'CEO' && (
            <div className="flex gap-1 ml-2">
              {onEdit && (
                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 text-gray-400 hover:bg-gray-200 hover:text-bakery-dark rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              )}
              {onDelete && (
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    );
  }

  // ------------------------------------------
  // GRID VIEW (Default)
  // ------------------------------------------
  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 animate-fadeIn flex flex-col justify-between h-full relative group">
      
      {/* 2. SMOOTH SLIDING ACTION BUTTONS (CEO ONLY) */}
      {userRole === 'CEO' && (
        <div className="absolute top-5 right-6 flex gap-2 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 z-10">
          {onEdit && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 bg-gray-50 text-gray-400 hover:bg-bakery-dark hover:text-white rounded-xl shadow-sm"
              title="Edit Recipe"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
          )}
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white rounded-xl shadow-sm"
              title="Delete Recipe"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          )}
        </div>
      )}

      {/* Header: Name and Status */}
      <div className="mb-4">
        <div className="flex justify-between items-start mb-1">
          <span className="text-[10px] font-black text-bakery-accent uppercase tracking-widest">
            {recipe?.category || 'Uncategorized'}
          </span>
          
          {/* 3. DYNAMIC SLIDING BADGE */}
          <div className={`px-3 py-1 rounded-full text-[9px] font-black tracking-tight transition-transform duration-300 transform ${
            isBakeable ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          } ${userRole === 'CEO' ? 'group-hover:-translate-x-16' : ''}`}>
            ● {isBakeable ? 'READY' : 'SHORTAGE'}
          </div>
        </div>
        <h3 className="text-xl font-black text-bakery-dark leading-tight pr-12">
          {recipe?.name || "Unnamed Recipe"}
        </h3>
      </div>

      {/* Ingredient Checklist */}
      <div className="space-y-2 mb-6 flex-1">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Requirements</p>
        <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar space-y-1">
          {recipe?.ingredients?.map((ing, idx) => {
            const stock = ing.ingredientId?.currentStock ?? 0;
            const name = toTitleCase(ing.ingredientId?.name || ing.name || "Missing Item");
            const isMissing = !ing.ingredientId;
            const requiredAmount = (ing.amount ?? 0) * batches;
            const isLow = stock < requiredAmount;

            return (
              <div key={idx} className="flex flex-col py-1.5 border-b border-gray-50 last:border-0">
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-bold ${isMissing ? 'text-red-300 italic line-through' : 'text-gray-500'}`}>
                    {name} {isMissing && "(Deleted)"}
                  </span>
                  <span className={`font-mono font-black ${isLow ? 'text-red-500' : 'text-bakery-brown'}`}>
                    {requiredAmount}g
                  </span>
                </div>
                {isLow && !isMissing && (
                  <p className="text-[9px] text-red-500 font-bold mt-0.5 text-right uppercase tracking-wider">
                    Missing {requiredAmount - stock}g
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer: Profit, Yield & Action button */}
      <div className="border-t border-gray-50 pt-4 mt-auto">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Yield</p>
            <p className="text-sm font-bold text-bakery-brown">{recipe?.baseYield || '1 Batch'}</p>
          </div>

          {/* Pricing visible for CEO/Owner role only */}
          {userRole === 'CEO' && (
            <div className="text-right">
              <p className="text-[10px] font-black text-bakery-accent uppercase tracking-widest">Price / Margin</p>
              <p className="text-lg font-black text-bakery-dark leading-tight">₹{sellingPrice}</p>
              <p className="text-[9px] font-bold text-green-500 tracking-wider uppercase mt-0.5">
                ₹{profit.toFixed(0)} PROFIT ({marginPercent}%)
              </p>
            </div>
          )}
        </div>

        {/* Primary Action Button & Batch Selector */}
        <div className="flex gap-2">
          <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-3 py-2 border border-gray-100 w-24 shrink-0">
            <button 
              onClick={() => setBatches(Math.max(1, batches - 1))}
              className="text-gray-400 hover:text-bakery-dark font-black text-lg w-6 h-6 flex items-center justify-center leading-none"
            >-</button>
            <span className="font-black text-bakery-dark text-xs">{batches}</span>
            <button 
              onClick={() => setBatches(batches + 1)}
              className="text-gray-400 hover:text-bakery-dark font-black text-lg w-6 h-6 flex items-center justify-center leading-none"
            >+</button>
          </div>
          <button 
            disabled={!isBakeable}
            onClick={() => onStartProduction(batches)}
            className={`flex-1 py-4 rounded-2xl font-black text-[10px] tracking-[0.15em] uppercase transition-all ${
              isBakeable 
              ? 'bg-bakery-dark text-white hover:bg-black shadow-lg shadow-bakery-dark/10 active:scale-95' 
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            {isBakeable ? 'START PRODUCTION' : 'INSUFFICIENT'}
          </button>
        </div>
      </div>

      {/* Inline styles for cleaning up the nested card scrollbar layout */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #F3F4F6;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #E5E7EB;
        }
      `}} />
    </div>
  );
};

export default RecipeCard;