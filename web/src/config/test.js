import baseConfig from './base'

let config = {
  appEnv: 'test',
  aspectApi: 'http://localhost:8080/api',
  sentry: false, //{dsn: 'https://<key>@sentry.io/<app>'}
  piwik: false
}

export default Object.freeze(Object.assign(baseConfig, config))
