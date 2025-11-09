import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: ['dream-weaver-ai.onrender.com'],
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
  },
});
