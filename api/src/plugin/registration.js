const { get, merge } = require('lodash')
const Boom = require('boom')

const { postProcessMergeResult } = require('../deviceApi/result')

const DEFAULT_SETTINGS = {
  displayPreferences: {
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
  },
}

const DEFAULT_HANDLER_OPTIONS = {
  addDeviceDataWithContext: {
    createDevice: true,
    updatePing: true,
    updateDeviceLog: true,
  },
  updateDeviceConfigurationWithContext: {
    updatePing: true,
    updateDeviceLog: true,
  },
  addDeviceOperationWithContext: {
    updatePing: true,
    updateDeviceLog: true,
  },
  mergeResultWithContext: {
    updatePing: true,
    updateDeviceLog: true,
  },
}

const plugins = {
  default: {
    settings: DEFAULT_SETTINGS,
    handlerOptions: DEFAULT_HANDLER_OPTIONS,
    issueTriggers: {},
    issueResolutions: {},
    issueEscalations: {},
    dataCategories: {},
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
    onGxAlertAuthenticated,
  },
  commcare: {
    transformInitialPayload: require('./deviceType/CommCareApp/transformInitialPayload'),
  },
  malawi: {
    transformNewDevicePayload: require('./partner/Malawi/transformNewDevicePayload'),
    preProcessGetResult: require('./partner/Malawi/preProcessGetResult'),
    postProcessMergeResult: require('./partner/Malawi/postProcessMergeResult'),
    postProcessUpdateSite: require('./partner/Malawi/postProcessUpdateSite'),
    onResultLogged: require('./partner/Malawi/onResultLogged'),
  },
  gxconnect: {
    preProcessCreateDevice: require('./deviceType/CepheidGeneXpert/preProcessCreateDevice'),
    preProcessAddDeviceData: require('./deviceType/CepheidGeneXpert/preProcessAddDeviceData'),
    postProcessUpdateDeviceConfiguration: require('./deviceType/CepheidGeneXpert/postProcessUpdateDeviceConfiguration'),
    postProcessAddDeviceOperation: require('./deviceType/CepheidGeneXpert/postProcessAddDeviceOperation'),
    transformMergeResultPayload: require('./deviceType/CepheidGeneXpert/transformMergeResultPayload'),
    preProcessMergeResult: require('./deviceType/CepheidGeneXpert/preProcessMergeResult'),
  },
  gxalert: {
    getDeviceSeenOn: require('./deviceType/GxAlert/getDeviceSeenOn'),
    getDevicePingOn: require('./deviceType/GxAlert/getDevicePingOn'),
    preProcessAddDeviceData: require('./deviceType/GxAlert/preProcessAddDeviceData'),
    preProcessUpdateDeviceConfiguration: require('./deviceType/GxAlert/preProcessUpdateDeviceConfiguration'),
    postProcessUpdateDeviceConfiguration: require('./deviceType/GxAlert/postProcessUpdateDeviceConfiguration'),
    postProcessAddDeviceOperation: require('./deviceType/GxAlert/postProcessAddDeviceOperation'),
    transformMergeResultPayload: require('./deviceType/GxAlert/transformMergeResultPayload'),
    preProcessMergeResult: require('./deviceType/GxAlert/preProcessMergeResult'),
    postProcessMergeResult: require('./deviceType/GxAlert/postProcessMergeResult'),
  },
  myanmar: {
    settings: require('./partner/Myanmar/settings'),
    issueResolutions: require('./partner/Myanmar/issueResolutions'),
    issueEscalations: require('./partner/Myanmar/issueEscalations'),
    dataCategories: require('./partner/Myanmar/dataCategories'),
    transformMergeResultPayload: require('./partner/Myanmar/transformMergeResultPayload'),
    onResultLogged: require('./partner/Myanmar/onResultLogged'),
  },
  alereftpconnector: {
    handlerOptions: merge(
      {},
      DEFAULT_HANDLER_OPTIONS,
      require('./deviceType/AlereFtpConnector/handlerOptions')
    ),
    getDeviceSeenOn: require('./deviceType/AlereFtpConnector/getDeviceSeenOn'),
    preProcessAddDeviceData: require('./deviceType/AlereFtpConnector/preProcessAddDeviceData'),
    preProcessMergeResult: require('./deviceType/AlereFtpConnector/preProcessMergeResult'),
    postProcessMergeResult: require('./deviceType/AlereFtpConnector/postProcessMergeResult'),
  },
  sa_nhls: {
    issueTriggers: require('./partner/SA_NHLS/issueTriggers'),
    issueEscalations: require('./partner/SA_NHLS/issueEscalationConditions'),
    issueResolutions: require('./partner/SA_NHLS/issueResolutionConditions'),
    onResultLogged: require('./partner/SA_NHLS/onResultLogged'),
    onGxAlertAuthenticated: require('./partner/SA_NHLS/onGxAlertAuthenticated'),
    postProcessMergeResult: require('./partner/SA_NHLS/postProcessMergeResult'),
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
async function onResultLogged(/* { resultId }, { messageContext } */) {
  // do nothing by default
}

/**
 * A user, that does not yet exist in Aspect, has logged in using GxAlert credentials
 * and the user has been migrated into Aspect.
 */
async function onGxAlertAuthenticated(/* { gxUser, user, personId, partnerId, knex } */) {
  // do nothing by default
}

module.exports = {
  loadPlugin,
}
