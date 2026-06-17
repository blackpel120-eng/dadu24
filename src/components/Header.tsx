import React, { useState, useEffect } from 'react';
import { Shield, ShoppingCart, User, Clock, AlertTriangle, Key, Phone } from 'lucide-react';
import { signInWithGoogle, signOutFromFirebase, auth } from '../lib/firebase';

interface HeaderProps {
  isAdmin: boolean;
  onAdminToggle: (hasAccess: boolean) => void;
  activeTab: 'food' | 'electrician' | 'admin' | 'tracking';
  setActiveTab: (tab: 'food' | 'electrician' | 'admin' | 'tracking') => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
}

export default function Header({
  isAdmin,
  onAdminToggle,
  activeTab,
  setActiveTab,
  cartCount,
  cartTotal,
  onOpenCart
}: HeaderProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Restore authenticated owner session automatically on reload
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user && user.email === 'blackpel120@gmail.com') {
        onAdminToggle(true);
      }
    });
    return () => unsub();
  }, [onAdminToggle]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'meerali120') {
      onAdminToggle(true);
      setActiveTab('admin');
      setShowPasswordModal(false);
      setPasswordInput('');
      setErrorMsg('');
    } else {
      setErrorMsg('Incorrect Admin Password. Access Denied!');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setErrorMsg('');
      const user = await signInWithGoogle();
      if (user && user.email === 'blackpel120@gmail.com') {
        onAdminToggle(true);
        setActiveTab('admin');
        setShowPasswordModal(false);
        setPasswordInput('');
        setErrorMsg('');
      } else {
        setErrorMsg(`Account ${user?.email || 'Unknown'} is not registered as the owner.`);
        await signOutFromFirebase();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Auth authentication failed.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOutFromFirebase();
    } catch (_) {}
    onAdminToggle(false);
    setActiveTab('food');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Logo and Slogan */}
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => setActiveTab('food')}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform duration-200">
            D
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-1">
              Dadu <span className="text-amber-500">24#7</span>
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono tracking-wider text-gray-400 uppercase leading-[10px]">
                Dadu City Delivery &amp; Repair
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('food')}
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'food'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🍔 Food Delivery
          </button>
          <button
            onClick={() => setActiveTab('electrician')}
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'electrician'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            ⚡ Electrician Services
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'tracking'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📋 Order Status
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'admin'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-red-600 hover:bg-red-50 font-bold border border-red-200/50'
              }`}
            >
              🛠️ Admin Dashboard
            </button>
          )}
        </nav>

        {/* Right Actions Accordion */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Direct helpline number */}
          <a
            href="tel:03277004471"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-md shadow-emerald-500/10 active:scale-95"
            title="Call Helpline Support"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Helpline:</span>
            <span>03277004471</span>
          </a>

          {/* Cart triggers */}
          {activeTab !== 'admin' && (
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3 py-2 border border-gray-100 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-gray-700 bg-amber-50/40"
            >
              <ShoppingCart className="w-5 h-5 text-amber-600" />
              <span className="hidden sm:inline text-xs font-bold text-gray-800">
                Rs. {cartTotal}
              </span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-[10px] text-white font-extrabold rounded-full flex items-center justify-center animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Quick link to order tracker */}
          <button
            onClick={() => setActiveTab('tracking')}
            className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            title="Track Orders"
          >
            <Clock className="w-5 h-5" />
          </button>

          {/* Admin state indicator */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-100 px-3 py-1.5 rounded-lg text-xs font-extrabold shadow-2xs">
              <Shield className="w-4 h-4 animate-pulse" />
              <span className="hidden sm:inline">Portal Live</span>
              <button 
                onClick={handleLogout}
                className="ml-2 hover:underline text-[10px] text-red-500 font-bold hover:text-red-700 pointer-events-auto cursor-pointer"
              >
                Log out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-1.5 p-2 bg-gray-50 border border-gray-100 text-gray-600 rounded-xl transition duration-200 cursor-pointer hover:bg-amber-50 hover:text-amber-600"
              title="Admin Portal Login"
            >
              <Key className="w-4 h-4" />
              <span className="hidden leading-none sm:inline text-xs font-semibold">Admin Panel</span>
            </button>
          )}
        </div>
      </div>

      {/* SECRET ADMIN PASSCODE LOGIN MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 transition-all duration-300 transform scale-100">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Admin Authentication</h3>
                  <p className="text-xs text-gray-500">Only authorized owner can access files</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordInput('');
                  setErrorMsg('');
                }}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wide mb-1.5">
                  Enter Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-lg tracking-widest text-center"
                  autoFocus
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-650 border border-red-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 animate-bounce">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput('');
                    setErrorMsg('');
                  }}
                  className="w-1/2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-705 text-sm font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  Unlock App
                </button>
              </div>

              <div className="relative my-4 flex py-1.5 items-center">
                <div className="flex-grow border-t border-gray-150"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-extrabold uppercase tracking-widest">or real-auth shield</span>
                <div className="flex-grow border-t border-gray-150"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2.5 bg-gray-900 hover:bg-gray-850 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer border border-gray-800"
              >
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.518 0-6.38-2.861-6.38-6.38s2.861-6.38 6.38-6.38c1.53 0 2.93.54 4.02 1.443l3.031-3.031C18.96 2.055 15.82 0 12.24 0 5.58 0 0 5.58 0 12.24s5.58 12.24 12.24 12.24c6.91 0 11.47-4.854 11.47-11.7s-.06-1.56-.195-2.085H12.24z"/>
                </svg>
                Sign In with Google (Owner)
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
