import { Link } from 'react-router-dom';

const StoreFooter = () => {
  return (
    <footer className="bg-bakery-dark text-white pt-16 pb-8 px-6 md:px-12 border-t border-black">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-4">
          <span className="text-xl font-black tracking-tighter uppercase">
            Baker<span className="text-bakery-accent font-handwritten normal-case text-2xl ml-0.5">Flow</span>
          </span>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xs font-bold uppercase tracking-tight">
            Crafting premium, daily baked goodness using only the finest organic ingredients since 2026.
          </p>
        </div>

        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-bakery-accent">Quick Links</h4>
          <ul className="space-y-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <li><Link to="/" className="hover:text-white transition-colors">Shop Menu</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">Our Heritage</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Locate Store</Link></li>
            <li><Link to="/admin" className="hover:text-white transition-colors text-bakery-accent font-black">Admin Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-bakery-accent">Opening Hours</h4>
          <ul className="space-y-2 text-slate-400 text-xs font-bold uppercase tracking-tight">
            <li>MON - FRI: 7:00 AM - 8:00 PM</li>
            <li>SAT - SUN: 8:00 AM - 9:00 PM</li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-bakery-accent">Newsletter</h4>
          <p className="text-slate-400 text-xs leading-relaxed mb-4 font-bold uppercase tracking-tight">
            Subscribe for secret recipes, fresh batches, and premium events.
          </p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="YOUR EMAIL" 
              className="bg-zinc-800 border-none rounded-xl px-4 py-2.5 text-xs outline-none text-white w-full uppercase tracking-wider font-bold" 
            />
            <button className="bg-bakery-accent text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 transition-colors">
              Join
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800 pt-8 text-center text-slate-500 text-[10px] font-black uppercase tracking-widest">
        &copy; {new Date().getFullYear()} BakerFlow. All Rights Reserved. Crafted with passion.
      </div>
    </footer>
  );
};

export default StoreFooter;
