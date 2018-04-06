import baseConfig from './base'

const hostname = window && window.location && window.location.hostname

let aspectApi = 'https://dev.aspect.id/api/api'
let piwikSiteId = 1

if (hostname === 'malawi.aspect.id') {
  aspectApi = 'https://malawi.aspect.id/api/api'
  piwikSiteId = 2
} else if (hostname === 'myanmar.aspect.id') {
  aspectApi = 'https://myanmar.aspect.id/api/api'
  piwikSiteId = 3
}

const config = {
  appEnv: 'dist',
  aspectApi,
  sentry: false, // {dsn: 'https://<key>@sentry.io/<app>'}
  piwik: {
    url: '//analytics.aspect.id',
    siteId: piwikSiteId,
  },
  userInactiveMinutes: 15, // time in minutes after user is considered inactive
  supportTelephone: '+1 555-123-4567',
  supportEmail: 'support@gxalert.com',
}

export default Object.freeze(Object.assign({}, baseConfig, config))
