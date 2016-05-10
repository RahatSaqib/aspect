'use strict';

import baseConfig from './base';

let config = {
  appEnv: 'dist',
  aspectApi: 'http://localhost:8080/api'
};

export default Object.freeze(Object.assign({}, baseConfig, config));
