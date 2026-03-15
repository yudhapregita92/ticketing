import React from 'react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';

interface SplashScreenProps {
  appName: string;
  primaryColor: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ appName, primaryColor }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-slate-950"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.5,
          ease: "easeOut"
        }}
        className="relative mb-8"
      >
        <div 
          className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
          style={{ backgroundColor: primaryColor }}
        >
          <Logo className="text-white w-12 h-12" color="white" />
        </div>
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 2,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-3xl"
          style={{ backgroundColor: primaryColor, filter: 'blur(20px)', zIndex: -1 }}
        />
      </motion.div>

      <div className="text-center">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white mb-2"
        >
          Welcome to
        </motion.h1>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-3xl font-black tracking-tighter"
          style={{ color: primaryColor }}
        >
          {appName}
        </motion.div>
      </div>

      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: 200 }}
        transition={{ delay: 0.8, duration: 1.5, ease: "easeInOut" }}
        className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-12 overflow-hidden"
      >
        <motion.div 
          animate={{ x: [-200, 200] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="h-full w-full"
          style={{ backgroundColor: primaryColor }}
        />
      </motion.div>
    </motion.div>
  );
};
