// TODO allow dynamic loading plugins, or is mapping a matter of provisioning?
const { get } = require('lodash')

const plugins = {
  default: require('./default'),
  malawi: require('./malawi'),
}

/**
 * Loads a plugin by name and action
 *
 * Falls back to default plugin if action
 * with name not registered
 *
 * actions include:
 *
 * transformResultPayload(context) => newPayload
 * A new result is received, transform result payload to new payload
 * to process in format expected by Device API.
 *
 */
function* loadPlugin(pluginName, actionName) {
  const action = get(plugins, [pluginName, actionName])
  return action != null ? action : plugins.default[actionName]
}

module.exports = {
  loadPlugin,
}
