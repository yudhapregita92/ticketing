import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Settings2, 
  Layout, 
  Palette, 
  Bell, 
  Database, 
  Plus, 
  Trash2, 
  Save,
  Mail,
  MessageCircle,
  Send,
  Upload,
  Image as ImageIcon,
  Info,
  RefreshCw,
  History
} from 'lucide-react';

import { api } from '../../services/api';
import { APP_VERSION, BUILD_DATE, UPDATE_HISTORY, getEnvironment } from '../../version';

interface SettingsModalProps {
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  isDark: boolean;
  themeClasses: any;
  settingsTab: 'general' | 'branding' | 'notifications' | 'data' | 'system';
  setSettingsTab: (tab: 'general' | 'branding' | 'notifications' | 'data' | 'system') => void;
  appSettings: any;
  setAppSettings: (settings: any) => void;
  LOGO_OPTIONS: any[];
  newEmailInput: string;
  setNewEmailInput: (email: string) => void;
  showEmailInput: boolean;
  setShowEmailInput: (show: boolean) => void;
  handleUpdateSettings: (e: React.FormEvent) => void;
  primaryColor: string;
  adminUser: any;
  itPersonnel: any[];
  departments: any[];
  categories: any[];
  addingType: 'it' | 'dept' | 'cat' | 'master-user' | 'admin-user' | null;
  setAddingType: (type: 'it' | 'dept' | 'cat' | 'master-user' | 'admin-user' | null) => void;
  newItemName: string;
  setNewItemName: (name: string) => void;
  newItemAssignedTo: string;
  setNewItemAssignedTo: (user: string) => void;
  handleManagementAction: (type: 'it' | 'dept' | 'cat' | 'master-user' | 'admin-user', action: 'add' | 'delete', item?: any) => void;
  masterUsers: any[];
  adminUsers: any[];
  handleUploadExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SettingsModal = React.memo(({
  showSettings,
  setShowSettings,
  isDark,
  themeClasses,
  settingsTab,
  setSettingsTab,
  appSettings,
  setAppSettings,
  LOGO_OPTIONS,
  newEmailInput,
  setNewEmailInput,
  showEmailInput,
  setShowEmailInput,
  handleUpdateSettings,
  primaryColor,
  adminUser,
  itPersonnel,
  departments,
  categories,
  addingType,
  setAddingType,
  newItemName,
  setNewItemName,
  newItemAssignedTo,
  setNewItemAssignedTo,
  handleManagementAction,
  masterUsers,
  adminUsers,
  handleUploadExcel
}: SettingsModalProps) => {
  if (!showSettings) return null;

  const [masterUserName, setMasterUserName] = React.useState('');
  const [masterUserDept, setMasterUserDept] = React.useState('');
  const [masterUserPhone, setMasterUserPhone] = React.useState('');
  const [masterUserIndex, setMasterUserIndex] = React.useState('');
  const [masterUserEmail, setMasterUserEmail] = React.useState('');

  const [adminUserUsername, setAdminUserUsername] = React.useState('');
  const [adminUserPassword, setAdminUserPassword] = React.useState('');
  const [adminUserFullName, setAdminUserFullName] = React.useState('');
  const [adminUserRole, setAdminUserRole] = React.useState('Staff IT Support');

  const handleAddAdminUser = async () => {
    if (!adminUserUsername || !adminUserPassword || !adminUserFullName || !adminUserRole) {
      alert('Semua kolom wajib diisi');
      return;
    }
    try {
      await api.addAdminUser({ 
        username: adminUserUsername, 
        password: adminUserPassword, 
        full_name: adminUserFullName,
        role: adminUserRole
      });
      setAddingType(null);
      setAdminUserUsername('');
      setAdminUserPassword('');
      setAdminUserFullName('');
      setAdminUserRole('Staff IT Support');
      handleManagementAction('admin-user', 'add');
    } catch (err: any) {
      alert(err.message || 'Gagal menambah admin');
    }
  };

  const handleDeleteAdminUser = async (id: number) => {
    if (!confirm('Hapus admin ini?')) return;
    try {
      await api.deleteAdminUser(id);
      handleManagementAction('admin-user', 'delete', { id });
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus admin');
    }
  };

  const handleAddMasterUser = async () => {
    if (!masterUserName || !masterUserDept || !masterUserPhone || !masterUserIndex) {
      alert('Semua kolom wajib diisi (kecuali email)');
      return;
    }
    try {
      await api.addMasterUser({ 
        full_name: masterUserName, 
        department: masterUserDept, 
        phone: masterUserPhone,
        employee_index: masterUserIndex,
        email: masterUserEmail || null
      });
      setAddingType(null);
      setMasterUserName('');
      setMasterUserDept('');
      setMasterUserPhone('');
      setMasterUserIndex('');
      setMasterUserEmail('');
      handleManagementAction('master-user', 'add');
    } catch (err: any) {
      alert(err.message || 'Gagal menambah user');
    }
  };

  const handleDeleteMasterUser = async (id: number) => {
    if (!confirm('Hapus user ini?')) return;
    try {
      await api.deleteMasterUser(id);
      handleManagementAction('master-user', 'delete', { id });
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus user');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowSettings(false)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] transition-colors ${themeClasses.card} ${themeClasses.text}`}
      >
        <div className={`p-4 sm:p-6 border-b shrink-0 ${themeClasses.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <Settings2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-lg font-black tracking-tight ${themeClasses.text}`}>Pengaturan Sistem</h2>
                <p className={`text-[10px] font-bold capitalize tracking-widest ${themeClasses.textMuted}`}>Konfigurasi aplikasi & branding</p>
              </div>
            </div>
            <button 
              onClick={() => setShowSettings(false)}
              className={`p-2 rounded-full transition-all ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className={`w-full sm:w-64 border-b sm:border-b-0 sm:border-r p-2 sm:p-6 space-y-2 ${themeClasses.border} ${themeClasses.bgSecondary}`}>
            <button 
              onClick={() => setSettingsTab('general')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black capitalize tracking-widest transition-all ${settingsTab === 'general' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : `text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800`}`}
            >
              <Layout className="w-4 h-4" /> Umum
            </button>
            <button 
              onClick={() => setSettingsTab('branding')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black capitalize tracking-widest transition-all ${settingsTab === 'branding' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : `text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800`}`}
            >
              <Palette className="w-4 h-4" /> Branding
            </button>
            <button 
              onClick={() => setSettingsTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black capitalize tracking-widest transition-all ${settingsTab === 'notifications' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : `text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800`}`}
            >
              <Bell className="w-4 h-4" /> Notifikasi
            </button>
            <button 
              onClick={() => setSettingsTab('data')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black capitalize tracking-widest transition-all ${settingsTab === 'data' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : `text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800`}`}
            >
              <Database className="w-4 h-4" /> Data & API
            </button>
            <button 
              onClick={() => setSettingsTab('system')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black capitalize tracking-widest transition-all ${settingsTab === 'system' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : `text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800`}`}
            >
              <Settings2 className="w-4 h-4" /> Sistem
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <form id="settings-form" onSubmit={handleUpdateSettings} className="p-4 sm:p-6 space-y-6">
              {settingsTab === 'general' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Nama Aplikasi</label>
                    <input 
                      type="text"
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                      value={appSettings.app_name}
                      onChange={e => setAppSettings({...appSettings, app_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Logo Default</label>
                    <div className="grid grid-cols-5 gap-2">
                      {LOGO_OPTIONS.map(logo => (
                        <button
                          key={logo.id}
                          type="button"
                          onClick={() => setAppSettings({...appSettings, logo_type: logo.id})}
                          className={`p-3 rounded-xl border flex items-center justify-center transition-all ${appSettings.logo_type === logo.id ? 'bg-emerald-600 text-white border-emerald-600' : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400 hover:border-emerald-500`}`}
                        >
                          <logo.icon className="w-5 h-5" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'branding' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Warna Utama (Public)</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color"
                        className="w-10 h-10 rounded-lg cursor-pointer border-none"
                        value={appSettings.primary_color}
                        onChange={e => setAppSettings({...appSettings, primary_color: e.target.value})}
                      />
                      <input 
                        type="text"
                        className={`flex-1 px-4 py-2 rounded-xl border text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                        value={appSettings.primary_color}
                        onChange={e => setAppSettings({...appSettings, primary_color: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Tema Default (Public)</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAppSettings({...appSettings, theme_mode: 'light'})}
                        className={`flex-1 py-2 rounded-xl border text-[10px] font-black capitalize tracking-widest transition-all ${appSettings.theme_mode === 'light' ? 'bg-emerald-600 text-white border-emerald-600' : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400`}`}
                      >
                        Light Mode
                      </button>
                      <button
                        type="button"
                        onClick={() => setAppSettings({...appSettings, theme_mode: 'dark'})}
                        className={`flex-1 py-2 rounded-xl border text-[10px] font-black capitalize tracking-widest transition-all ${appSettings.theme_mode === 'dark' ? 'bg-emerald-600 text-white border-emerald-600' : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400`}`}
                      >
                        Dark Mode
                      </button>
                    </div>
                  </div>

                  {adminUser && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      <h3 className="text-[10px] font-black text-emerald-600 capitalize tracking-widest">Preferensi Admin ({adminUser.username})</h3>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Warna Utama Admin</label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="color"
                            className="w-10 h-10 rounded-lg cursor-pointer border-none"
                            value={appSettings.admin_primary_color}
                            onChange={e => setAppSettings({...appSettings, admin_primary_color: e.target.value})}
                          />
                          <input 
                            type="text"
                            className={`flex-1 px-4 py-2 rounded-xl border text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                            value={appSettings.admin_primary_color}
                            onChange={e => setAppSettings({...appSettings, admin_primary_color: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Tema Admin</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setAppSettings({...appSettings, admin_theme_mode: 'light'})}
                            className={`flex-1 py-2 rounded-xl border text-[10px] font-black capitalize tracking-widest transition-all ${appSettings.admin_theme_mode === 'light' ? 'bg-emerald-600 text-white border-emerald-600' : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400`}`}
                          >
                            Light Mode
                          </button>
                          <button
                            type="button"
                            onClick={() => setAppSettings({...appSettings, admin_theme_mode: 'dark'})}
                            className={`flex-1 py-2 rounded-xl border text-[10px] font-black capitalize tracking-widest transition-all ${appSettings.admin_theme_mode === 'dark' ? 'bg-emerald-600 text-white border-emerald-600' : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400`}`}
                          >
                            Dark Mode
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Icon Shortcut (PWA - iPhone & Android)</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-sm">
                        {appSettings.custom_logo ? (
                          <img src={appSettings.custom_logo} alt="Shortcut Icon" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-[10px] font-bold text-slate-500 mb-2">Upload icon (512x512px) untuk shortcut di layar utama ponsel.</p>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                          <label className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black capitalize tracking-widest cursor-pointer hover:bg-emerald-700 transition-all flex items-center gap-2">
                            <Upload className="w-3 h-3" /> Pilih Gambar
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setAppSettings({...appSettings, custom_logo: reader.result as string});
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                          </label>
                          {appSettings.custom_logo && (
                            <button 
                              type="button"
                              onClick={() => setAppSettings({...appSettings, custom_logo: ''})}
                              className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black capitalize tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                            >
                              Reset Icon
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Favicon (Browser Icon)</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-sm">
                        {appSettings.custom_favicon ? (
                          <img src={appSettings.custom_favicon} alt="Favicon" className="w-full h-full object-contain p-2" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-[10px] font-bold text-slate-500 mb-2">Upload icon (32x32px atau 64x64px) untuk tab browser.</p>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                          <label className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black capitalize tracking-widest cursor-pointer hover:bg-emerald-700 transition-all flex items-center gap-2">
                            <Upload className="w-3 h-3" /> Pilih Favicon
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setAppSettings({...appSettings, custom_favicon: reader.result as string});
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                          </label>
                          {appSettings.custom_favicon && (
                            <button 
                              type="button"
                              onClick={() => setAppSettings({...appSettings, custom_favicon: ''})}
                              className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black capitalize tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                            >
                              Reset Favicon
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Email Notifikasi</label>
                      <button 
                        type="button"
                        onClick={() => setShowEmailInput(true)}
                        className="text-[10px] font-black text-emerald-600 capitalize tracking-widest hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Tambah Email
                      </button>
                    </div>
                    
                    {showEmailInput && (
                      <div className="flex gap-2">
                        <input 
                          type="email"
                          placeholder="email@example.com"
                          className={`flex-1 px-4 py-2 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                          value={newEmailInput}
                          onChange={e => setNewEmailInput(e.target.value)}
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            if (newEmailInput && !appSettings.notification_emails.includes(newEmailInput)) {
                              setAppSettings({...appSettings, notification_emails: [...appSettings.notification_emails, newEmailInput]});
                              setNewEmailInput('');
                              setShowEmailInput(false);
                            }
                          }}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                        >
                          Add
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {(!appSettings.notification_emails || appSettings.notification_emails.length === 0) ? (
                        <p className="text-xs text-slate-400 italic text-center py-4">Belum ada email notifikasi.</p>
                      ) : (
                        appSettings.notification_emails.map((email: string) => (
                          <div key={email} className={`flex items-center justify-between p-3 rounded-xl border ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                            <div className="flex items-center gap-3">
                              <Mail className="w-4 h-4 text-slate-400" />
                              <span className="text-xs font-bold">{email}</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setAppSettings({...appSettings, notification_emails: appSettings.notification_emails.filter((e: string) => e !== email)})}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Integrasi Telegram</label>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className={`text-[9px] font-bold ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bot Token</label>
                        <div className="relative">
                          <Send className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input 
                            type="password"
                            placeholder="123456789:ABCDEF..."
                            className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                            value={appSettings.telegram_bot_token}
                            onChange={e => setAppSettings({...appSettings, telegram_bot_token: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'data' && (
                <div className="space-y-8">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                    <div className="flex gap-3">
                      <Database className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <h4 className="text-xs font-black text-amber-900 capitalize tracking-widest">Data Management</h4>
                        <p className="text-[10px] text-amber-700 font-medium leading-relaxed mt-1">
                          Kelola personil IT, departemen, kategori, dan ekspor data.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Otomatis Hapus Foto</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className={`text-[9px] font-bold ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Durasi Penyimpanan Foto</label>
                        <select 
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                          value={appSettings.photo_cleanup_duration || '24'}
                          onChange={e => setAppSettings({...appSettings, photo_cleanup_duration: e.target.value})}
                        >
                          <option value="24">24 Jam (1 Hari)</option>
                          <option value="48">48 Jam (2 Hari)</option>
                          <option value="60">60 Jam (2.5 Hari)</option>
                          <option value="168">1 Minggu (7 Hari)</option>
                        </select>
                        <p className="text-[9px] text-slate-400 italic ml-1">Foto tiket akan dihapus otomatis setelah durasi ini terlewati.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* IT Personnel */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className={`text-[10px] font-black ${themeClasses.textMuted} capitalize tracking-widest ml-1`}>Tim IT</label>
                        <button 
                          type="button"
                          onClick={() => setAddingType(addingType === 'it' ? null : 'it')} 
                          className="text-[10px] font-black text-emerald-500 capitalize tracking-widest hover:underline"
                        >
                          {addingType === 'it' ? 'Batal' : '+ Tambah IT'}
                        </button>
                      </div>
                      
                      {addingType === 'it' && (
                        <div className="flex gap-2">
                          <input 
                            autoFocus
                            type="text"
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            placeholder="Nama IT baru..."
                            className={`flex-1 border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.input}`}
                            onKeyDown={e => e.key === 'Enter' && handleManagementAction('it', 'add')}
                          />
                          <button 
                            type="button"
                            onClick={() => handleManagementAction('it', 'add')}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black capitalize"
                          >
                            Simpan
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(itPersonnel) && itPersonnel.map(it => (
                          <div key={it.id} className={`flex items-center gap-2 ${themeClasses.bgSecondary} px-3 py-1.5 rounded-lg border ${themeClasses.border} group`}>
                            <span className={`text-xs font-bold ${themeClasses.text}`}>{it.name}</span>
                            <button type="button" onClick={() => handleManagementAction('it', 'delete', it)} className="text-rose-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Departments */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className={`text-[10px] font-black ${themeClasses.textMuted} capitalize tracking-widest ml-1`}>Departemen</label>
                        <button 
                          type="button"
                          onClick={() => setAddingType(addingType === 'dept' ? null : 'dept')} 
                          className="text-[10px] font-black text-emerald-500 capitalize tracking-widest hover:underline"
                        >
                          {addingType === 'dept' ? 'Batal' : '+ Tambah Departemen'}
                        </button>
                      </div>

                      {addingType === 'dept' && (
                        <div className="flex gap-2">
                          <input 
                            autoFocus
                            type="text"
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            placeholder="Nama Departemen baru..."
                            className={`flex-1 border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.input}`}
                            onKeyDown={e => e.key === 'Enter' && handleManagementAction('dept', 'add')}
                          />
                          <button 
                            type="button"
                            onClick={() => handleManagementAction('dept', 'add')}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black capitalize"
                          >
                            Simpan
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(departments) && departments.map(dept => (
                          <div key={dept.id} className={`flex items-center gap-2 ${themeClasses.bgSecondary} px-3 py-1.5 rounded-lg border ${themeClasses.border} group`}>
                            <span className={`text-xs font-bold ${themeClasses.text}`}>{dept.name}</span>
                            <button type="button" onClick={() => handleManagementAction('dept', 'delete', dept)} className="text-rose-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className={`text-[10px] font-black ${themeClasses.textMuted} capitalize tracking-widest ml-1`}>Kategori</label>
                        <button 
                          type="button"
                          onClick={() => setAddingType(addingType === 'cat' ? null : 'cat')} 
                          className="text-[10px] font-black text-emerald-500 capitalize tracking-widest hover:underline"
                        >
                          {addingType === 'cat' ? 'Batal' : '+ Tambah Kategori'}
                        </button>
                      </div>

                      {addingType === 'cat' && (
                        <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="flex gap-2">
                            <input 
                              autoFocus
                              type="text"
                              value={newItemName}
                              onChange={e => setNewItemName(e.target.value)}
                              placeholder="Nama Kategori baru..."
                              className={`flex-1 border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.input}`}
                            />
                          </div>
                          <div className="flex gap-2 items-center">
                            <select
                              value={newItemAssignedTo}
                              onChange={e => setNewItemAssignedTo(e.target.value)}
                              className={`flex-1 border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.input}`}
                            >
                              <option value="">Pilih IT Penanggung Jawab...</option>
                              {adminUsers.map(user => (
                                <option key={user.id} value={user.username}>{user.full_name} ({user.username})</option>
                              ))}
                            </select>
                            <button 
                              type="button"
                              onClick={() => handleManagementAction('cat', 'add')}
                              className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black capitalize"
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(categories) && categories.map(cat => (
                          <div key={cat.id} className={`flex flex-col gap-1 ${themeClasses.bgSecondary} px-3 py-2 rounded-lg border ${themeClasses.border} group min-w-[120px]`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-bold ${themeClasses.text}`}>{cat.name}</span>
                              <button type="button" onClick={() => handleManagementAction('cat', 'delete', cat)} className="text-rose-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            {cat.assigned_to && (
                              <span className="text-[9px] font-black text-emerald-500 capitalize tracking-tighter">
                                PIC: {cat.assigned_to}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black capitalize tracking-widest text-slate-400">Master Data User</h3>
                      <div className="flex items-center gap-3">
                        <label className="text-[10px] font-black text-blue-600 hover:text-blue-700 capitalize tracking-widest cursor-pointer flex items-center gap-1">
                          Upload Excel
                          <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleUploadExcel} />
                        </label>
                        <button 
                          type="button"
                          onClick={() => setAddingType('master-user')}
                          className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 capitalize tracking-widest"
                        >
                          + Tambah User
                        </button>
                      </div>
                    </div>

                    {addingType === 'master-user' && (
                      <div className={`p-4 rounded-xl border-2 border-emerald-500/30 space-y-3 ${themeClasses.bgSecondary}`}>
                        <input 
                          autoFocus
                          type="text"
                          placeholder="Nama Lengkap"
                          className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                          value={masterUserName}
                          onChange={e => setMasterUserName(e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <select 
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                            value={masterUserDept}
                            onChange={e => setMasterUserDept(e.target.value)}
                          >
                            <option value="">Pilih Bagian...</option>
                            {Array.isArray(departments) && departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                          </select>
                          <input 
                            type="text"
                            placeholder="No. Telepon"
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                            value={masterUserPhone}
                            onChange={e => setMasterUserPhone(e.target.value)}
                          />
                        </div>
                        <input 
                          type="text"
                          placeholder="Indek Karyawan"
                          className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                          value={masterUserIndex}
                          onChange={e => setMasterUserIndex(e.target.value)}
                        />
                        <input 
                          type="email"
                          placeholder="Email (Opsional)"
                          className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                          value={masterUserEmail}
                          onChange={e => setMasterUserEmail(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={handleAddMasterUser}
                            className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-bold capitalize tracking-widest"
                          >
                            Simpan User
                          </button>
                          <button 
                            type="button"
                            onClick={() => setAddingType(null)}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold capitalize tracking-widest border ${themeClasses.border} ${themeClasses.textMuted}`}
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {Array.isArray(masterUsers) && masterUsers.map(user => (
                        <div key={user.id} className={`flex items-center justify-between p-2.5 rounded-xl border ${themeClasses.border} ${themeClasses.bgSecondary}`}>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold">{user.full_name}</span>
                            <span className="text-[9px] text-slate-400 capitalize font-black">{user.department} • {user.phone} • Indek: {user.employee_index} {user.email ? `• ${user.email}` : ''}</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleDeleteMasterUser(user.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Admin Users */}
                  <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black capitalize tracking-widest text-slate-400">Akun Admin IT</h3>
                      <button 
                        type="button"
                        onClick={() => setAddingType('admin-user')}
                        className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 capitalize tracking-widest"
                      >
                        + Tambah Admin
                      </button>
                    </div>

                    {addingType === 'admin-user' && (
                      <div className={`p-4 rounded-xl border-2 border-emerald-500/30 space-y-3 ${themeClasses.bgSecondary}`}>
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            autoFocus
                            type="text"
                            placeholder="Username"
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                            value={adminUserUsername}
                            onChange={e => setAdminUserUsername(e.target.value)}
                          />
                          <input 
                            type="password"
                            placeholder="Password"
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                            value={adminUserPassword}
                            onChange={e => setAdminUserPassword(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text"
                            placeholder="Nama Lengkap"
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                            value={adminUserFullName}
                            onChange={e => setAdminUserFullName(e.target.value)}
                          />
                          <select 
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                            value={adminUserRole}
                            onChange={e => setAdminUserRole(e.target.value)}
                          >
                            <option value="Staff IT Support">Staff IT Support</option>
                            <option value="Staff App Support">Staff App Support</option>
                            <option value="Super Admin">Super Admin</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={handleAddAdminUser}
                            className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-bold capitalize tracking-widest"
                          >
                            Simpan Admin
                          </button>
                          <button 
                            type="button"
                            onClick={() => setAddingType(null)}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold capitalize tracking-widest border ${themeClasses.border} ${themeClasses.textMuted}`}
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {Array.isArray(adminUsers) && adminUsers.map(user => (
                        <div key={user.id} className={`flex items-center justify-between p-2.5 rounded-xl border ${themeClasses.border} ${themeClasses.bgSecondary}`}>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold">{user.full_name} ({user.username})</span>
                            <span className="text-[9px] text-slate-400 capitalize font-black">{user.role}</span>
                          </div>
                          {user.role !== 'Super Admin' && (
                            <button 
                              type="button"
                              onClick={() => handleDeleteAdminUser(user.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* System Maintenance */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      type="button"
                      onClick={() => window.open('/api/tickets/export', '_blank')}
                      className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border transition-all hover:border-emerald-500 hover:bg-emerald-50 group ${themeClasses.bgSecondary} ${themeClasses.border}`}
                    >
                      <Save className="w-6 h-6 text-slate-400 group-hover:text-emerald-600" />
                      <span className="text-[10px] font-black capitalize tracking-widest text-slate-600 group-hover:text-emerald-700">Export CSV</span>
                    </button>
                    <button 
                      type="button"
                      className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border transition-all hover:border-blue-500 hover:bg-blue-50 group ${themeClasses.bgSecondary} ${themeClasses.border}`}
                    >
                      <MessageCircle className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                      <span className="text-[10px] font-black capitalize tracking-widest text-slate-600 group-hover:text-blue-700">API Docs</span>
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === 'system' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {/* Version Info */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black capitalize tracking-widest text-slate-400 flex items-center gap-2">
                      <Info className="w-3 h-3" /> Informasi Versi
                    </h3>
                    <div className={`p-6 rounded-3xl border ${themeClasses.border} ${themeClasses.bgSecondary} relative overflow-hidden`}>
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Current Version</div>
                          <div className="text-4xl font-black tracking-tighter flex items-baseline gap-2">
                            v{APP_VERSION}
                            <span className={`text-xs font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${
                              getEnvironment() === 'Staging' 
                                ? 'bg-amber-500/10 text-amber-500' 
                                : 'bg-emerald-500/10 text-emerald-500'
                            }`}>
                              {getEnvironment()}
                            </span>
                          </div>
                          <div className="mt-4 flex items-center gap-4">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Build Date</span>
                              <span className="text-xs font-bold">{BUILD_DATE}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Environment</span>
                              <span className="text-xs font-bold">Production</span>
                            </div>
                          </div>
                        </div>
                        <div className="hidden sm:block">
                          <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Settings2 className="w-12 h-12 text-emerald-500 opacity-20" />
                          </div>
                        </div>
                      </div>
                      {/* Decorative background element */}
                      <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                    </div>
                  </div>

                  {/* Update History */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black capitalize tracking-widest text-slate-400 flex items-center gap-2">
                      <History className="w-3 h-3" /> Riwayat Pembaruan
                    </h3>
                    <div className="space-y-3">
                      {UPDATE_HISTORY.map((update, idx) => (
                        <div key={idx} className={`p-4 rounded-2xl border ${themeClasses.border} ${themeClasses.bgSecondary} hover:border-emerald-500/30 transition-colors group`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-black tracking-widest">
                                v{update.version}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">{update.date}</span>
                            </div>
                            {idx === 0 && (
                              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Latest</span>
                            )}
                          </div>
                          <ul className="space-y-1">
                            {update.changes.map((change, cIdx) => (
                              <li key={cIdx} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                                {change}
                              </li>
                            ))}
                          </ul>
                          {idx > 0 && (
                            <button 
                              type="button"
                              onClick={() => alert(`Fitur Rollback ke v${update.version} sedang dalam pengembangan.`)}
                              className="mt-4 w-full py-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 hover:border-emerald-500/50 transition-all opacity-0 group-hover:opacity-100"
                            >
                              Rollback ke Versi Ini
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* System Maintenance */}
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-black capitalize tracking-widest text-slate-400">Pemeliharaan Sistem</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => {
                          localStorage.clear();
                          window.location.reload();
                        }}
                        className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border transition-all hover:border-rose-500 hover:bg-rose-50 group ${themeClasses.bgSecondary} ${themeClasses.border}`}
                      >
                        <Trash2 className="w-6 h-6 text-slate-400 group-hover:text-rose-600" />
                        <span className="text-[10px] font-black capitalize tracking-widest text-slate-600 group-hover:text-rose-700">Bersihkan Cache</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => window.location.reload()}
                        className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border transition-all hover:border-blue-500 hover:bg-blue-50 group ${themeClasses.bgSecondary} ${themeClasses.border}`}
                      >
                        <RefreshCw className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                        <span className="text-[10px] font-black capitalize tracking-widest text-slate-600 group-hover:text-blue-700">Muat Ulang Paksa</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>

        <div className={`p-4 sm:p-6 border-t shrink-0 flex justify-end ${themeClasses.border} ${themeClasses.bgCard}`}>
          <button 
            form="settings-form"
            type="submit"
            style={{ backgroundColor: primaryColor }}
            className="w-full sm:w-auto px-8 py-3 sm:py-3 rounded-2xl text-white font-black capitalize tracking-widest text-xs sm:text-sm shadow-xl shadow-emerald-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Simpan Konfigurasi
          </button>
        </div>
      </motion.div>
    </div>
  );
});
