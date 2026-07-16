import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // react-router-dom's package.json "node" export condition points at a
      // CJS build that assumes real CJS globals (module/require). Vite's
      // ESM-based dev SSR module runner doesn't provide those, so point
      // straight at the ESM build instead. Only affects this one package —
      // a global SSR resolve-condition override broke unrelated deps
      // (fontawesome) that rely on the default "node" condition.
      'react-router-dom': path.resolve(__dirname, 'node_modules/react-router-dom/dist/index.mjs'),
    },
  },
  ssr: {
    // These packages import their own package.json for version info. Left
    // external, Vite's SSR module runner hands that off to Node's native ESM
    // loader, which rejects JSON imports without an import attribute. Vite's
    // own transform pipeline (used when not externalized) handles it fine.
    noExternal: [
      '@fortawesome/fontawesome-svg-core',
      '@fortawesome/react-fontawesome',
      '@fortawesome/free-solid-svg-icons',
      // Externalized, Node's CJS/ESM interop loses the default export and
      // `Slider` resolves to the whole module namespace object instead of
      // the component function — Vite's own transform handles it correctly.
      'react-slick',
    ],
  },
})
