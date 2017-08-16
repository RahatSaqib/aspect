// TODO do we want to base plugins on Message Queue/event listener?
// TODO allow dynamic loading plugins, or is mapping a matter of provisioning?
const { get } = require('lodash')

const plugins = {
  default: require('./default'),
  malawi: require('./malawi'),
}

/**
 * Loads a plugin by name and action see documentation for 
 * default plugin in ./default.js for available actions
 *
 * Falls back to default plugin if action
 * with name not registered
 *
 */
function* loadPlugin(pluginName, actionName) {
  const action = get(plugins, [pluginName, actionName])
  return action != null ? action : plugins.default[actionName]
}

module.exports = {
  loadPlugin,
}
