const { get } = require('lodash')
const { basePlugin } = require('./plugins/basePlugin')
const { commcarePlugin } = require('./plugins/commcarePlugin')
const { malawiPlugin } = require('./plugins/malawiPlugin')
const { gxconnectPlugin } = require('./plugins/gxconnectPlugin')
const { gxalertPlugin } = require('./plugins/gxalertPlugin')
const { myanmarPlugin } = require('./plugins/myanmarPlugin')
const { alereftpconnectorPlugin } = require('./plugins/alereftpconnectorPlugin')
const { saNhlsPlugin } = require('./plugins/saNhlsPlugin')
const { cameroonPlugin } = require('./plugins/cameroonPlugin')
const { aspectresultentryPlugin } = require('./plugins/aspectresultentryPlugin')
const { lesothoTbPlugin } = require('./plugins/lesothoTbPlugin')
const { philippinesPlugin } = require('./plugins/philippinesPlugin')
const { pakistanPlugin } = require('./plugins/pakistanPlugin')

/**
 * There are two types of plugins: partner plugins and device type plugins
 */
const plugins = {
  commcare: commcarePlugin,
  malawi: malawiPlugin,
  gxconnect: gxconnectPlugin,
  gxalert: gxalertPlugin,
  myanmar: myanmarPlugin,
  alereftpconnector: alereftpconnectorPlugin,
  saNhls: saNhlsPlugin,
  cameroon: cameroonPlugin,
  aspectresultentry: aspectresultentryPlugin,
  lesothoTb: lesothoTbPlugin,
  philippines: philippinesPlugin,
  pakistan: pakistanPlugin,
}

/**
 * Loads a plugin by name and action see documentation for
 * default plugin in ./default.js for available actions
 *
 * The action of the partnerPlugin have the highest priority
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
