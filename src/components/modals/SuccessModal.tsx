import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface SuccessModalProps {
  show: boolean;
  themeClasses: any;
  onClose: () => void;
  onViewHistory: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ 
  show, 
  themeClasses, 
  onClose, 
  onViewHistory 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        className={`relative w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl ${themeClasses.card}`}
      >
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
          <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </motion.div>
        </div>
        <h2 className={`text-2xl font-black tracking-tight mb-2 ${themeClasses.text}`}>Tiket Terkirim!</h2>
        <p className={`text-sm font-medium ${themeClasses.textMuted} leading-relaxed`}>
          Laporan Anda telah berhasil masuk ke antrian IT. Tim kami akan segera memprosesnya.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onViewHistory}
            className="w-full py-3.5 bg-emerald-500 text-white rounded-2xl text-sm font-black capitalize tracking-widest shadow-lg shadow-emerald-500/30"
          >
            Lihat Riwayat Tiket
          </motion.button>
          <button
            onClick={onClose}
            className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all ${
              themeClasses.card === 'bg-zinc-900' ? 'text-slate-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Tutup
          </button>
        </div>

        <motion.div 
          className="mt-6 h-1 bg-slate-100/10 rounded-full overflow-hidden flex justify-end"
        >
          <motion.div 
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 3, ease: 'linear' }}
            className="h-full bg-emerald-500"
          />
        </motion.div>
      </motion.div>
    </div>
  );
};
