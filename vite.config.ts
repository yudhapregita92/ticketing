import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    build: { 
      outDir: "dist", 
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@vladmandic/face-api')) {
                return 'vendor-faceapi';
              }
              if (id.includes('xlsx')) {
                return 'vendor-xlsx';
              }
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-recharts';
              }
              if (id.includes('framer-motion') || id.includes('motion')) {
                return 'vendor-motion';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-lucide';
              }
              if (id.includes('html5-qrcode') || id.includes('react-barcode')) {
                return 'vendor-scanner';
              }
            }
          }
        }
      }
    },
    server: {
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});