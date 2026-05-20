import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

const Sidebar = ({ userRole, setIsSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useStore();

  const menuItems = [
    { name: 'Dashboard', path: '/admin', roles: ['CEO', 'Manager'], icon: '📊' },
    { name: 'Inventory', path: '/admin/inventory', roles: ['CEO', 'Manager', 'Baker'], icon: '📦' },
    { name: 'Recipes', path: '/admin/recipes', roles: ['CEO', 'Baker'], icon: '📜' },
    { name: 'Finance', path: '/admin/finance', roles: ['CEO', 'Manager'], icon: '💰' },
    { name: 'Staff', path: '/admin/staff', roles: ['CEO'], icon: '👥' },
  ];

  return (
    <div className="h-full w-full bg-bakery-dark flex flex-col justify-between py-8 px-6 shadow-2xl overflow-y-auto">
      <div>
        <div className="mb-12 px-2 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-handwritten text-bakery-accent leading-none">BakerFlow</h1>
            <div className="h-1 w-8 bg-bakery-accent/30 rounded-full mt-2" />
          </div>
          {/* Mobile close button inside the dark sidebar */}
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-white/50 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            if (item.roles.includes(userRole)) {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)} // Closes menu after clicking on mobile
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                    isActive ? 'bg-bakery-accent text-bakery-brown font-bold shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm tracking-tight">{item.name}</span>
                </Link>
              );
            }
            return null;
          })}
        </nav>
      </div>

      {/* Bottom Actions section remains at the bottom due to justify-between */}
      <div className="space-y-4 pt-6 border-t border-white/5">
        
        <button 
          onClick={() => {
            logout();
            navigate('/auth');
          }}
          className="flex items-center gap-4 px-4 py-2 text-bakery-accent hover:text-red-400 transition-colors w-full group"
        >
          <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span>
          <span className="text-xs font-bold uppercase tracking-widest text-left">Log out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;