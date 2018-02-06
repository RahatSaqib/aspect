const { get } = require('lodash')

const {
  addResultWorkflowLogIfChanged,
  consumeInventoryForResult,
  updateFactResultCountDevice,
} = require('./common')

const plugins = {
  default: {
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
  malawi: {
    transformNewDevicePayload: require('./malawi/transformNewDevicePayload'),
    preProcessGetResult: require('./malawi/preProcessGetResult'),
    postProcessMergeResult: require('./malawi/postProcessMergeResult'),
    postProcessUpdateSite: require('./malawi/postProcessUpdateSite'),
    onResultLogged: require('./malawi/onResultLogged'),
  },
  gxconnect: {
    preProcessCreateDevice: require('./gxconnect/preProcessCreateDevice'),
    preProcessAddDeviceData: require('./gxconnect/preProcessAddDeviceData'),
    preProcessUpdateDeviceConfiguration: require('./gxconnect/preProcessUpdateDeviceConfiguration'),
    postProcessUpdateDeviceConfiguration: require('./gxconnect/postProcessUpdateDeviceConfiguration'),
    postProcessAddDeviceOperation: require('./gxconnect/postProcessAddDeviceOperation'),
    preProcessMergeResult: require('./gxconnect/preProcessMergeResult'),
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
async function loadPlugin(pluginName, actionName) {
  const action = get(plugins, [pluginName, actionName])
  return action != null ? action : plugins.default[actionName]
}

/**
 * Device data is received for an API Key that does not yet have a device
 * Tranform the payload to new payload  to process in format expected by
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
 * A new result has been created and stored to the datatase, perform
 * any post processing of the result.
 *
 * Return the response to send back to client
 */
async function postProcessMergeResult(context, result, previousResult) {
  const { knex, payload, now } = context
  await addResultWorkflowLogIfChanged(
    knex,
    payload,
    result,
    previousResult,
    'Device API Update',
    now
  )
  // // TODO ASP-355 consume inventory using a message listener instead
  // // of within plugin/same transaction
  await consumeInventoryForResult(knex, payload, result)
  await updateFactResultCountDevice(knex, payload, result)
  return {}
}

/**
 * RESULT_LOGGED action has been dispatched referencing
 * a result handled by this plugin
 */
async function onResultLogged(/* context */) {
  // do nothing by default
}

module.exports = {
  loadPlugin,
}
