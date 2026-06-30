import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const chatTarget = env.CHAT_BACKEND_URL || 'http://localhost:8000';

  return {
    plugins: [react()],
    server: {
      port: 3002,
      open: true,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      proxy: {
        '/chat': {
          target: chatTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
            });
          },
        },
        '/health': {
          target: chatTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
            });
          },
        },
        '/feedback': {
          target: chatTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
            });
          },
        },
      },
    },
  };
});
