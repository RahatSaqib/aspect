const config = require('./src/config') // This should loaded before the newrelic package is called.

let newrelic = null
if (config.newRelic.enabled) {
  newrelic = require('newrelic')
}
const pkgJSON = require('./package.json')

// Properties and their intended functionality is documented [here](https://docs.newrelic.com/docs/apm/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration/)
exports.config = {
  app_name: config.newRelic.appName,
  license_key: config.newRelic.licenceKey,
  agent_enabled: config.newRelic.enabled,
  // TODO:: Check why the labels/tags are not appearing on the Dashboard UI
  labels: {
    appVersion: pkgJSON.version,
    appName: pkgJSON.name,
    countryName: config.countryName,
    environment: config.environment,
  },
}