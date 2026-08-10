const fs = require('fs')
const path = require('path')
const { get } = require('lodash')
const { basePlugin } = require('./plugins/basePlugin')

const PLUGINS_DIR = path.join(__dirname, 'plugins')
const BASE_PLUGIN_FILE = 'basePlugin.js'

/**
 * There are two types of plugins: partner plugins and device type plugins
 * All the plugins can override the methods of the basePlugin
 *
 * Plugins are discovered from ./plugins by convention: `<name>Plugin.js` must export
 * `{ <name>Plugin }`, and is registered under `<name>` - the value stored in
 * `Partner.plugin` for partner plugins, or the device type name for device type ones.
 *
 * Discovery is by directory scan rather than a hardcoded map so that adding or removing
 * a plugin is just adding or removing a file, with no shared registry to keep in sync.
 */
function loadPlugins() {
  return fs
    .readdirSync(PLUGINS_DIR)
    .filter(file => file.endsWith('Plugin.js') && file !== BASE_PLUGIN_FILE)
    .reduce((registry, file) => {
      const name = file.slice(0, -'Plugin.js'.length)
      // eslint-disable-next-line import/no-dynamic-require
      const exported = require(path.join(PLUGINS_DIR, file))[`${name}Plugin`]
      if (exported) {
        registry[name] = exported
      }
      return registry
    }, {})
}

const plugins = loadPlugins()

/**
 * Loads a plugin by name and action see documentation for
 * default plugin in ./plugin/basePlugin.js for available actions
 *
 * The partner plugin action takes the highest priority, followed by the device type plugin;
 * otherwise, the basePlugin's method is executed
 *
 */
async function loadPlugin(partnerPluginName, deviceTypePluginName, actionName) {
  const partnerPluginAction = get(plugins, [partnerPluginName, actionName])
  if (partnerPluginAction) {
    return partnerPluginAction
  }

  const deviceTypePluginAction = get(plugins, [deviceTypePluginName, actionName])
  if (deviceTypePluginAction) {
    return deviceTypePluginAction
  }

  return basePlugin[actionName]
}

module.exports = {
  loadPlugin,
}
