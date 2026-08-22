import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

// The version shown in Settings comes from package.json so the two can never
// drift apart. Bump it there only — see AGENTS.md#versioning.
const { version } = JSON.parse(readFileSync('./package.json', 'utf8'))
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// base: './' keeps all asset paths relative so the build works when hosted
// on GitHub Pages under a repo subpath (e.g. username.github.io/repo-name/).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  define: { __APP_VERSION__: JSON.stringify(version) },
})
