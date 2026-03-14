import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RollingNumberProps {
  value: number;
  className?: string;
}

export const RollingNumber: React.FC<RollingNumberProps> = ({ value, className }) => {
  const digits = value.toString().split('');

  return (
    <span className={`inline-flex items-center overflow-hidden ${className}`} style={{ height: '1.5em' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        {digits.map((digit, index) => (
          <span key={digits.length - index} className="relative inline-flex flex-col h-full overflow-hidden" style={{ width: '0.65em' }}>
            <motion.span
              key={digit}
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
