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
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Mengizinkan akses dari domain kustom dan ngrok
      allowedHosts: [
        'intromissible-stingily-verla.ngrok-free.dev',
        'www.itk3dk.my.id',
        'itk3dk.my.id'
      ],
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Menjaga stabilitas saat editing otomatis oleh agent.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});