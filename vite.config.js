import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    'process.env': {},
    'process.platform': JSON.stringify('browser'),
    'process.version': JSON.stringify(''),
    global: 'window'
  }
});
