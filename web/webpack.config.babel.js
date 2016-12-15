import path from 'path'

// List of allowed environments
const allowedEnvs = ['dev', 'dist'];

/**
 * Build the webpack configuration
 * @param  {String} wantedEnv The wanted environment
 * @return {Object} Webpack config
 */
function buildConfig(wantedEnv) {
  const isValid = wantedEnv && wantedEnv.length > 0 && allowedEnvs.indexOf(wantedEnv) !== -1;
  const validEnv = isValid ? wantedEnv : 'dev';
  const config = require(path.join(__dirname, 'cfg', validEnv)).default;
  return config;
}

export default buildConfig(process.env.ASPECT_ENV);
