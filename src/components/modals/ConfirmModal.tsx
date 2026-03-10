import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  Trash2, 
  RefreshCcw, 
  X,
  CheckCircle2
} from 'lucide-react';

interface ConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  isDark: boolean;
  themeClasses: any;
  loading?: boolean;
  type?: 'danger' | 'warning' | 'success';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  isDark,
  themeClasses,
  loading = false,
  type = 'danger'
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={`relative w-full max-w-md rounded-3xl shadow-2xl border overflow-hidden ${themeClasses.card}`}
      >
        <div className="p-8 sm:p-10 text-center">
          <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl ${
            type === 'danger' ? 'bg-rose-500 shadow-rose-500/20' : 
            type === 'success' ? 'bg-emerald-500 shadow-emerald-500/20' :
            'bg-amber-500 shadow-amber-500/20'
          }`}>
            {type === 'success' ? (
              <CheckCircle2 className="text-white w-10 h-10 sm:w-12 h-12" />
            ) : (
              <AlertTriangle className="text-white w-10 h-10 sm:w-12 h-12" />
            )}
          </div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight mb-3 ${themeClasses.text}`}>{title}</h2>
          <p className={`text-sm sm:text-base font-medium leading-relaxed mb-8 ${themeClasses.textMuted}`}>{message}</p>
          
          <div className="flex flex-col gap-3">
            <button 
              disabled={loading}
              onClick={onConfirm}
              className={`w-full text-white font-black py-4 rounded-2xl text-sm sm:text-base shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 ${
                type === 'danger' ? 'bg-rose-500 hover:bg-rose-600' : 
                type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' :
                'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              {loading ? (
                <RefreshCcw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {type === 'danger' ? <Trash2 className="w-5 h-5" /> : 
                   type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                   <RefreshCcw className="w-5 h-5" />}
                  {confirmText}
                </>
              )}
            </button>
            <button 
              disabled={loading}
              onClick={onClose}
              className={`w-full font-bold py-3 text-xs sm:text-sm transition-all uppercase tracking-widest ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Batal
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
