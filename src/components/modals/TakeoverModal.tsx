import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, UserPlus, ChevronRight } from 'lucide-react';

interface TakeoverModalProps {
  showTakeoverConfirm: any;
  setShowTakeoverConfirm: (val: any) => void;
  isDark: boolean;
  users: any[];
  executeIntervention: (id: number, type: 'takeover' | 'reassign', targetUser?: string) => void;
}

export const TakeoverModal: React.FC<TakeoverModalProps> = ({
  showTakeoverConfirm,
  setShowTakeoverConfirm,
  isDark,
  users,
  executeIntervention
}) => {
  if (!showTakeoverConfirm) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowTakeoverConfirm(null)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'}`}
      >
        <div className="p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-4 shadow-xl ${
              showTakeoverConfirm.type === 'takeover' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {showTakeoverConfirm.type === 'takeover' ? <ShieldAlert className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
            </div>
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {showTakeoverConfirm.type === 'takeover' ? 'Konfirmasi Ambil Alih' : 'Pindahkan Tiket'}
            </h2>
            <p className={`text-sm mt-2 font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              {showTakeoverConfirm.type === 'takeover' 
                ? 'Apakah Anda yakin ingin mengambil alih tiket ini? Tindakan ini akan tercatat dalam riwayat tiket.'
                : showTakeoverConfirm.targetUser 
                  ? `Apakah Anda yakin ingin menugaskan tiket ini kepada ${showTakeoverConfirm.targetUser}?`
                  : 'Pilih IT yang akan menangani tiket ini:'}
            </p>
          </div>

          {showTakeoverConfirm.type === 'reassign' && !showTakeoverConfirm.targetUser && (
            <div className="grid grid-cols-1 gap-2 mb-8 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => setShowTakeoverConfirm({ ...showTakeoverConfirm, targetUser: u.username })}
                  className={`w-full py-3 px-4 rounded-xl border font-bold text-sm transition-all flex items-center justify-between group ${
                    isDark 
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-blue-500 hover:text-blue-400' 
                    : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-blue-500 hover:text-blue-600'
                  }`}
                >
                  <span>{u.full_name || u.username}</span>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}

          {(showTakeoverConfirm.type === 'takeover' || showTakeoverConfirm.targetUser) && (
            <div className="flex gap-3">
              <button 
                onClick={() => setShowTakeoverConfirm(null)}
                className={`flex-1 py-4 font-black text-xs capitalize tracking-widest rounded-2xl transition-all ${
                  isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-750' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Batal
              </button>
              <button 
                onClick={() => executeIntervention(showTakeoverConfirm.id, showTakeoverConfirm.type, showTakeoverConfirm.targetUser)}
                className={`flex-1 py-4 text-white font-black text-xs capitalize tracking-widest rounded-2xl shadow-lg transition-all active:scale-[0.98] ${
                  showTakeoverConfirm.type === 'takeover' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-900/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20'
                }`}
              >
                Ya, Lanjutkan
              </button>
            </div>
          )}
          
          {showTakeoverConfirm.type === 'reassign' && !showTakeoverConfirm.targetUser && (
            <button 
              onClick={() => setShowTakeoverConfirm(null)}
              className={`w-full py-4 font-black text-xs capitalize tracking-widest rounded-2xl transition-all ${
                isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-750' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Batal
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
