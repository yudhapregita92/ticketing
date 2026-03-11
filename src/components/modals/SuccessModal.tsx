import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface SuccessModalProps {
  show: boolean;
  themeClasses: any;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ show, themeClasses }) => {
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
        <motion.div 
          className="mt-8 h-1 bg-slate-100 rounded-full overflow-hidden"
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
