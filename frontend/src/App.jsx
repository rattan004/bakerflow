import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import InventoryPage from './pages/InventoryPage';
import RecipePage from './pages/RecipePage';
import FinancePage from './pages/FinancePage';
import CentralDashboard from './pages/CentralDashboard';

// Storefront & Authentication Imports
import { StoreProvider } from './context/StoreContext';
import StoreLayout from './layouts/StoreLayout';
import AdminLayout from './layouts/AdminLayout';
import StoreHome from './pages/StoreHome';
import AuthPage from './pages/AuthPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import WishlistPage from './pages/WishlistPage';
import StaffManagement from './pages/StaffManagement';

function App() {
  const [userRole, setUserRole] = useState('CEO');

  return (
    <StoreProvider>
      <Router>
        <Routes>
          {/* Admin Command Center Routes */}
          <Route 
            path="/admin/*" 
            element={
              <AdminLayout userRole={userRole} setUserRole={setUserRole}>
                <Routes>
                  <Route 
                    path="/" 
                    element={
                      <ProtectedRoute userRole={userRole} allowedRoles={['CEO', 'Manager']}>
                        <CentralDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/recipes" element={<RecipePage userRole={userRole} />} />
                  <Route 
                    path="/finance" 
                    element={
                      <ProtectedRoute userRole={userRole} allowedRoles={['CEO', 'Manager']}>
                        <FinancePage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/staff" 
                    element={
                      <ProtectedRoute userRole={userRole} allowedRoles={['CEO']}>
                        <StaffManagement />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </AdminLayout>
            } 
          />

          {/* Customer E-Commerce Storefront Routes */}
          <Route 
            path="/*" 
            element={
              <StoreLayout>
                <Routes>
                  <Route path="/" element={<StoreHome />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Routes>
              </StoreLayout>
            } 
          />
        </Routes>
      </Router>
    </StoreProvider>
  );
}

export default App;