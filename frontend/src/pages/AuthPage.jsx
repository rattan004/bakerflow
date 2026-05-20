import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register, loginWithGoogle } = useStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    let script = document.getElementById("google-gsi-client");
    if (!script) {
      script = document.createElement('script');
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const initGoogleBtn = () => {
      if (window.google) {
        if (!window.googleInitialized) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
            callback: handleGoogleCallback,
            auto_select: false
          });
          window.googleInitialized = true;
        }

        const container = document.getElementById("googleBtnContainer");
        if (container) {
          container.innerHTML = "";
        }

        window.google.accounts.id.renderButton(
          container,
          { 
            theme: "outline", 
            size: "large", 
            text: "continue_with", 
            shape: "pill",
            width: 320 
          }
        );
      }
    };

    if (window.google) {
      initGoogleBtn();
    } else {
      script.onload = initGoogleBtn;
    }
  }, [isLogin]);

  const handleGoogleCallback = async (response) => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle(response.credential);
      navigate('/');
    } catch (err) {
      console.error("Google Auth failed:", err);
      setError(err.response?.data?.message || 'Google Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Sign Up Password Reconfirmation
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please verify.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password);
      }
      navigate('/');
    } catch (err) {
      console.error("Auth failed:", err);
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6 md:px-12 py-16 bg-[#FBFBFA] animate-fadeIn">
      {/* Luxury Split Layout Container */}
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[600px] transition-all">
        
        {/* Left Side: Premium Story/Brand Panel (Hidden on Mobile) */}
        <div className="hidden md:flex md:col-span-5 bg-bakery-dark text-white p-12 flex-col justify-between relative overflow-hidden">
          {/* Circular decorative ambient glows */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-bakery-accent/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-bakery-brown/20 rounded-full blur-3xl" />
          
          <div className="space-y-2 z-10">
            <span className="text-[10px] font-black text-bakery-accent uppercase tracking-[0.3em] block">BakerFlow Premium</span>
            <h3 className="text-4xl font-handwritten text-bakery-cream select-none leading-none pt-2">
              Baked Fresh, Daily.
            </h3>
            <div className="h-1 w-8 bg-bakery-accent/30 rounded-full mt-4" />
          </div>

          <div className="space-y-4 z-10">
            <p className="text-slate-300 text-xs font-bold uppercase tracking-widest leading-relaxed">
              Join Ludhiana's finest sourdough society and unlock secret recipes, premium custom orders, and real-time ledger perks.
            </p>
            <div className="flex gap-2 text-2xl select-none">
              <span>🌾</span>
              <span>🥐</span>
              <span>🧁</span>
            </div>
          </div>

          <div className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em] z-10">
            &copy; BakerFlow Ovens Ltd.
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="md:col-span-7 p-8 md:p-14 flex flex-col justify-center relative">
          
          {/* Elegant Top Badge */}
          <div className="self-start bg-bakery-accent/10 text-bakery-accent border border-bakery-accent/20 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.25em] mb-6">
            {isLogin ? 'Premium Access' : 'Create Rewards Ledger'}
          </div>

          <h2 className="text-3xl font-extrabold text-bakery-dark tracking-tighter mb-1 uppercase">
            {isLogin ? 'Welcome Back' : 'Sign Up'}
          </h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">
            {isLogin ? 'Access your orders & wishlist' : 'Join BakerFlow Rewards'}
          </p>

          {error && (
            <div className="p-4 mb-6 text-xs font-bold text-red-500 bg-red-50 border border-red-100 rounded-2xl animate-shake">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2 animate-fadeIn">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="JOHN DOE"
                  autoComplete="name"
                  className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-bakery-accent uppercase tracking-wider transition-all" 
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <input 
                type="email" 
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="YOUR@EMAIL.COM"
                autoComplete="email"
                className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-bakery-accent uppercase tracking-wider transition-all" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <input 
                type="password" 
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-bakery-accent transition-all" 
              />
            </div>

            {!isLogin && (
              <div className="space-y-2 animate-fadeIn">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reconfirm Password</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-bakery-accent transition-all" 
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-bakery-dark text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-bakery-accent transition-all active:scale-95 shadow-md mt-4 flex justify-center items-center"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          {/* Elegant Divider */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-[9px] font-black text-gray-300 uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          {/* Google OAuth Login Container */}
          <div className="flex flex-col items-center justify-center w-full space-y-2">
            <div id="googleBtnContainer" className="transition-all hover:scale-[1.02] duration-200"></div>
            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest text-center max-w-xs">
              Configure VITE_GOOGLE_CLIENT_ID in your frontend .env to activate Google OAuth
            </p>
          </div>

          {/* Tab switching option */}
          <div className="mt-8 pt-6 border-t border-gray-50 text-center">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                }} 
                className="text-bakery-accent ml-2 hover:underline focus:outline-none font-black"
              >
                {isLogin ? 'Register Here' : 'Login Here'}
              </button>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AuthPage;
