import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Security headers plugin
    {
      name: 'security-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Content Security Policy — prevent XSS
          res.setHeader(
            'Content-Security-Policy',
            [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'", // unsafe-inline needed for Vite HMR in dev
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "connect-src 'self' ws: wss:", // Vite HMR websocket
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          );

          // Prevent clickjacking
          res.setHeader('X-Frame-Options', 'DENY');

          // Prevent MIME sniffing
          res.setHeader('X-Content-Type-Options', 'nosniff');

          // Referrer policy — don't leak referrer to third parties
          res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

          // Permissions policy — disable unused browser features
          res.setHeader(
            'Permissions-Policy',
            'geolocation=(), microphone=(), camera=(), payment=()'
          );

          // HSTS — instruct browsers to use HTTPS only (production)
          if (process.env.NODE_ENV === 'production') {
            res.setHeader(
              'Strict-Transport-Security',
              'max-age=63072000; includeSubDomains; preload'
            );
          }

          // Remove server fingerprint
          res.removeHeader('X-Powered-By');

          next();
        });
      },
      // Apply same headers to preview server
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          res.setHeader('X-Frame-Options', 'DENY');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
          res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
          res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
          next();
        });
      },
    },
  ],

  build: {
    // Remove console.log statements in production
    minify: 'esbuild',
    sourcemap: false, // Never expose sourcemaps in production
    rollupOptions: {
      output: {
        // Content-based hashing for cache busting
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          store: ['zustand'],
          security: ['bcryptjs', 'zod', 'dompurify'],
          ui: ['lucide-react', 'react-hot-toast'],
        },
      },
    },
  },

  // Strip console in production
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },

  server: {
    port: 5173,
    strictPort: false,
    cors: false, // No CORS needed in dev SPA
  },
});
