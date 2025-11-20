import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // API Key wpisany na stałe zgodnie z prośbą
      'process.env.API_KEY': JSON.stringify("AIzaSyBfDIZfFffpfl2A4Y7C-pVuD_OMpbpmrwE")
    }
  };
});