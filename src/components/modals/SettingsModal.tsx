import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Settings2, 
  Palette, 
  Layout, 
  Mail, 
  MessageCircle, 
  Server, 
  Save, 
  Plus, 
  Trash2, 
  RefreshCcw, 
  Check 
} from 'lucide-react';
import { IAppSettings, LOGO_OPTIONS, COLORS } from '../../types';

interface SettingsModalProps {
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  isDark: boolean;
  themeClasses: any;
  appSettings: IAppSettings;
  setAppSettings: (settings: IAppSettings) => void;
  savingSettings: boolean;
  handleSaveSettings: (e: React.FormEvent) => void;
  newEmail: string;
  setNewEmail: (email: string) => void;
  newChatId: string;
  setNewChatId: (id: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  showSettings,
  setShowSettings,
  isDark,
  themeClasses,
  appSettings,
  setAppSettings,
  savingSettings,
  handleSaveSettings,
  newEmail,
  setNewEmail,
  newChatId,
  setNewChatId
}) => {
  const primaryColor = appSettings.primary_color;

  return (
    <AnimatePresence>
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border ${themeClasses.card}`}
          >
            <div className={`sticky top-0 z-10 p-4 sm:p-6 border-b flex items-center justify-between backdrop-blur-md ${themeClasses.header}`}>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}40` }}
                >
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`text-lg sm:text-xl font-black tracking-tight ${themeClasses.text}`}>System Settings</h2>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Konfigurasi Global Aplikasi</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-slate-100 text-slate-400'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-4 sm:p-8 space-y-8 sm:space-y-12">
              {/* Appearance Section */}
              <div className="space-y-6 sm:space-y-8">
                <div className="flex items-center gap-3 mb-6">
                  <Palette className="w-5 h-5 text-emerald-500" />
                  <h3 className={`text-base sm:text-lg font-black tracking-tight ${themeClasses.text}`}>Tampilan & Branding</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Nama Aplikasi</label>
                    <input 
                      type="text"
                      value={appSettings.app_name}
                      onChange={(e) => setAppSettings({...appSettings, app_name: e.target.value})}
                      className={`w-full px-4 py-3 sm:py-4 rounded-2xl border transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm sm:text-base font-medium ${themeClasses.input}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Warna Utama</label>
                    <div className="flex flex-wrap gap-3 p-3 rounded-2xl border bg-slate-50/50">
                      {COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setAppSettings({...appSettings, primary_color: color})}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl transition-all flex items-center justify-center shadow-sm active:scale-90 ${appSettings.primary_color === color ? 'ring-4 ring-emerald-500/20 scale-110' : 'hover:scale-105'}`}
                          style={{ backgroundColor: color }}
                        >
                          {appSettings.primary_color === color && <Check className="text-white w-4 h-4 sm:w-5 h-5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Pilih Icon Logo</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
                    {LOGO_OPTIONS.map(option => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setAppSettings({...appSettings, logo_type: option.id})}
                        className={`p-4 sm:p-6 rounded-3xl border transition-all flex flex-col items-center gap-2 sm:gap-3 group active:scale-95 ${
                          appSettings.logo_type === option.id 
                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                            : isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <option.icon className={`w-6 h-6 sm:w-8 sm:h-8 transition-transform group-hover:scale-110`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest`}>{option.id}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Custom Logo URL (Opsional)</label>
                    <input 
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={appSettings.custom_logo}
                      onChange={(e) => setAppSettings({...appSettings, custom_logo: e.target.value})}
                      className={`w-full px-4 py-3 sm:py-4 rounded-2xl border transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm sm:text-base font-medium ${themeClasses.input}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Custom Favicon URL (Opsional)</label>
                    <input 
                      type="url"
                      placeholder="https://example.com/favicon.ico"
                      value={appSettings.custom_favicon}
                      onChange={(e) => setAppSettings({...appSettings, custom_favicon: e.target.value})}
                      className={`w-full px-4 py-3 sm:py-4 rounded-2xl border transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm sm:text-base font-medium ${themeClasses.input}`}
                    />
                  </div>
                </div>
              </div>

              {/* Notifications Section */}
              <div className="space-y-6 sm:space-y-8">
                <div className="flex items-center gap-3 mb-6">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <h3 className={`text-base sm:text-lg font-black tracking-tight ${themeClasses.text}`}>Email & SMTP</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">SMTP Host</label>
                    <input 
                      type="text"
                      value={appSettings.smtp_host}
                      onChange={(e) => setAppSettings({...appSettings, smtp_host: e.target.value})}
                      className={`w-full px-4 py-3 rounded-2xl border transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium ${themeClasses.input}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">SMTP Port</label>
                    <input 
                      type="text"
                      value={appSettings.smtp_port}
                      onChange={(e) => setAppSettings({...appSettings, smtp_port: e.target.value})}
                      className={`w-full px-4 py-3 rounded-2xl border transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium ${themeClasses.input}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">SMTP User</label>
                    <input 
                      type="text"
                      value={appSettings.smtp_user}
                      onChange={(e) => setAppSettings({...appSettings, smtp_user: e.target.value})}
                      className={`w-full px-4 py-3 rounded-2xl border transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium ${themeClasses.input}`}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Email Penerima Notifikasi</label>
                  <div className="flex gap-2">
                    <input 
                      type="email"
                      placeholder="email@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className={`flex-1 px-4 py-3 rounded-2xl border transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium ${themeClasses.input}`}
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        if (newEmail && !appSettings.notification_emails.includes(newEmail)) {
                          setAppSettings({...appSettings, notification_emails: [...appSettings.notification_emails, newEmail]});
                          setNewEmail('');
                        }
                      }}
                      className="px-6 rounded-2xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {appSettings.notification_emails.map(email => (
                      <span key={email} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                        {email}
                        <button 
                          type="button"
                          onClick={() => setAppSettings({...appSettings, notification_emails: appSettings.notification_emails.filter(e => e !== email)})}
                          className="text-rose-500 hover:text-rose-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Telegram Section */}
              <div className="space-y-6 sm:space-y-8">
                <div className="flex items-center gap-3 mb-6">
                  <MessageCircle className="w-5 h-5 text-sky-500" />
                  <h3 className={`text-base sm:text-lg font-black tracking-tight ${themeClasses.text}`}>Telegram Integration</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Bot Token</label>
                  <input 
                    type="password"
                    placeholder="Masukkan Bot Token dari @BotFather"
                    value={appSettings.telegram_bot_token}
                    onChange={(e) => setAppSettings({...appSettings, telegram_bot_token: e.target.value})}
                    className={`w-full px-4 py-3 rounded-2xl border transition-all focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none text-sm font-medium ${themeClasses.input}`}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Chat IDs Penerima</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Masukkan Chat ID"
                      value={newChatId}
                      onChange={(e) => setNewChatId(e.target.value)}
                      className={`flex-1 px-4 py-3 rounded-2xl border transition-all focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none text-sm font-medium ${themeClasses.input}`}
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        if (newChatId && !appSettings.telegram_chat_ids.includes(newChatId)) {
                          setAppSettings({...appSettings, telegram_chat_ids: [...appSettings.telegram_chat_ids, newChatId]});
                          setNewChatId('');
                        }
                      }}
                      className="px-6 rounded-2xl bg-sky-500 text-white font-bold text-sm hover:bg-sky-600 transition-all active:scale-95 shadow-lg shadow-sky-500/20"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {appSettings.telegram_chat_ids.map(id => (
                      <span key={id} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                        {id}
                        <button 
                          type="button"
                          onClick={() => setAppSettings({...appSettings, telegram_chat_ids: appSettings.telegram_chat_ids.filter(i => i !== id)})}
                          className="text-rose-500 hover:text-rose-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-8 sm:pt-12 border-t flex flex-col sm:flex-row gap-4">
                <button 
                  disabled={savingSettings}
                  type="submit"
                  style={{ backgroundColor: primaryColor }}
                  className="flex-1 text-white font-black py-4 sm:py-5 rounded-2xl text-sm sm:text-base shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 group"
                >
                  {savingSettings ? (
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className={`px-8 py-4 sm:py-5 rounded-2xl font-bold text-sm sm:text-base transition-all ${isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  Batal
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
