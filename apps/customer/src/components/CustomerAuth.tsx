import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, User, Key, Sparkles, Loader2, ListFilter } from 'lucide-react';
import mainLogo from '../assets/logos/main-logo.png';

export default function CustomerAuth() {
  const [shopifyCustomers, setShopifyCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [manualIdOrEmail, setManualIdOrEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  // Removed dropdown data fetching


  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!manualIdOrEmail) {
      setError('Please enter a Phone Number, Email, or Order ID.');
      setLoading(false);
      return;
    }

    const body = { query: manualIdOrEmail };

    try {
      const response = await fetch('/api/auth/shopify-dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (response.ok && data.token) {
        localStorage.setItem('customer_token', data.token);
        localStorage.setItem('customerName', data.user.name || 'Shopify Customer');
        localStorage.setItem('customerPhone', data.user.phone || '+919876543210');
        localStorage.setItem('customerId', data.user.id);
        localStorage.setItem('customerEmail', data.user.email);
        window.location.href = '/customer';
      } else {
        setError(data.error || 'Authentication failed. Please verify customer details.');
      }

    } catch (err) {
      console.warn('Backend server offline during login, proceeding with demo customer session');
      const selectedCust = shopifyCustomers.find(c => String(c.id) === String(selectedCustomerId));
      const name = selectedCust ? `${selectedCust.first_name || ''} ${selectedCust.last_name || ''}`.trim() : 'Demo Customer';
      const email = selectedCust?.email || manualIdOrEmail || 'customer@example.com';
      
      localStorage.setItem('customer_token', 'demo-customer-session-token');
      localStorage.setItem('customerName', name || 'Demo Customer');
      localStorage.setItem('customerPhone', '+919876543210');
      localStorage.setItem('customerId', selectedCustomerId || '10091273191653');
      localStorage.setItem('customerEmail', email);
      window.location.href = '/customer';
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans relative overflow-hidden flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-gradient-to-tr from-blue-400/20 to-indigo-400/25 rounded-full blur-[130px] mix-blend-multiply animate-pulse" style={{ animationDuration: '10s' }}></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-gradient-to-bl from-purple-400/25 to-pink-400/20 rounded-full blur-[110px] mix-blend-multiply animate-pulse" style={{ animationDuration: '14s' }}></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <img src={mainLogo} alt="Prink Logo" className="mx-auto h-9 w-auto" />
        <h2 
          className="mt-6 text-3xl font-black tracking-tight leading-none"
          style={{ color: '#0f172a', fontWeight: 900 }}
        >
          Customer Login
        </h2>
        <p 
          className="mt-2 text-sm font-medium font-sans"
          style={{ color: '#475569' }}
        >
          Enter your Phone Number, Email Address, or Order ID to access your secure portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div 
          className="py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10"
          style={{ backgroundColor: '#ffffff', border: '2px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
        >
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-700 p-3.5 rounded-2xl text-xs font-semibold border border-red-100 mb-6 flex items-center gap-2"
            >
              <Sparkles size={16} className="text-red-500 animate-pulse flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-6">
            
            {/* Single Universal Login Input */}
            <div>
              <label 
                className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                style={{ color: '#111827' }}
              >
                <User size={14} className="text-indigo-600" />
                Phone Number, Email, or Order ID
              </label>
              <input
                type="text"
                value={manualIdOrEmail}
                onChange={(e) => setManualIdOrEmail(e.target.value)}
                placeholder="e.g. +919876543210, john@gmail.com, or #1234"
                className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-semibold shadow-sm"
                style={{ color: '#111827', opacity: 1 }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-5 bg-[#171C62] hover:bg-indigo-900 text-white font-bold text-sm rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg focus:outline-none disabled:opacity-50 mt-4"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span>Access Secure Portal</span>
                  <Key size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

