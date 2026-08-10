import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import compression from 'vite-plugin-compression'
import { defineConfig } from 'vitest/config'

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
  // vitest runs with mode "test"; fast refresh injects a preamble that only the dev server serves
  const isTest = mode === 'test'

  return {
    plugins: [
      react({ fastRefresh: !isTest }),
      compression({ algorithm: 'gzip', ext: '.gz', threshold: 10240, filter: /\.(js|css)$/ }),
    ],
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
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: [
        './src/__setup__/mockDate.js',
        './src/__setup__/mockFetch.js',
        './src/__setup__/mockGoogle.js',
        './src/__setup__/mockI18n.js',
        './src/__setup__/testingLibrary.js',
      ],
      include: ['src/**/*.test.{js,jsx}'],
      // identity-obj-proxy used to hand the tests the raw class name
      css: { modules: { classNameStrategy: 'non-scoped' } },
      coverage: {
        provider: 'v8',
        reportsDirectory: 'coverage',
        exclude: [
          'src/config.js',
          'src/__setup__/**',
          'src/utils/**',
          'src/messages/**',
          'src/providers/I18nProvider/date-fns-locales/**',
        ],
      },
    },
  }
})
