import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/pharma/', // konieczne dla GitHub Pages
  server: {
    port: 5173, // domyślny port Vite, możesz zmienić
    open: true   // automatycznie otwiera przeglądarkę
  },
  build: {
    outDir: 'dist', // folder produkcyjny, gh-pages go używa
    sourcemap: false
  },
  resolve: {
    alias: {
      '@': '/src' // jeśli używasz aliasu do src
    }
  }
});
