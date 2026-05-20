import React, { useState, useEffect, useMemo } from 'react';
import API from '../api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { toTitleCase } from '../utils/formatText';

const FinancePage = () => {
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [timeRange, setTimeRange] = useState('Weekly'); // 'Daily', 'Weekly', 'Monthly'

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
        console.error("Error fetching finance data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helpers
  const getCutoffDate = () => {
    const d = new Date();
    if (timeRange === 'Daily') d.setDate(d.getDate() - 1);
    if (timeRange === 'Weekly') d.setDate(d.getDate() - 7);
    if (timeRange === 'Monthly') d.setMonth(d.getMonth() - 1);
    return d.getTime();
  };

  const getIngredientCost = (ingId) => {
    const ing = ingredients.find(i => i._id === ingId);
    return ing ? ing.cost : 0;
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  // --- Calculations ---
  const cutoff = getCutoffDate();
  
  const filteredTransactions = transactions.filter(t => new Date(t.timestamp).getTime() >= cutoff);
  const filteredLogs = logs.filter(l => new Date(l.timestamp).getTime() >= cutoff);

  const totalRevenue = filteredTransactions.reduce((acc, t) => acc + (t.totalRevenue || 0), 0);

  const totalExpenditure = filteredLogs
    .filter(l => l.type === 'Restock')
    .reduce((acc, l) => {
      const costPerKg = getIngredientCost(l.ingredientId);
      return acc + ((l.quantity / 1000) * costPerKg);
    }, 0);

  const totalWastageCost = filteredLogs
    .filter(l => l.type === 'Waste')
    .reduce((acc, l) => {
      const costPerKg = getIngredientCost(l.ingredientId);
      return acc + ((Math.abs(l.quantity) / 1000) * costPerKg);
    }, 0);

  const netProfit = totalRevenue - totalExpenditure;

  // --- Chart Data ---
  // 1. Cash Flow Trend
  const cashFlowMap = {};
  filteredTransactions.forEach(t => {
    const date = formatDate(t.timestamp);
    if (!cashFlowMap[date]) cashFlowMap[date] = { date, revenue: 0, expenses: 0 };
    cashFlowMap[date].revenue += t.totalRevenue;
  });
  filteredLogs.filter(l => l.type === 'Restock').forEach(l => {
    const date = formatDate(l.timestamp);
    if (!cashFlowMap[date]) cashFlowMap[date] = { date, revenue: 0, expenses: 0 };
    const costPerKg = getIngredientCost(l.ingredientId);
    cashFlowMap[date].expenses += (l.quantity / 1000) * costPerKg;
  });
  const cashFlowData = Object.values(cashFlowMap).sort((a, b) => a.date.localeCompare(b.date));

  // 2. Wastage Donut
  const wastageMap = {};
  filteredLogs.filter(l => l.type === 'Waste').forEach(l => {
    const name = toTitleCase(l.ingredientName || 'Unknown');
    if (!wastageMap[name]) wastageMap[name] = 0;
    const costPerKg = getIngredientCost(l.ingredientId);
    wastageMap[name] += (Math.abs(l.quantity) / 1000) * costPerKg;
  });
  const wastageData = Object.keys(wastageMap)
    .filter(k => wastageMap[k] > 0)
    .map(k => ({ name: k, value: wastageMap[k] }))
    .sort((a, b) => b.value - a.value);
  const COLORS = ['#e11d48', '#fb923c', '#fbbf24', '#34d399', '#3b82f6'];

  // 3. Profitability (Top 5 Recipes by Margin %)
  const profitData = recipes.map(recipe => {
    const totalCost = recipe?.ingredients?.reduce((acc, ing) => {
      const costPerKg = ing.ingredientId?.cost ?? 0;
      return acc + (costPerKg * (ing.amount ?? 0)) / 1000;
    }, 0) ?? 0;
    const profit = (recipe.sellingPrice || 0) - totalCost;
    const margin = recipe.sellingPrice > 0 ? (profit / recipe.sellingPrice) * 100 : 0;
    return { name: recipe.name, margin: parseFloat(margin.toFixed(1)) };
  })
  .sort((a, b) => b.margin - a.margin)
  .slice(0, 5);

  // --- AI Insights Removed per request ---

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-bakery-brown font-black animate-pulse tracking-widest uppercase text-xs">
        Crunching Numbers...
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-full animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-bakery-dark tracking-tighter">Finance & Overheads</h2>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Analytics Dashboard</p>
        </div>
        
        <div className="flex bg-white rounded-2xl border border-gray-100 p-1 shadow-sm">
          {['Daily', 'Weekly', 'Monthly'].map(tr => (
            <button 
              key={tr}
              onClick={() => setTimeRange(tr)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                timeRange === tr ? 'bg-bakery-dark text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              {tr}
            </button>
          ))}
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 group">
          <p className="text-black font-black text-[10px] uppercase tracking-[0.2em] mb-1">Total Revenue</p>
          <div className="h-1.5 w-10 bg-green-500 rounded-full mb-4 transition-all duration-500 group-hover:w-24" />
          <h3 className="text-3xl font-extrabold text-bakery-dark tracking-tighter uppercase">₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
          <p className="text-[9px] text-gray-400 uppercase mt-2">{filteredTransactions.length} Orders</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 group">
          <p className="text-black font-black text-[10px] uppercase tracking-[0.2em] mb-1">Total Expenditure</p>
          <div className="h-1.5 w-10 bg-red-500 rounded-full mb-4 transition-all duration-500 group-hover:w-24" />
          <h3 className="text-3xl font-extrabold text-bakery-dark tracking-tighter uppercase">₹{totalExpenditure.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
          <p className="text-[9px] text-gray-400 uppercase mt-2">Restock Logs</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 group">
          <p className="text-black font-black text-[10px] uppercase tracking-[0.2em] mb-1">Net Profit</p>
          <div className="h-1.5 w-10 bg-bakery-accent rounded-full mb-4 transition-all duration-500 group-hover:w-24" />
          <h3 className="text-3xl font-extrabold text-bakery-dark tracking-tighter uppercase">₹{netProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
          <p className="text-[9px] text-gray-400 uppercase mt-2">Before Overheads</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 group">
          <p className="text-black font-black text-[10px] uppercase tracking-[0.2em] mb-1">Wastage Cost</p>
          <div className="h-1.5 w-10 bg-bakery-brown rounded-full mb-4 transition-all duration-500 group-hover:w-24" />
          <h3 className="text-3xl font-extrabold text-bakery-dark tracking-tighter uppercase">₹{totalWastageCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
          <p className="text-[9px] text-gray-400 uppercase mt-2">Direct Profit Loss</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Cash Flow Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-bakery-brown uppercase tracking-widest mb-6">Cash Flow Trend</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashFlowData}>
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

        {/* Wastage Donut */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-sm font-black text-bakery-brown uppercase tracking-widest mb-2">Wastage Breakdown</h3>
          {wastageData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-xs font-bold uppercase tracking-widest">
              No Wastage
            </div>
          ) : (
            <div className="h-[200px] w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={wastageData} innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {wastageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `₹${value.toFixed(0)}`}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {wastageData.slice(0,3).map((w, i) => (
                  <div key={w.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-[9px] font-bold text-gray-500 uppercase">{w.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profitability Row */}
      <div className="grid grid-cols-1 gap-6">
        {/* Profitability Bar */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-bakery-brown uppercase tracking-widest mb-6">Top Margins (%)</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitData} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#374151' }} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                  formatter={(value) => `${value}%`}
                />
                <Bar dataKey="margin" fill="#4A3728" radius={[0, 8, 8, 0]} barSize={20} name="Margin" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
};

export default FinancePage;
