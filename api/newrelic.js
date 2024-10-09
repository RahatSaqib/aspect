const config = require('./config')
const pkgJSON = require('./package.json')

exports.config = {
  app_name: config.newRelic.appName,
  license_key: config.newRelic.appName,
  agent_enabled: config.newRelic.enabled,
  labels: `appVersion: ${pkgJSON.version}; appName: ${pkgJSON.name}; countryName: ${config.countryName}; environment: ${config.environment}`,
}
