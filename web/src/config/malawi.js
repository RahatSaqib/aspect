import baseConfig from './base'

let config = {
  appEnv: 'dist',
  aspectApi: 'http://malawiapi.aspect.id/api',
  sentry: false, //{dsn: 'https://<key>@sentry.io/<app>'}
  piwik: {
    url: '//analytics.aspect.id',
    siteId: 1
  },
  userInactiveMinutes: 15, // time in minutes after user is considered inactive
  supportTelephone: '+1 555-123-4567',
  supportEmail: 'support@gxalert.com'
}

export default Object.freeze(Object.assign({}, baseConfig, config))
