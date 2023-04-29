import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { checker } from 'vite-plugin-checker';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  console.log(mode);
  if (mode === 'development') {
    return { plugins: [react(), checker({ eslint: { lintCommand: 'eslint . --ext .ts,.tsx' } })] };
  } else if (mode === 'production') {
    return { plugins: [react()] };
  } else {
    return {};
  }
});
