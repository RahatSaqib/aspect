import baseConfig from './base'

const aspectApi = 'https://dev.aspect.id/api/api'
const siteId = 1

const config = {
  appEnv: 'dist',
  aspectApi,
  sentry: false, // {dsn: 'https://<key>@sentry.io/<app>'}
  piwik: {
    url: '//analytics.aspect.id',
    siteId,
  },
  userInactiveMinutes: 15, // time in minutes after user is considered inactive
  supportTelephone: '+1 555-123-4567',
  supportEmail: 'support@gxalert.com',
}

export default Object.freeze(Object.assign({}, baseConfig, config))
