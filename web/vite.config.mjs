import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import compression from 'vite-plugin-compression'

// Inlined into the client bundle, so the keys are listed explicitly instead of
// spreading everything loadEnv() reads out of the ambient environment.
const appEnvKeys = [
  'aspectApi',
  'defaultCulture',
  'googleAnalyticsMeasurementId',
  'sentry.dsn',
  'sentry.tracesSampleRate',
  'sentry.tracingOrigins',
  'supportEmail',
  'userInactiveMinutes',
]

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), compression({ algorithm: 'gzip', ext: '.gz', threshold: 10240, filter: /\.(js|css)$/ })],
    define: {
      __APP_ENV__: JSON.stringify(appEnvKeys.reduce((acc, key) => ({ ...acc, [key]: env[key] }), {})),
    },
    server: {
      port: 8000,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      manifest: 'manifest.json',
      // matches the old url-loader limit so the same small assets stay inlined
      assetsInlineLimit: 8192,
    },
  }
})
