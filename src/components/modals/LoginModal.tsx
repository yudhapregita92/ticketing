import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Lock, 
  LogIn, 
  RefreshCcw, 
  ShieldCheck 
} from 'lucide-react';

interface LoginModalProps {
  showLogin: boolean;
  setShowLogin: (show: boolean) => void;
  isDark: boolean;
  themeClasses: any;
  loginData: any;
  setLoginData: (data: any) => void;
  loggingIn: boolean;
  handleLogin: (e: React.FormEvent) => void;
  primaryColor: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  showLogin,
  setShowLogin,
  isDark,
  themeClasses,
  loginData,
  setLoginData,
  loggingIn,
  handleLogin,
  primaryColor
}) => {
  return (
    <AnimatePresence>
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogin(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full max-w-md rounded-3xl shadow-2xl border overflow-hidden ${themeClasses.card}`}
          >
            <div className="p-8 sm:p-10">
              <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
                <div 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 20px 25px -5px ${primaryColor}40` }}
                >
                  <ShieldCheck className="text-white w-10 h-10 sm:w-12 h-12" />
                </div>
                <h2 className={`text-2xl sm:text-3xl font-black tracking-tight mb-2 ${themeClasses.text}`}>Admin Login</h2>
                <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">Akses Panel Manajemen IT</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6 sm:space-y-8">
                <div className="space-y-4 sm:space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <User className="w-3 h-3" /> Username
                    </label>
                    <input 
                      required
                      type="text"
                      placeholder="Masukkan username Anda"
                      value={loginData.username}
                      onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                      className={`w-full px-4 py-3 sm:py-4 rounded-2xl border transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm sm:text-base font-medium ${themeClasses.input}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Lock className="w-3 h-3" /> Password
                    </label>
                    <input 
                      required
                      type="password"
                      placeholder="Masukkan password Anda"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      className={`w-full px-4 py-3 sm:py-4 rounded-2xl border transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm sm:text-base font-medium ${themeClasses.input}`}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    disabled={loggingIn}
                    type="submit"
                    style={{ backgroundColor: primaryColor }}
                    className="w-full text-white font-black py-4 sm:py-5 rounded-2xl text-sm sm:text-base shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 group"
                  >
                    {loggingIn ? (
                      <RefreshCcw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        Masuk ke Dashboard
                      </>
                    )}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowLogin(false)}
                    className={`w-full mt-4 font-bold py-3 text-xs sm:text-sm transition-all uppercase tracking-widest ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
