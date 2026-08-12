import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, X, Building2, Phone, Hash, Mail, Laptop, Shield, Award, Key } from 'lucide-react';

interface UserProfileModalProps {
  show: boolean;
  onClose: () => void;
  currentUser: any;
  masterUsers?: any[];
  isDark: boolean;
  themeClasses: any;
  onChangePasswordClick?: () => void;
  onViewAssetsClick?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  show,
  onClose,
  currentUser,
  masterUsers = [],
  isDark,
  themeClasses,
  onChangePasswordClick,
  onViewAssetsClick
}) => {
  if (!show || !currentUser) return null;

  // Find detailed master user record
  const masterInfo = masterUsers.find(
    (u: any) => u.id === currentUser.id || u.full_name === currentUser.full_name || u.employee_index === currentUser.employee_index
  ) || currentUser;

  const atasanUser = masterInfo.atasan_id
    ? masterUsers.find((u: any) => u.id === masterInfo.atasan_id)
    : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className={`relative w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white relative overflow-hidden">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xl font-black shadow-inner shrink-0">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black tracking-tight truncate leading-tight">
                  {masterInfo.full_name || currentUser.full_name || currentUser.username}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                    {masterInfo.jabatan || currentUser.role || 'Karyawan'}
                  </span>
                  {masterInfo.employee_index && (
                    <span className="text-xs text-white/90 font-medium">
                      Indeks: <strong className="font-bold text-white">{masterInfo.employee_index}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Departemen</span>
                </div>
                <p className="text-xs font-bold">{masterInfo.department || '-'}</p>
                {masterInfo.sub_department && masterInfo.sub_department !== '-' && (
                  <p className="text-[11px] text-emerald-500 font-semibold mt-0.5">Sub: {masterInfo.sub_department}</p>
                )}
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Hash className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Indeks / NIK</span>
                </div>
                <p className="text-xs font-bold">{masterInfo.employee_index || '-'}</p>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Phone className="w-3.5 h-3.5 text-teal-500" />
                  <span className="text-[10px] font-black uppercase tracking-wider">No. Telepon</span>
                </div>
                <p className="text-xs font-bold">{masterInfo.phone || '-'}</p>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Mail className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Email</span>
                </div>
                <p className="text-xs font-bold truncate">{masterInfo.email || '-'}</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                <Laptop className="w-3.5 h-3.5 text-violet-500" />
                <span className="text-[10px] font-black uppercase tracking-wider">Piranti Utama</span>
              </div>
              <p className="text-xs font-bold text-emerald-500">{masterInfo.jenis_piranti || '(Tidak Ada)'}</p>
              {atasanUser && (
                <div className="mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-700/40 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Atasan Langsung:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{atasanUser.full_name} ({atasanUser.jabatan || 'Atasan'})</span>
                </div>
              )}
            </div>

            {/* Privileges */}
            {(masterInfo.can_request_voucher === 1 || masterInfo.enable_funny_egg === 1) && (
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {masterInfo.can_request_voucher === 1 && (
                  <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[10px] font-bold flex items-center gap-1">
                    <Key className="w-3 h-3" /> Akses Buat Voucher WiFi
                  </span>
                )}
                {masterInfo.enable_funny_egg === 1 && (
                  <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-[10px] font-bold flex items-center gap-1">
                    <Award className="w-3 h-3" /> Fitur Kolom Lari-Lari Active
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className={`p-4 border-t flex items-center gap-2 justify-end ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-100'
          }`}>
            {onViewAssetsClick && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewAssetsClick();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/50 border border-violet-200 dark:border-violet-800 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Laptop className="w-3.5 h-3.5" /> Aset Saya
              </button>
            )}

            {onChangePasswordClick && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onChangePasswordClick();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" /> Ganti Password
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
