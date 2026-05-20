import React, { useState, useEffect } from 'react';
import API from '../api';
import { useStore } from '../context/StoreContext';

const StaffManagement = () => {
  const { token, customer: currentUser } = useStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('Baker');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch staff members", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await API.post('/api/auth/users/staff', {
        name: formName,
        email: formEmail,
        password: formPassword,
        role: formRole
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMsg(`Successfully created ${res.data.name} as a ${res.data.role}!`);
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      setFormRole('Baker');
      
      // Refresh list
      fetchUsers();
      
      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMsg('');
      }, 2000);

    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create staff member.');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await API.put(`/api/auth/users/${userId}/role`, {
        role: newRole
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Locally update
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  const [deleteTarget, setDeleteTarget] = useState(null);

  const confirmDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await API.delete(`/api/auth/users/${deleteTarget._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(prev => prev.filter(u => u._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.role !== 'Customer' && (
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-bakery-brown font-black animate-pulse tracking-widest uppercase text-xs">
          Loading Staff Registry...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fadeIn space-y-8 pb-12">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-bakery-dark tracking-tighter uppercase">Staff Registry</h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Manage employee access, delegations, and credentials</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-bakery-accent hover:bg-amber-500 text-white font-black uppercase tracking-widest text-[10px] py-4 px-6 rounded-2xl shadow-sm active:scale-95 transition-all self-stretch md:self-auto"
        >
          ＋ Add Staff Member
        </button>
      </div>

      {/* Search & Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center shadow-sm">
          <span className="text-gray-400 text-lg mr-3">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employees by name or email..."
            className="w-full bg-transparent border-none outline-none text-xs font-bold text-bakery-dark placeholder-gray-400"
          />
        </div>

        {/* Counter cards */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-gray-400 text-[8px] font-black uppercase tracking-widest mb-0.5">Total Users</p>
            <h4 className="text-xl font-extrabold text-bakery-dark">{users.length}</h4>
          </div>
          <span className="text-2xl">👥</span>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-gray-400 text-[8px] font-black uppercase tracking-widest mb-0.5">Staff / Operators</p>
            <h4 className="text-xl font-extrabold text-bakery-accent">
              {users.filter(u => u.role !== 'Customer').length}
            </h4>
          </div>
          <span className="text-2xl">⚡</span>
        </div>
      </div>

      {/* Staff Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((emp) => {
          const isSelf = emp._id === currentUser?._id;
          const joinedDate = new Date(emp.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });

          return (
            <div 
              key={emp._id} 
              className={`bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative flex flex-col justify-between hover:shadow-md transition-all duration-300 ${
                isSelf ? 'border-bakery-accent/30 bg-bakery-cream/5' : ''
              }`}
            >
              {/* Top Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-bakery-dark tracking-tight uppercase truncate max-w-[160px]">
                      {emp.name}
                    </h3>
                    <p className="text-gray-400 text-xs font-semibold truncate max-w-[180px]">{emp.email}</p>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                    emp.role === 'CEO' 
                      ? 'bg-bakery-dark text-white' 
                      : emp.role === 'Baker' 
                      ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                      : emp.role === 'Manager' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                      : 'bg-gray-50 text-gray-500'
                  }`}>
                    {emp.role}
                  </span>
                </div>

                <div className="h-px bg-gray-50 w-full" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-500">
                    <span>Joined Date:</span>
                    <span className="text-bakery-dark">{joinedDate}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-500">
                    <span>Account Status:</span>
                    <span className="text-green-500 font-extrabold">● Active</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons at bottom */}
              <div className="border-t border-gray-50 pt-5 mt-6 flex items-center justify-between gap-3">
                <div className="flex-1">
                  {isSelf ? (
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest block py-2">
                      Self Account
                    </span>
                  ) : (
                    <div className="relative w-full">
                      <select
                        value={emp.role}
                        onChange={(e) => handleRoleChange(emp._id, e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 text-[10px] font-black text-bakery-dark rounded-xl py-2 px-3 outline-none cursor-pointer uppercase tracking-wider"
                      >
                        <option value="Baker">Baker</option>
                        <option value="Manager">Manager</option>
                        <option value="CEO">CEO</option>
                      </select>
                    </div>
                  )}
                </div>

                {!isSelf && (
                  <button
                    onClick={() => setDeleteTarget(emp)}
                    className="p-2.5 rounded-xl border border-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Revoke Credentials"
                  >
                    🗑️
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-bakery-dark/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 w-full max-w-md p-8 shadow-2xl space-y-6 relative animate-scaleIn">
            
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-bakery-dark font-black text-sm"
            >
              ✕
            </button>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-bakery-dark tracking-tighter uppercase">Add Staff Member</h3>
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Register kitchen cooks or business analytics personnel</p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-bold border border-red-100">
                ⚠️ {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-green-50 text-green-600 rounded-2xl text-[10px] font-bold border border-green-100">
                ✓ {successMsg}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Master Chef Chef"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs font-bold text-bakery-dark outline-none focus:border-bakery-accent/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="chef@bakerflow.com"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs font-bold text-bakery-dark outline-none focus:border-bakery-accent/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs font-bold text-bakery-dark outline-none focus:border-bakery-accent/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Assigned Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs font-bold text-bakery-dark outline-none focus:border-bakery-accent/30 uppercase tracking-wider"
                >
                  <option value="Baker">Baker (Kitchen Only)</option>
                  <option value="Manager">Manager (Finance Only)</option>
                  <option value="CEO">CEO (Super Access)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-bakery-dark text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl shadow-md hover:bg-bakery-accent active:scale-95 transition-all pt-4"
              >
                Register Employee
              </button>
            </form>

          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-bakery-dark/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 w-full max-w-md p-8 shadow-2xl space-y-6 relative animate-scaleIn">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl">
                ⚠️
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-bakery-dark tracking-tighter uppercase">Revoke Access</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Confirm permanent account deletion</p>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Are you absolutely sure you want to permanently revoke credentials and delete the staff account for <strong className="text-bakery-dark font-black">{deleteTarget.name}</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-bakery-dark font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl border border-gray-100 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl transition-all active:scale-95 shadow-sm"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StaffManagement;
