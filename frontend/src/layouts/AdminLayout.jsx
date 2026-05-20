import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useStore } from '../context/StoreContext';

const AdminLayout = ({ children, userRole, setUserRole }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { customer } = useStore();

  useEffect(() => {
    if (customer && customer.role) {
      setUserRole(customer.role);
    }
  }, [customer, setUserRole]);

  const isRealCEO = customer?.role === 'CEO';

  return (
    <div className="bg-[#FBFBFA] min-h-screen flex relative overflow-x-hidden w-full text-bakery-dark">
      {/* Mobile Header Bar - Fixed at top */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-gray-100 z-[100] flex items-center px-4 justify-between">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-bakery-dark">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-handwritten text-xl text-bakery-brown">BakerFlow</span>
        <div className="w-10" />
      </div>

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-[110] w-72 bg-bakery-dark transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 h-full
      `}>
        <Sidebar userRole={userRole} setIsSidebarOpen={setIsSidebarOpen} />
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-bakery-dark/40 backdrop-blur-sm z-[105] md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      
      {/* MAIN CONTENT */}
      <main className="flex-1 md:pl-72 min-h-screen w-full flex flex-col">
        <div className="flex-1 p-4 md:p-12 pt-24 md:pt-12 w-full max-w-full">
          {/* Page Header with Role Switcher */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
          </div>

          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
