import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third parameter '' ensures we load all variables, not just VITE_ ones.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Securely expose ONLY the API_KEY to the client-side code
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Polyfill process.env to avoid reference errors for other libraries
      'process.env': {} 
    }
  };
});