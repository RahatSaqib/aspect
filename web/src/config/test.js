import baseConfig from './base'

let config = {
  appEnv: 'test',
  aspectApi: 'http://localhost:8080/api',
  sentry: false, //{dsn: 'https://<key>@sentry.io/<app>'}
  piwik: false,
  userInactiveMinutes: 15 // time in minutes after user is considered inactive
}

export default Object.freeze(Object.assign(baseConfig, config))
