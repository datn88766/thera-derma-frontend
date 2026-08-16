import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

const blogSrc = path.resolve(__dirname, './blog-frontend/src');
const appSrc = path.resolve(__dirname, './src');

function resolveWithExtensions(basePath) {
  const extensions = ['.jsx', '.js', '.tsx', '.ts', '.json'];
  for (const ext of extensions) {
    const file = basePath + ext;
    if (fs.existsSync(file)) return file;
  }
  for (const ext of extensions) {
    const file = path.join(basePath, 'index' + ext);
    if (fs.existsSync(file)) return file;
  }
  return basePath;
}

/** Resolve @/ to blog-frontend/src when imported from blog-frontend files */
function blogDualAliasPlugin() {
  return {
    name: 'blog-dual-alias',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!source.startsWith('@/')) return null;
      const subPath = source.slice(2);
      const fromBlog =
        importer &&
        (importer.includes('blog-frontend') ||
          importer.replace(/\\/g, '/').includes('/blog-frontend/'));
      const base = fromBlog ? blogSrc : appSrc;
      return resolveWithExtensions(path.join(base, subPath));
    },
  };
}

export default defineConfig({
  logLevel: 'error',
  resolve: {
    alias: {
      '@blog': blogSrc,
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  plugins: [blogDualAliasPlugin(), react()],
});
