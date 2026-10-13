import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative paths, so the app works from any folder (e.g. GitHub Pages)
  base: './',
  // The model runs in a module worker that imports WebLLM
  worker: { format: 'es' },
  plugins: [react()],
})
