import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// base: './' keeps all asset paths relative so the build works when hosted
// on GitHub Pages under a repo subpath (e.g. username.github.io/repo-name/).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
