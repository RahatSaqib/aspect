'use strict'

import baseConfig from './base'

let config = {
  appEnv: 'dist',
  aspectApi: 'http://aspect-api-dev.us-east-1.elasticbeanstalk.com/api'
}

export default Object.freeze(Object.assign({}, baseConfig, config))
