import React, { useState } from 'react';

const ContactPage = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 animate-fadeIn">
      {/* Contact Header */}
      <div className="mb-12 space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-extrabold text-bakery-dark tracking-tighter uppercase">Connect with Us</h2>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">We'd love to hear from you or help with custom orders</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Contact Form */}
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative">
          
          {formSubmitted && (
            <div className="p-4 mb-6 text-xs font-bold text-green-600 bg-green-50 border border-green-100 rounded-2xl animate-pulse">
              ✓ Message delivered! Our head baker will get back to you shortly.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Your Name</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="YOUR NAME"
                className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-bakery-accent uppercase tracking-wider transition-all" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="YOUR@EMAIL.COM"
                className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-bakery-accent uppercase tracking-wider transition-all" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Your Message</label>
              <textarea 
                rows="4"
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="HOW CAN WE BAKE FOR YOU today?"
                className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-bakery-accent uppercase tracking-wider transition-all resize-none"
              />
            </div>

            <button 
              type="submit" 
              className="px-8 py-4 bg-bakery-dark text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-bakery-accent transition-all active:scale-95 shadow-sm"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Contact Info / Map details */}
        <div className="space-y-12 flex flex-col justify-center">
          
          <div className="space-y-6">
            <h3 className="text-xl font-extrabold text-bakery-dark tracking-tight uppercase">Bakery Headquarters</h3>
            
            <div className="space-y-4 text-xs md:text-sm font-bold uppercase tracking-tight text-gray-500">
              <div className="flex gap-4">
                <span className="text-xl">📍</span>
                <div>
                  <p className="text-bakery-dark font-black">Ludhiana Headquarters</p>
                  <p className="text-gray-400 mt-1">123 FLOUR MILL LANE, INDEPENDENCE PARK, LUDHIANA, PUNJAB</p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="text-xl">📞</span>
                <div>
                  <p className="text-bakery-dark font-black">Hot Oven Line</p>
                  <p className="text-gray-400 mt-1">+91 98765 43210</p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="text-xl">✉️</span>
                <div>
                  <p className="text-bakery-dark font-black">Electronic Mail</p>
                  <p className="text-gray-400 mt-1">FRESH@BAKERFLOW.COM</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-bakery-cream rounded-[2.5rem] border border-gray-100 flex items-center gap-4 shadow-sm select-none">
            <span className="text-3xl">🚗</span>
            <div>
              <h4 className="font-extrabold text-bakery-dark text-xs uppercase tracking-wider">Free Valet Parking</h4>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-tight mt-0.5">Available for custom cake pickups at our headquarters.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactPage;
