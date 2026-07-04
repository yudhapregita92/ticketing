import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User, Lock, LogIn, ChevronDown, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserLoginScreenProps {
  isDark: boolean;
  themeClasses: any;
  primaryColor: string;
  masterUsers: any[];
  onLogin: (user: any) => void;
  onAdminLoginClick: () => void;
  appSettings?: any;
}

export const UserLoginScreen = React.memo(({
  isDark,
  themeClasses,
  primaryColor,
  masterUsers,
  onLogin,
  onAdminLoginClick,
  appSettings
}: UserLoginScreenProps) => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [indexCode, setIndexCode] = useState('');
  const [error, setError] = useState('');

  const filteredUsers = masterUsers.filter(u => 
    u.full_name.toLowerCase().includes(searchName.toLowerCase()) || 
    (u.employee_index && u.employee_index.toLowerCase().includes(searchName.toLowerCase()))
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedUser) {
      setError('Silakan pilih nama Anda terlebih dahulu');
      return;
    }

    if (!indexCode) {
      setError(`Silakan masukkan ${appSettings?.login_index_label || "indek (KDK/GGF)"} Anda`);
      return;
    }

    // Verify index
    if (selectedUser.employee_index !== indexCode) {
      setError(`${appSettings?.login_index_label || "Indek"} yang Anda masukkan salah`);
      return;
    }

    // Success
    toast.success(`Selamat datang, ${selectedUser.full_name}!`);
    onLogin(selectedUser);
  };

  const loginTitle = appSettings?.login_title || "Masuk ke Aplikasi";
  const loginSubtitle = appSettings?.login_subtitle || "Silakan pilih nama dan masukkan indek Anda";
  const nameLabel = appSettings?.login_name_label || "Nama Anda";
  const indexLabel = appSettings?.login_index_label || "Indek (KDK/GGF)";
  const indexPlaceholder = appSettings?.login_index_placeholder || "Masukkan indek Anda...";

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${themeClasses.bg}`}>
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-md relative z-10 ${themeClasses.card} rounded-3xl p-8 shadow-2xl border ${themeClasses.border}`}
      >
        <div className="text-center mb-8 flex flex-col items-center">
          {appSettings?.login_logo ? (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden mb-4 shadow-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <img src={appSettings.login_logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
          ) : appSettings?.custom_logo ? (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden mb-4 shadow-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <img src={appSettings.custom_logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4 transform -rotate-6">
              <User className="w-8 h-8 text-white transform rotate-6" />
            </div>
          )}
          <h1 className={`text-2xl font-bold ${themeClasses.text}`}>{loginTitle}</h1>
          <p className={`text-sm ${themeClasses.textMuted} mt-2`}>{loginSubtitle}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* User Selection */}
          <div className="relative">
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${themeClasses.textMuted}`}>
              {nameLabel}
            </label>
            <div 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                showUserDropdown ? 'border-indigo-500 ring-2 ring-indigo-500/20' : themeClasses.input
              } ${selectedUser ? themeClasses.bg : themeClasses.bgSecondary}`}
              onClick={() => setShowUserDropdown(!showUserDropdown)}
            >
              <User className={`w-5 h-5 ${selectedUser ? 'text-indigo-500' : themeClasses.textMuted}`} />
              <div className="flex-1 truncate">
                {selectedUser ? (
                  <span className={`font-medium ${themeClasses.text}`}>{selectedUser.full_name}</span>
                ) : (
                  <span className={themeClasses.textMuted}>Pilih nama Anda...</span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''} ${themeClasses.textMuted}`} />
            </div>

            <AnimatePresence>
              {showUserDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute z-20 w-full mt-2 rounded-xl border shadow-xl overflow-hidden ${themeClasses.card} ${themeClasses.border}`}
                >
                  <div className={`p-2 border-b ${themeClasses.border}`}>
                    <input 
                      type="text"
                      placeholder="Cari nama atau indek..."
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-sm bg-transparent border-none focus:ring-0 ${themeClasses.text}`}
                      autoFocus
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(u => (
                        <div 
                          key={u.id}
                          onClick={() => {
                            setSelectedUser(u);
                            setShowUserDropdown(false);
                            setSearchName('');
                          }}
                          className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between group transition-colors ${
                            selectedUser?.id === u.id ? 'bg-indigo-500/10' : `hover:${themeClasses.bgSecondary}`
                          }`}
                        >
                          <div>
                            <div className={`font-medium text-sm ${themeClasses.text}`}>{u.full_name}</div>
                            <div className={`text-xs opacity-70 ${themeClasses.textMuted}`}>{u.department}</div>
                          </div>
                          {selectedUser?.id === u.id && (
                            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className={`p-4 text-center text-sm ${themeClasses.textMuted}`}>
                        Nama tidak ditemukan
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Index Input */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${themeClasses.textMuted}`}>
              {indexLabel}
            </label>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${themeClasses.textMuted}`} />
              <input 
                type="password"
                placeholder={indexPlaceholder}
                value={indexCode}
                onChange={(e) => setIndexCode(e.target.value)}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${themeClasses.input} bg-transparent`}
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 rounded-lg bg-rose-500/10 text-rose-600 text-sm font-medium border border-rose-500/20 text-center"
            >
              {error}
            </motion.div>
          )}

          <button 
            type="submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
          >
            <LogIn className="w-5 h-5" />
            Masuk
          </button>
        </form>

        <div className={`mt-8 pt-6 border-t flex justify-center ${themeClasses.border}`}>
          <button 
            type="button"
            onClick={onAdminLoginClick}
            className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-indigo-500 ${themeClasses.textMuted}`}
          >
            <ShieldCheck className="w-4 h-4" />
            Masuk sebagai Admin
          </button>
        </div>
      </motion.div>
    </div>
  );
});
