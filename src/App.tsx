/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import UserPanel from './components/UserPanel';
import AdminPanel from './components/AdminPanel';
import { OrderItem } from './types';
import { seedDatabaseIfEmpty } from './lib/firebase';
import { Sparkles, Bike, Phone, ShieldCheck, MapPin, Heart } from 'lucide-react';

export default function App() {
  // Check if admin session already exist in local session
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('dadu247_admin_session') === 'true';
  });

  const [activeTab, setActiveTab] = useState<'food' | 'electrician' | 'admin' | 'tracking'>('food');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Trigger Database preset seeding once on load if empty
  useEffect(() => {
    seedDatabaseIfEmpty();
  }, []);

  const handleAdminToggle = (hasAccess: boolean) => {
    setIsAdmin(hasAccess);
    if (hasAccess) {
      sessionStorage.setItem('dadu247_admin_session', 'true');
    } else {
      sessionStorage.removeItem('dadu247_admin_session');
    }
  };

  // Live total of selected items in currency
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  // Add 60 PKR flat delivery shipping in Dadu
  const cartTotal = cartSubtotal > 0 ? cartSubtotal + 60 : 0;

  return (
    <div className="flex flex-col min-h-screen bg-transparent font-sans text-gray-900 antialiased selection:bg-amber-100 selection:text-amber-900">
      
      {/* HEADER BAR */}
      <Header
        isAdmin={isAdmin}
        onAdminToggle={handleAdminToggle}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* RENDER ACTIVE SCREEN CONTROLLER */}
      <div className="flex-1">
        {activeTab === 'admin' && isAdmin ? (
          <AdminPanel />
        ) : (
          <UserPanel
            initialActiveTab={activeTab === 'admin' ? 'food' : activeTab}
            activeTab={activeTab === 'admin' ? 'food' : activeTab}
            setActiveTab={setActiveTab}
            cart={cart}
            setCart={setCart}
            isCartOpen={isCartOpen}
            setIsCartOpen={setIsCartOpen}
          />
        )}
      </div>

      {/* 🍲 FOOTER SECTION */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 pb-10 border-b border-gray-800">
            
            {/* Column 1: Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white font-black text-lg">
                  D
                </div>
                <span className="text-lg font-black text-white tracking-tight">
                  Dadu <span className="text-amber-500">24#7</span>
                </span>
                <span className="text-[10px] bg-amber-950 text-amber-450 px-2 py-0.5 rounded font-black">QUICK COURIER</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Dadu City's premium 24/7 delivery and professional electrician service. Fast, affordable, and safe services at your doorstep.
              </p>
              <div className="flex items-center gap-2 text-xs text-amber-500 font-extrabold">
                <Bike className="w-4 h-4" />
                <span>Sirf Cash on Delivery (COD) par mukkamal bhrosa!</span>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-white mb-4">Mera Dadu Station</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button 
                  onClick={() => setActiveTab('food')} 
                  className="text-left hover:text-white transition duration-150"
                >
                  🍔 Food Delivery
                </button>
                <button 
                  onClick={() => setActiveTab('electrician')} 
                  className="text-left hover:text-white transition duration-150"
                >
                  ⚡ Electrician Service
                </button>
                <button 
                  onClick={() => setActiveTab('tracking')} 
                  className="text-left hover:text-white transition duration-150"
                >
                  📋 Check Order Status
                </button>
                <span className="text-gray-600">📍 Dadu City, Sindh</span>
              </div>
            </div>

            {/* Column 3: Contacts */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-white">Emergency Support</h4>
              <p className="text-xs text-gray-400">Any questions or rider issues? Call us directly:</p>
              
              <div className="space-y-2 text-xs font-mono">
                <a href="tel:03277004471" className="flex items-center gap-2 text-white hover:text-amber-400 transition font-bold group">
                  <Phone className="w-4 h-4 text-emerald-500 shrink-0 group-hover:scale-110" />
                  <span>03277004471 (Direct Hotline)</span>
                </a>
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Girls College Road, Dadu District, Sindh</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar credit details */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-600 gap-4">
            <p className="font-medium text-center sm:text-left">
              &copy; {new Date().getFullYear()} Dadu 24#7 Services. All Rights Protected in Sindh, Pakistan.
            </p>
            
            <div className="flex items-center gap-1.5 font-semibold text-gray-500">
              <ShieldCheck className="w-4 h-4 text-amber-500/80" />
              <span>Secured via Fast Firebase Firestore DB</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
