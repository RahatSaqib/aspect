import baseConfig from './base'

const aspectApi = 'https://dev.aspect.id/api/api'
const siteId = 1

const config = {
  appEnv: 'dist',
  aspectApi,
  country: 'production',
  sentry: {
    dsn: 'https://6fdaf6e504b6479782895c8703580006@o944950.ingest.sentry.io/5893495',
    tracingOrigins: ['localhost:8000', '*.aspect.id'],
    tracesSampleRate: 1.0,
  },
  piwik: {
    url: '//analytics.aspect.id',
    siteId,
  },
  userInactiveMinutes: 15, // time in minutes after user is considered inactive
  supportTelephone: '+1 555-123-4567',
  supportEmail: 'support@gxalert.com',
}

export default Object.freeze({ ...baseConfig, ...config })
