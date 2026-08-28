import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Allow tunneled/sandboxed preview hosts (e.g. *.e2b.app) so the dev server
      // does not answer with 403 "Blocked request. This host is not allowed".
      allowedHosts: ['.e2b.app'],
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          // Split heavy, rarely-changing vendors out of the entry chunk so the
          // first paint only downloads what the shell actually needs.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('highlight.js')) return 'vendor-highlight';
            if (id.includes('chart.js')) return 'vendor-chart';
            if (id.includes('jszip') || id.includes('file-saver')) return 'vendor-archive';
            if (id.includes('dexie')) return 'vendor-dexie';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('@google/genai')) return 'vendor-genai';
            return 'vendor';
          },
        },
      },
    },
  };
});
