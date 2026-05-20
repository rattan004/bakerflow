import React from 'react';

const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-16 animate-fadeIn">
      {/* Heritage Header */}
      <div className="text-center space-y-4">
        <span className="text-bakery-accent font-black text-[10px] uppercase tracking-[0.3em] block">Our Heritage</span>
        <h1 className="text-4xl md:text-6xl font-handwritten text-bakery-brown leading-none">
          Born from Ovens & Passion.
        </h1>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest max-w-lg mx-auto">
          Crafting premium recipes since 2026 in Ludhiana
        </p>
      </div>

      {/* Main Story Narrative */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-xs md:text-sm font-bold uppercase tracking-tight text-gray-500 leading-relaxed">
          <p>
            At <span className="text-bakery-dark font-black">BakerFlow</span>, our philosophy is simple: bakery items are not just food; they are a centuries-old craft of patience, temperature, and premium ingredients.
          </p>
          <p>
            We began in Ludhiana as a micro-bakery specializing in naturally leavened sourdough bread and luxury custom pastries. Every batch is calculated, measured, and baked fresh daily using zero preservatives.
          </p>
          <p className="text-bakery-accent font-black text-xs tracking-wider">
            No shortcuts, no compromises. Only organic flour, artisanal butter, and pure passion.
          </p>
        </div>
        
        {/* Stylized graphic/placeholder */}
        <div className="w-full h-80 bg-bakery-cream rounded-[2.5rem] flex items-center justify-center text-6xl shadow-sm border border-gray-100 select-none">
          🥖🌾🥐
        </div>
      </div>

      {/* Values Grid */}
      <div className="bg-white p-10 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
        <h3 className="text-lg font-black text-bakery-dark tracking-tighter uppercase text-center border-b border-gray-50 pb-4">
          Our Ovens Code
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2 text-center">
            <span className="text-3xl">🌾</span>
            <h4 className="font-extrabold text-bakery-dark text-sm tracking-tight">100% Organic</h4>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-tight leading-relaxed">
              We source single-origin organic grains directly from clean regional farms.
            </p>
          </div>

          <div className="space-y-2 text-center">
            <span className="text-3xl">⏰</span>
            <h4 className="font-extrabold text-bakery-dark text-sm tracking-tight">Slow Fermented</h4>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-tight leading-relaxed">
              Our sourdough undergoes a dedicated 24-hour cold fermentation for complex flavors.
            </p>
          </div>

          <div className="space-y-2 text-center">
            <span className="text-3xl">❤️</span>
            <h4 className="font-extrabold text-bakery-dark text-sm tracking-tight">Baked with Love</h4>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-tight leading-relaxed">
              Every croissant is laminated and hand-rolled individually by our master bakers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
