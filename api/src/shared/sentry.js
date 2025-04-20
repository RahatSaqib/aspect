const Sentry = require('@sentry/node')
const config = require('../config')

function initSentry() {
  if (config.sentry?.dsn && !config.isDevelopment) {
    Sentry.init({
      // The DSN tells Sentry where to send events
      dsn: config.sentry.dsn,

      // Identifies the environment
      environment: config.environment,

      // Performance monitoring sample rate (1.0 = 100%)
      tracesSampleRate: 1.0,

      // Error messages to ignore
      ignoreErrors: config.sentry.ignoreErrors,

      // Include PII data in error reports
      sendDefaultPii: true,

      // Capture stack traces for all errors
      attachStacktrace: true,

      // Object traversal depth for error context
      normalizeDepth: 3,

      // Backend-specific settings
      serverName: config.countryName,
      enableTracing: true,

      // Automatically instrument Node.js libraries
      autoDiscoverNodePerformanceMonitoringIntegrations: true,
    })
  }
}

module.exports = {
  Sentry,
  initSentry,
}
