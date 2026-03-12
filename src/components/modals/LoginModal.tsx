import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, User, Lock, LogIn } from 'lucide-react';

interface LoginModalProps {
  showLogin: boolean;
  setShowLogin: (show: boolean) => void;
  isDark: boolean;
  themeClasses: any;
  loginData: any;
  setLoginData: (data: any) => void;
  handleLogin: (e: React.FormEvent) => void;
  primaryColor: string;
}

export const LoginModal = React.memo(({
  showLogin,
  setShowLogin,
  isDark,
  themeClasses,
  loginData,
  setLoginData,
  handleLogin,
  primaryColor
}: LoginModalProps) => {
  if (!showLogin) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowLogin(false)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transition-colors ${themeClasses.card} ${themeClasses.text}`}
      >
        <div className={`p-4 sm:p-6 border-b shrink-0 ${themeClasses.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-lg font-black tracking-tight ${themeClasses.text}`}>Portal Admin</h2>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${themeClasses.textMuted}`}>Login untuk mengelola tiket</p>
              </div>
            </div>
            <button 
              onClick={() => setShowLogin(false)}
              className={`p-2 rounded-full transition-all ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="p-4 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              <User className="w-3 h-3" /> Username
            </label>
            <input 
              required
              type="text"
              placeholder="Masukkan username"
              className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
              value={loginData.username}
              onChange={e => setLoginData({...loginData, username: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              <Lock className="w-3 h-3" /> Password
            </label>
            <input 
              required
              type="password"
              placeholder="Masukkan password"
              className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
              value={loginData.password}
              onChange={e => setLoginData({...loginData, password: e.target.value})}
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              style={{ backgroundColor: primaryColor }}
              className={`w-full py-3 sm:py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs sm:text-sm shadow-xl shadow-emerald-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2`}
            >
              <ShieldCheck className="w-4 h-4" /> Masuk Sekarang
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
});
