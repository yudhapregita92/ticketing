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
          <mark key={`hl-${i}-${part.slice(0, 8)}`} className={`${isDark ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-100 text-emerald-900'} px-0.5 rounded`}>
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

/**
 * Komponen Button Reusable (Pill / Rounded Style ~14px-16px)
 * Digunakan secara konsisten di seluruh Halaman Admin
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'outline' | 'ghost' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none border rounded-[var(--admin-btn-radius,14px)]";
  
  const variantStyles = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-md shadow-blue-500/20 active:bg-blue-800",
    secondary: "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-200/80 dark:border-slate-700/80",
    danger: "bg-rose-600 hover:bg-rose-700 text-white border-transparent shadow-md shadow-rose-500/20 active:bg-rose-800",
    warning: "bg-amber-500 hover:bg-amber-600 text-white border-transparent shadow-md shadow-amber-500/20",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-md shadow-emerald-500/20",
    outline: "bg-transparent hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-transparent"
  };

  const sizeStyles = {
    xs: "text-xs px-2.5 py-1 gap-1.5 h-7",
    sm: "text-xs px-3.5 py-1.5 gap-2 h-8",
    md: "text-sm px-4 py-2 gap-2 h-10",
    lg: "text-base px-5 py-2.5 gap-2.5 h-12",
    icon: "p-2 h-9 w-9 justify-center"
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

