const Sentry = require('@sentry/node')
const config = require('../config')

function initSentry() {
  if (config.sentry?.dsn && !config.isDevelopment) {
    Sentry.init({
      // The DSN tells Sentry where to send events. It's like an API endpoint specific to your Sentry project
      dsn: config.sentry.dsn,

      // Identifies the environment (production, staging, etc.) to help separate events
      environment: config.environment,

      // Sets what percentage of transactions to capture for performance monitoring
      // 1.0 means capture 100% of transactions (useful in production for full visibility)
      tracesSampleRate: 1.0,

      // Array of error messages to ignore/not send to Sentry
      // Useful for filtering out known non-critical errors
      ignoreErrors: config.sentry.ignoreErrors,

      // When true, Sentry will include potentially sensitive data like IPs, cookies, etc.
      // Useful for better error context but must comply with privacy requirements
      sendDefaultPii: true,

      // When true, Sentry will automatically capture the stack trace for all errors
      // This provides more context about where errors occurred
      attachStacktrace: true,

      // Controls how deep Sentry will traverse nested objects when capturing data
      // Higher values provide more context but increase payload size
      normalizeDepth: 2,

      // Backend-specific settings
      serverName: config.countryName, // Identifies which server instance sent the event
      enableTracing: true, // Enables performance monitoring for backend requests

      // Automatically instruments common backend libraries
      autoDiscoverNodePerformanceMonitoringIntegrations: true,

      // Optional: Custom sampling for different types of transactions
      // Useful for high-traffic APIs
      profilesSampleRate: 0.1,
    })
  }
}

module.exports = {
  Sentry,
  initSentry,
}
