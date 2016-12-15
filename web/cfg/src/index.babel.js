import invariant from 'invariant'
// List of allowed environments
const allowedEnvs = ['dev', 'dist'];

/**
 * Build the webpack configuration
 * @param  {String} wantedEnv The wanted environment
 * @return {Object} Webpack config
 */
function buildConfig(wantedEnv = process.env.ASPECT_ENV) {
  const isValid = wantedEnv && wantedEnv.length > 0 && allowedEnvs.indexOf(wantedEnv) !== -1;
  invariant(isValid, `You should set ASPECT_ENV correctly. Allowed values are: ${allowedEnvs.join(', ')}`)
  return require(`./${wantedEnv}`).default;
}

export default buildConfig();
