import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'markdown-katex': ['react-markdown', 'remark-math', 'rehype-katex', 'katex'],
          'syntax-highlighter': ['react-syntax-highlighter'],
          'realtime': ['socket.io-client'],
        },
      },
    },
  },
});
