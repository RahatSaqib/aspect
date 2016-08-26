'use strict';

const allowedEnvs = ['dev', 'dist', 'test'];

function buildConfig(wantedEnv) {
  let isValid = wantedEnv && wantedEnv.length > 0 && allowedEnvs.indexOf(wantedEnv) !== -1;
  let validEnv = isValid ? wantedEnv : 'dev';
  let config = require('./' + validEnv);
  return config;
}

module.exports = buildConfig(process.env.REACT_WEBPACK_ENV);
