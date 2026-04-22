import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json'

const buildStampParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}).formatToParts(new Date())

const buildStampDate = buildStampParts
  .filter((p) => p.type === 'year' || p.type === 'month' || p.type === 'day')
  .map((p) => p.value)
  .join('-')

const buildStampTime = buildStampParts
  .filter((p) => p.type === 'hour' || p.type === 'minute')
  .map((p) => p.value)
  .join(':')

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version || '0.0.0'),
    __APP_BUILD_STAMP__: JSON.stringify(`${buildStampDate} ${buildStampTime} COT`),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('/firebase/')) return 'firebase'
          if (id.includes('/lucide-react/')) return 'icons'
          if (id.includes('/react-dom/')) return 'react-dom'
          if (id.includes('/react/')) return 'react'
          return 'vendor'
        },
      },
    },
  },
})
