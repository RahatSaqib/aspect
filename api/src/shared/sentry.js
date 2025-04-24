const Sentry = require('@sentry/node')
const config = require('../config')
const { version } = require('../../package.json')

function initSentry() {
  if (config.sentry?.dsn && !config.isDevelopment) {
    Sentry.init({
      // The DSN tells Sentry where to send events
      dsn: config.sentry.dsn,

      // Identifies the environment
      environment: config.environment,

      // Performance monitoring sample rate (1.0 = 100%)
      tracesSampleRate: 1,

      // Error messages to ignore
      ignoreErrors: config.sentry.ignoreErrors,

      // Include PII data in error reports
      sendDefaultPii: true,

      // Capture stack traces for all errors
      attachStacktrace: true,

      // Object traversal depth for error context
      normalizeDepth: 3,

      // Backend-specific settings
      enableTracing: true,

      // Automatically instrument Node.js libraries
      autoDiscoverNodePerformanceMonitoringIntegrations: true,

      // Debug mode to see what's happening. if found any issues with sentry integration, set to true and find more details.
      debug: false,

      integrations: [
        new Sentry.Integrations.OnUncaughtException(),
        new Sentry.Integrations.OnUnhandledRejection(),
        new Sentry.Integrations.Hapi(),
        new Sentry.Integrations.Http(),
        new Sentry.Integrations.Mysql(),
      ],
    })

    Sentry.setTags({
      // Environment and deployment info
      environment: config.environment,
      countryName: config.countryName,
      version,
      nodeEnv: process.env.NODE_ENV,

      gxAlertApi: config.gxAlertApi,

      // Server info
      host: config.host,
      port: config.port,

      isDevelopment: config.isDevelopment,
      hasNewRelic: config.newRelic?.enabled,

      hasDbConfig: !!config.db,
      dbConnectionLimit: config.db?.connectionLimit,

      // Logging config
      logLevel: config.log?.logLevel,
      sentryLogLevel: config.sentry?.logLevel,
    })
  }
}

module.exports = {
  Sentry,
  initSentry,
}
