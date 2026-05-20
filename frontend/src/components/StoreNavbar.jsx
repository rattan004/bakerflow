import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

const StoreNavbar = () => {
  const { customer, cart, wishlist, logout } = useStore();

  const totalCartItems = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 px-6 md:px-12 flex items-center justify-between transition-all">
      <Link to="/" className="flex items-center gap-2 group">
        <span className="text-2xl font-black text-bakery-dark tracking-tighter uppercase">
          Baker<span className="text-bakery-accent font-handwritten normal-case text-3xl ml-0.5">Flow</span>
        </span>
      </Link>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-slate-500">
        <Link to="/" className="hover:text-bakery-brown transition-colors">Home</Link>
        <Link to="/about" className="hover:text-bakery-brown transition-colors">Our Story</Link>
        <Link to="/contact" className="hover:text-bakery-brown transition-colors">Contact</Link>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6">
        {/* Wishlist */}
        {customer && (
          <Link to="/wishlist" className="relative p-2 text-slate-600 hover:text-bakery-brown transition-colors group">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-bakery-accent text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                {wishlist.length}
              </span>
            )}
          </Link>
        )}

        {/* Cart */}
        <Link to="/cart" className="relative p-2 text-slate-600 hover:text-bakery-brown transition-colors group">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {totalCartItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-bakery-brown text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center">
              {totalCartItems}
            </span>
          )}
        </Link>

        {/* Customer Profile / Auth */}
        {customer ? (
          <div className="flex items-center gap-4 border-l border-gray-100 pl-4">
            <Link to="/profile" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-bakery-cream border border-bakery-accent/30 text-bakery-brown font-black text-xs flex items-center justify-center uppercase tracking-tighter shadow-sm group-hover:scale-105 transition-transform">
                {customer.name.slice(0,2)}
              </div>
              <span className="hidden sm:inline text-[11px] font-black text-bakery-dark uppercase tracking-wider">{customer.name.split(' ')[0]}</span>
            </Link>
            <button onClick={logout} className="text-[10px] font-black text-red-400 hover:text-red-500 uppercase tracking-widest transition-colors">
              Logout
            </button>
          </div>
        ) : (
          <Link to="/auth" className="flex items-center gap-2 bg-bakery-dark text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default StoreNavbar;
