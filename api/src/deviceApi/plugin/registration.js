const { get } = require('lodash')

const {
  addResultWorkflowLogIfChanged,
  consumeInventoryForResult,
  updateFactResultCountDevice,
} = require('./common')

const plugins = {
  default: {
    transformNewDevicePayload,
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
function* transformNewDevicePayload({ payload }) {
  return payload
}

/**
 * A site is being updated, called before any processing
 * or querying of site.
 */
function* preProcessUpdateSite(/* context */) {
  // nothing to do by default
}

/**
 * A site has been updated, called after any processing
 * or querying of site.
 */
function* postProcessUpdateSite(/* context, site, previousSite */) {
  // nothing to do by deafult
}

/**
 * A result is queried
 * called prior to any processing of result.
 */
function* preProcessGetResult(/* context */) {
  // nothing to do by default
}

/**
 * A result is queried
 * called after all processing of result.
 *
 * Return result to return to client
 */
function* postProcessGetResult(context, result) {
  return result
}

/**
 * A new result is received, called prior to any processing of result.
 */
function* preProcessMergeResult(/* context */) {
  // nothing to do by default
}

/**
 * A new result is received, transform result payload to new payload
 * to process in format expected by Device API
 * Default context.payload
 */
function* transformMergeResultPayload(context) {
  return context.payload
}

/**
 * A new result has been created and stored to the datatase, perform
 * any post processing of the result.
 *
 * Return the response to send back to client
 */
function* postProcessMergeResult(context, result, previousResult) {
  const { knex, payload, now } = context
  yield* addResultWorkflowLogIfChanged(
    knex,
    payload,
    result,
    previousResult,
    'Device API Update',
    now
  )
  // TODO ASP-355 consume inventory using a message listener instead
  // of within plugin/same transaction
  yield* consumeInventoryForResult(knex, payload, result)
  yield* updateFactResultCountDevice(knex, payload, result)
  return {}
}

/**
 * RESULT_LOGGED action has been dispatched referencing
 * a result handled by this plugin
 */
function* onResultLogged(/* context */) {
  // do nothing by default
}

module.exports = {
  loadPlugin,
}
