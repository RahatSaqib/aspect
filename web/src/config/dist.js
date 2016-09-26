import baseConfig from './base'

let config = {
  appEnv: 'dist',
  aspectApi: 'http://devapi.aspect.id/api',
  sentry: false //{dsn: 'https://<key>@sentry.io/<app>'}
}

export default Object.freeze(Object.assign({}, baseConfig, config))
