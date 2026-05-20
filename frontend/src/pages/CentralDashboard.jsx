import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toTitleCase } from '../utils/formatText';

const CentralDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ingRes, recRes, logRes, transRes] = await Promise.all([
          API.get('/api/ingredients'),
          API.get('/api/recipes'),
          API.get('/api/logs'),
          API.get('/api/transactions')
        ]);
        setIngredients(ingRes.data);
        setRecipes(recRes.data);
        setLogs(logRes.data);
        setTransactions(transRes.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getIngredientCost = (ingId) => {
    const ing = ingredients.find(i => i._id === ingId);
    return ing ? ing.cost : 0;
  };

  // --- CALCS ---
  // Inventory
  const lowStockItems = ingredients.filter(i => i.currentStock < (i.minThreshold || 5000));
  const lowStockCount = lowStockItems.length;
  const totalAssetValue = ingredients.reduce((acc, i) => acc + (i.currentStock * i.cost) / 1000, 0);

  // Finance (Weekly)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 6); // 7 days inclusive
  oneWeekAgo.setHours(0,0,0,0);
  const cutoff = oneWeekAgo.getTime();

  const filteredTrans = transactions.filter(t => new Date(t.timestamp).getTime() >= cutoff);
  const filteredLogs = logs.filter(l => new Date(l.timestamp).getTime() >= cutoff);

  const weeklyRev = filteredTrans.reduce((acc, t) => acc + (t.totalRevenue || 0), 0);
  const weeklyExp = filteredLogs
    .filter(l => l.type === 'Restock')
    .reduce((acc, l) => acc + ((l.quantity / 1000) * getIngredientCost(l.ingredientId)), 0);
  const weeklyProfit = weeklyRev - weeklyExp;

  // Chart Data (Revenue vs Expenses)
  const chartMap = {};
  for(let i=6; i>=0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getMonth()+1}/${d.getDate()}`;
    chartMap[dateStr] = { date: dateStr, revenue: 0, expenses: 0 };
  }
  
  filteredTrans.forEach(t => {
    const d = new Date(t.timestamp);
    const key = `${d.getMonth()+1}/${d.getDate()}`;
    if(chartMap[key]) chartMap[key].revenue += (t.totalRevenue || 0);
  });

  filteredLogs.filter(l => l.type === 'Restock').forEach(l => {
    const d = new Date(l.timestamp);
    const key = `${d.getMonth()+1}/${d.getDate()}`;
    if(chartMap[key]) chartMap[key].expenses += ((l.quantity / 1000) * getIngredientCost(l.ingredientId));
  });
  
  const chartData = Object.values(chartMap);

  // Top Seller
  const salesMap = {};
  filteredTrans.forEach(t => {
    if(!salesMap[t.recipeName]) salesMap[t.recipeName] = 0;
    salesMap[t.recipeName] += t.quantity;
  });
  const sortedSales = Object.keys(salesMap).sort((a,b) => salesMap[b] - salesMap[a]);
  const topSeller = sortedSales.length > 0 ? sortedSales[0] : 'None yet';

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-bakery-brown font-black animate-pulse tracking-widest uppercase text-xs">
        Booting Central Command...
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-full animate-fadeIn pb-12 px-4 md:px-0">
      
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 pt-4">
        <div>
          <h2 className="text-4xl font-handwritten text-bakery-brown">Command Center</h2>
          <p className="text-gray-500 text-sm italic">Bakery Operations Overview</p>
        </div>
      </header>

      {/* Stats Cards (Top Row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 group">
          <p className="text-black font-black text-[10px] uppercase tracking-[0.2em] mb-1">Attention Needed</p>
          <div className={`h-1.5 w-10 rounded-full mb-4 transition-all duration-500 group-hover:w-24 ${lowStockCount > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
          <h3 className="text-2xl font-extrabold text-bakery-brown tracking-tighter truncate">
            {lowStockCount > 0 ? `${lowStockCount} Low Stock` : 'All Healthy'}
          </h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 group">
          <p className="text-black font-black text-[10px] uppercase tracking-[0.2em] mb-1">Weekly Profit</p>
          <div className="h-1.5 w-10 bg-bakery-accent rounded-full mb-4 group-hover:w-24 transition-all duration-500" />
          <h3 className="text-2xl font-extrabold text-bakery-dark tracking-tighter uppercase truncate">
            ₹{weeklyProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 group">
          <p className="text-black font-black text-[10px] uppercase tracking-[0.2em] mb-1">Top Seller</p>
          <div className="h-1.5 w-10 bg-bakery-brown rounded-full mb-4 group-hover:w-24 transition-all duration-500" />
          <h3 className="text-2xl font-extrabold text-bakery-brown tracking-tighter truncate">
            {topSeller}
          </h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 group">
          <p className="text-black font-black text-[10px] uppercase tracking-[0.2em] mb-1">Inventory Assets</p>
          <div className="h-1.5 w-10 bg-bakery-dark rounded-full mb-4 group-hover:w-24 transition-all duration-500" />
          <h3 className="text-2xl font-extrabold text-bakery-dark tracking-tighter uppercase truncate">
            ₹{totalAssetValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </h3>
        </div>
      </div>

      {/* Middle Row: Analytics & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="font-black text-bakery-brown text-xs uppercase tracking-[0.25em] mb-6">Weekly Performance</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} width={50} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 900, color: '#374151' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Revenue" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col">
          <h3 className="font-black text-bakery-brown text-xs uppercase tracking-[0.25em] mb-6">System Alerts</h3>
          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 max-h-[280px]">
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                  <span className="text-green-500 text-xl">✓</span>
                </div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">All Stock Optimal</p>
              </div>
            ) : (
              lowStockItems.map(item => (
                <div key={item._id} className="p-4 rounded-2xl bg-red-50/50 border border-red-100 hover:border-red-200 transition-all flex justify-between items-center group">
                  <div>
                    <p className="text-sm font-bold text-bakery-dark">{toTitleCase(item.name)}</p>
                    <p className="text-[10px] font-bold text-red-400 mt-1 uppercase tracking-widest">
                      Only {(item.currentStock / 1000).toFixed(2)} kg left
                    </p>
                  </div>
                  <Link to="/admin/inventory" className="text-[10px] font-black text-white bg-red-400 px-3 py-1.5 rounded-full hover:bg-red-500 transition-all shadow-sm hover:shadow-md">
                    Restock
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Bottom Row: Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Quick Links */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
           <h3 className="font-black text-bakery-brown text-xs uppercase tracking-[0.25em] mb-6">Quick Links</h3>
           <div className="space-y-4">
             <Link to="/admin/inventory" className="flex items-center p-5 rounded-2xl bg-gray-50 border border-transparent hover:border-bakery-accent/30 hover:bg-white hover:shadow-sm transition-all group">
                <div className="w-10 h-10 rounded-xl bg-bakery-dark text-white flex items-center justify-center font-bold text-lg mr-4 group-hover:scale-110 transition-all">📦</div>
                <div>
                  <h4 className="text-sm font-extrabold text-bakery-dark uppercase tracking-tight">Inventory</h4>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Manage Stock</p>
                </div>
             </Link>
             <Link to="/admin/recipes" className="flex items-center p-5 rounded-2xl bg-gray-50 border border-transparent hover:border-bakery-accent/30 hover:bg-white hover:shadow-sm transition-all group">
                <div className="w-10 h-10 rounded-xl bg-bakery-brown text-white flex items-center justify-center font-bold text-lg mr-4 group-hover:scale-110 transition-all">🍳</div>
                <div>
                  <h4 className="text-sm font-extrabold text-bakery-dark uppercase tracking-tight">Menu</h4>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">View Recipes</p>
                </div>
             </Link>
             <Link to="/admin/finance" className="flex items-center p-5 rounded-2xl bg-gray-50 border border-transparent hover:border-bakery-accent/30 hover:bg-white hover:shadow-sm transition-all group">
                <div className="w-10 h-10 rounded-xl bg-bakery-accent text-white flex items-center justify-center font-bold text-lg mr-4 group-hover:scale-110 transition-all">💰</div>
                <div>
                  <h4 className="text-sm font-extrabold text-bakery-dark uppercase tracking-tight">Finance</h4>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Revenue Data</p>
                </div>
             </Link>
           </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="font-black text-bakery-brown text-xs uppercase tracking-[0.25em] mb-6">Recent Orders</h3>
          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
            {transactions.slice(0, 10).map((t, i) => (
              <div key={t._id || i} className="flex justify-between items-center pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-bold text-bakery-dark">{t.recipeName}</p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">
                    {new Date(t.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-green-500">₹{t.totalRevenue}</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Qty: {t.quantity}</p>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-xs font-bold text-gray-400 text-center py-4 uppercase tracking-widest">No orders yet</p>
            )}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="font-black text-bakery-brown text-xs uppercase tracking-[0.25em] mb-6">Live Activity</h3>
          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
            {logs.slice(0, 10).map((log, i) => {
              const isPos = log.quantity > 0;
              return (
                <div key={log._id || i} className="flex gap-4 items-start pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${isPos ? 'bg-green-500' : 'bg-red-400'}`} />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-bakery-dark uppercase">
                      {log.type} <span className="text-gray-400 font-normal">({toTitleCase(log.ingredientName)})</span>
                    </p>
                    <p className="text-[10px] font-bold text-gray-500 mt-1">{log.reason}</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className={`ml-auto text-xs font-black tracking-tighter mt-1 ${isPos ? 'text-green-500' : 'text-red-400'}`}>
                    {isPos ? '+' : ''}{log.quantity}g
                  </div>
                </div>
              )
            })}
            {logs.length === 0 && (
              <p className="text-xs font-bold text-gray-400 text-center py-4 uppercase tracking-widest">No activity yet</p>
            )}
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #F3F4F6; border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #E5E7EB; }
      `}} />
    </div>
  );
};

export default CentralDashboard;
