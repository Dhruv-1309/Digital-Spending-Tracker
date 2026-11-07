import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    process.env.ANALYZE === 'true' &&
      visualizer({
        filename: '../../docs/bundle-stats.html',
        title: 'MoneyTracker Production Bundle Visualizer',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
        open: false,
      }),
  ].filter(Boolean) as any,
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('chart.js')) {
              return 'vendor-charts';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('motion')) {
              return 'vendor-motion';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    server: {
      deps: {
        inline: ['motion', 'framer-motion'],
      },
    },
  },
})
