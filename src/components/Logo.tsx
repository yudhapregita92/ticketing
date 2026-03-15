import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  className?: string;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-6 h-6", color = "currentColor" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Paper Plane Body */}
      <path 
        d="M90 10L10 50L45 55L50 90L90 10Z" 
        fill={color} 
        fillOpacity="0.1"
        stroke={color} 
        strokeWidth="4" 
        strokeLinejoin="round"
      />
      <path 
        d="M90 10L45 55" 
        stroke={color} 
        strokeWidth="4" 
        strokeLinecap="round"
      />
      
      {/* Circuit Nodes & Lines - Concept 3: Paper Plane Solution */}
      <motion.path 
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
        d="M70 25L80 15" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <motion.circle 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        cx="80" cy="15" r="3" 
        fill={color} 
      />
      
      <motion.path 
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.3, repeat: Infinity, repeatType: "reverse" }}
        d="M55 40L65 30" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <motion.circle 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        cx="65" cy="30" r="3" 
        fill={color} 
      />
      
      <motion.path 
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.6, repeat: Infinity, repeatType: "reverse" }}
        d="M40 55L50 45" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <motion.circle 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.1, duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        cx="50" cy="45" r="3" 
        fill={color} 
      />

      {/* Tech Accents */}
      <rect x="75" y="45" width="10" height="2" rx="1" fill={color} opacity="0.4" />
      <rect x="65" y="55" width="15" height="2" rx="1" fill={color} opacity="0.2" />
    </svg>
  );
};
