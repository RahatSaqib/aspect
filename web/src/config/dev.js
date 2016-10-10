import baseConfig from './base'

let config = {
  appEnv: 'dev',
  aspectApi: 'http://localhost:8080/api',
  sentry: false, //{dsn: 'https://<key>@sentry.io/<app>'}
  piwik: false, // {url: '//analytics.aspect.id', siteId: 1}
  userInactiveMinutes: 15 // time in minutes after user is considered inactive
}

export default Object.freeze(Object.assign({}, baseConfig, config))
