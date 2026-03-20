import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Komponen Counter Animasi
 */
export const Counter = ({ value, className }: { value: number, className?: string }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const currentCount = Math.floor(start + (end - start) * easeProgress);
      setDisplayValue(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <motion.span 
      key={value}
      initial={{ scale: 0.8, opacity: 0.5 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      className={`inline-block ${className}`}
    >
      {displayValue}
    </motion.span>
  );
};

/**
 * Komponen Shimmer Loading
 */
export const Shimmer = ({ className }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`}>
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: '100%' }}
      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
    />
  </div>
);

/**
 * Komponen Highlight Text untuk pencarian
 */
export const HighlightText = ({ text, highlight, isDark }: { text: string, highlight: string, isDark: boolean }) => {
  if (!highlight.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className={`${isDark ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-100 text-emerald-900'} px-0.5 rounded`}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

/**
 * Komponen Skeleton Loading untuk Tiket
 */
export const SkeletonTicket: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className={`relative overflow-hidden rounded-2xl p-4 border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100'} shadow-sm`}>
    {/* Shimmer effect overlay */}
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: '100%' }}
      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
    />
    
    <div className="flex items-start gap-4">
      {/* Icon placeholder */}
      <div className={`w-12 h-12 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
      
      <div className="flex-1 space-y-3">
        <div className="flex justify-between items-center">
          {/* Ticket ID placeholder */}
          <div className={`h-4 w-24 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
          {/* Status badge placeholder */}
          <div className={`h-6 w-20 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
        </div>
        
        {/* Name/Subject placeholder */}
        <div className={`h-5 w-3/4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
        
        <div className="flex flex-wrap gap-3 pt-1">
          {/* Metadata placeholders */}
          <div className={`h-4 w-28 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
          <div className={`h-4 w-32 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Komponen Rolling Number
 */
export const RollingNumber: React.FC<{ value: number, className?: string }> = ({ value, className }) => {
  const digits = value.toString().split('');

  return (
    <span className={`inline-flex items-center overflow-hidden ${className}`} style={{ height: '1.5em' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        {digits.map((digit, index) => (
          <span key={index} className="relative inline-flex flex-col h-full overflow-hidden" style={{ width: '0.65em' }}>
            <motion.span
              key={`${index}-${digit}`}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 35,
              }}
              className="flex items-center justify-center w-full h-full"
            >
              {digit}
            </motion.span>
          </span>
        ))}
      </AnimatePresence>
    </span>
  );
};
