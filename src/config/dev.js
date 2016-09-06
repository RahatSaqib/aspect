import baseConfig from './base'

let config = {
  appEnv: 'dev',
  aspectApi: 'http://localhost:8080/api',
  sentry: false //{dsn: 'https://<key>@sentry.io/<app>'}
}

export default Object.freeze(Object.assign({}, baseConfig, config))
