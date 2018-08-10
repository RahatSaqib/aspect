const { get } = require('lodash')
const Boom = require('boom')

const postProcessMergeResult = require('./postProcessMergeResult')

const plugins = {
  default: {
    transformInitialPayload,
    getDeviceSeenOn,
    getDevicePingOn,
    preProcessCreateDevice,
    transformNewDevicePayload,
    preProcessAddDeviceData,
    preProcessUpdateDeviceConfiguration,
    postProcessUpdateDeviceConfiguration,
    postProcessAddDeviceOperation,
    preProcessUpdateSite,
    postProcessUpdateSite,
    preProcessGetResult,
    postProcessGetResult,
    preProcessMergeResult,
    transformMergeResultPayload,
    postProcessMergeResult,
    onResultLogged,
  },
  commcare: {
    transformInitialPayload: require('./commcare/transformInitialPayload'),
  },
  malawi: {
    transformNewDevicePayload: require('./malawi/transformNewDevicePayload'),
    preProcessGetResult: require('./malawi/preProcessGetResult'),
    postProcessMergeResult: require('./malawi/postProcessMergeResult'),
    postProcessUpdateSite: require('./malawi/postProcessUpdateSite'),
    onResultLogged: require('./malawi/onResultLogged'),
  },
  gxconnect: {
    preProcessCreateDevice: require('./genexpert/gxconnect_plugin/preProcessCreateDevice'),
    preProcessAddDeviceData: require('./genexpert/preProcessAddDeviceData'),
    postProcessUpdateDeviceConfiguration: require('./genexpert/postProcessUpdateDeviceConfiguration'),
    postProcessAddDeviceOperation: require('./genexpert/postProcessAddDeviceOperation'),
    transformMergeResultPayload: require('./genexpert/transformMergeResultPayload'),
    preProcessMergeResult: require('./genexpert/preProcessMergeResult'),
  },
  gxalert: {
    getDeviceSeenOn: require('./genexpert/gxalert_plugin/getDeviceSeenOn'),
    getDevicePingOn: require('./genexpert/gxalert_plugin/getDevicePingOn'),
    preProcessAddDeviceData: require('./genexpert/gxalert_plugin/preProcessAddDeviceData'),
    preProcessUpdateDeviceConfiguration: require('./genexpert/gxalert_plugin/preProcessUpdateDeviceConfiguration'),
    postProcessUpdateDeviceConfiguration: require('./genexpert/gxalert_plugin/postProcessUpdateDeviceConfiguration'),
    postProcessAddDeviceOperation: require('./genexpert/gxalert_plugin/postProcessAddDeviceOperation'),
    transformMergeResultPayload: require('./genexpert/transformMergeResultPayload'),
    preProcessMergeResult: require('./genexpert/preProcessMergeResult'),
    postProcessMergeResult: require('./genexpert/gxalert_plugin/postProcessMergeResult'),
  },
  myanmar: {
    transformMergeResultPayload: require('./myanmar/transformMergeResultPayload'),
    onResultLogged: require('./myanmar/onResultLogged'),
  },
}

/**
 * Loads a plugin by name and action see documentation for
 * default plugin in ./default.js for available actions
 *
 * Falls back to default plugin if action
 * with name not registered
 *
 */
async function loadPlugin(pluginNames, actionName) {
  pluginNames = pluginNames || []
  for (let i = 0; i < pluginNames.length; i++) {
    const pluginAction = get(plugins, [pluginNames[i], actionName])
    if (pluginAction) {
      return pluginAction
    }
  }
  return plugins.default[actionName]
}

/**
 * Transforms a plugin specific payload to Aspect format
 * suitable to posting to standard add device data endpoint.
 *
 * Unlike most other plugins, this will only be executed for
 * data posted to the plugin endpoint with plugin identified
 * by name. This is a low level hook and it is preferable
 * to use other hooks if possible. The returned payload will
 * not be validated and should be transformed to format after
 * Hapi.js validation, e.g. dates should be parsed, numbers
 * should be numbers, etc.
 *
 * Default throws Boom.notFound() (404 error) to encourage
 * use of other endpoint unless plugin specifically implements
 */
async function transformInitialPayload(/* original request */) {
  throw Boom.notFound('Cannot find plugin.')
}

/**
 * Device API has been invoked for a given device. Return the
 * lastSeenOn date given this update, or null if this update
 * should not be considered device seen
 *
 * Default now
 */
async function getDeviceSeenOn({ now }) {
  return now
}

/**
 * Device API has been invoked with a call to update data for a
 * given device. Return the lastPingOn date given this update,
 * or null if this update should not be considered device ping
 *
 * Default now
 */
async function getDevicePingOn({ now }) {
  return now
}

/**
 * Device data is received for an API Key that does not yet have a device
 * Transform the payload to new payload  to process in format expected by
 * Device API
 *
 * This can be used, for example, to set default device type or name
 * with rules specific to this plugin.
 *
 * Default context.payload
 */
async function transformNewDevicePayload({ payload }) {
  return payload
}

/**
 * Device data is received with a new device API key
 *
 * This is called after transformNewDevicePayload but before a
 * new device record is inserted
 *
 * This can be used, for example, to perform required checks on
 * the payload and prevent duplicate devices from being created
 *
 * Returns a device object if as new one should not be created
 */
async function preProcessCreateDevice(/* request, now */) {
  return null
}

/**
 * A site is being updated, called before any processing
 * or querying of site.
 */
async function preProcessUpdateSite(/* context */) {
  // nothing to do by default
}

/**
 * Device payload has been sent to Aspect, called before
 * any of this data has been processed
 */
async function preProcessAddDeviceData(/* context */) {
  // nothing to do by default
}

/**
 * Device configuration payload has been sent to Aspect,
 * called before configuration data has been saved
 */
async function preProcessUpdateDeviceConfiguration(/* context */) {
  // nothing to do by default
}

/**
 * Device configuration payload has been sent to Aspect,
 * called after configuration data has been saved
 */
async function postProcessUpdateDeviceConfiguration(/* context */) {
  // nothing to do by default
  return {}
}

/**
 * Device operation payload has been sent to Aspect,
 * called after operation data has been saved
 */
async function postProcessAddDeviceOperation(/* context */) {
  // nothing to do by default
  return {}
}

/**
 * A site has been updated, called after any processing
 * or querying of site.
 */
async function postProcessUpdateSite(/* context, site, previousSite */) {
  // nothing to do by default
}

/**
 * A result is queried
 * called prior to any processing of result.
 */
async function preProcessGetResult(/* context */) {
  // nothing to do by default
}

/**
 * A result is queried
 * called after all processing of result.
 *
 * Return result to return to client
 */
async function postProcessGetResult(context, result) {
  return result
}

/**
 * A new result is received, called prior to any processing of result.
 */
async function preProcessMergeResult(/* context */) {
  // nothing to do by default
}

/**
 * A new result is received, transform result payload to new payload
 * to process in format expected by Device API
 * Default context.payload
 */
async function transformMergeResultPayload(context) {
  return context.payload
}

/**
 * RESULT_LOGGED action has been published referencing
 * a result handled by this plugin
 */
function onResultLogged(/* { resultId }, { messageContext } */) {
  // do nothing by default
}

module.exports = {
  loadPlugin,
}
