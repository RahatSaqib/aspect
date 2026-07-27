const excludeResult = require('../result/excludeResult')
const issueTriggers = require('../issueTriggers')
const issueResolutions = require('../issueResolutions')
const filtersOpenIssues = require('../../issue/filterConditions')
const { extractSampleId } = require('../deviceType/extractSampleId')
const {
  acronymForDeviceType,
  withCustomNamePart,
  defaultGenerateDeviceName,
} = require('../../device/common/deviceAcronym')

const DEFAULT_SETTINGS = {
  displayPreferences: {
    dateFormat: 'yyyy-MM-dd',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'yyyy-MM-dd HH:mm',
    dayMonthFormat: 'MM/dd',
    utilizationRateThreshold: 0.8,
    errorRateThreshold: 0.05,

    stateLabel: 'State',
    statesLabel: 'States',
    countyLabel: 'County',
    countiesLabel: 'Counties',
    lgaLabel: 'LGA',
    lgasLabel: 'LGAs',

    showFilterDisplayResult: false,
  },
}

const basePlugin = {
  settings: DEFAULT_SETTINGS,
  issueTriggers,
  issueResolutions,
  issueEscalations: {},
  dataCategories: {},
  filtersOpenIssues,
  preProcessCreateDevice,
  postProcessCreateDevice,
  generateDeviceName,
  resolveDeviceNameOnEdit,
  postProcessGetResult,
  preProcessMergeResult,
  excludeResult,
  transformMergeResultPayload,
  onResultLogged,
  onCaseAdded,
  onCaseUpdated,
  findResult,
  extractCustomFieldsFromPayload,
  extractSampleId,
  identifyDevice,
}

/**
 * Device data is received with a new device API key
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
 * Device has been created, called after a new device record is inserted
 *
 * This can be used, for example, to create related records or
 * perform post-creation setup tasks
 *
 * @param {Object} context - The context object with device, payload, knex, etc.
 */
async function postProcessCreateDevice(/* context */) {
  // nothing to do by default
}

/**
 * A device has been inserted; generate the value to store in Device.name.
 * Called after the row exists so Device.id is available.
 *
 * The default produces `${DeviceType.acronym}${Device.id}` (e.g. "GX45").
 * Override per partner/device type to customise the displayed name.
 *
 * @param {Object} context - { knex, deviceId, deviceTypeId }
 * @returns {Promise<string>}
 */
async function generateDeviceName(context) {
  return defaultGenerateDeviceName(context)
}

/**
 * Called when a device is edited via the client API. Partners may override
 * to derive Device.name from the edited payload. Return null to keep the
 * submitted name/shortName values.
 *
 * The default rebuilds the generated name (`${acronym}${id}`) with the edited
 * custom name part so name changes to that field take effect immediately.
 *
 * @param {Object} context - { deviceId, currentName, deviceType, editedDevice }
 * @returns {Promise<string|null>}
 */
async function resolveDeviceNameOnEdit({ deviceId, deviceType, editedDevice }) {
  return withCustomNamePart(`${acronymForDeviceType(deviceType || {})}${deviceId}`, editedDevice?.customNamePart)
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
async function transformMergeResultPayload(/* context */) {
  // nothing to do by default
}

/**
 * RESULT_LOGGED action has been published referencing
 * a result handled by this plugin
 */
async function onResultLogged(/* { resultId }, { messageContext } */) {
  // do nothing by default
}

/**
 * CASE_ADDED action has been published referencing
 * a Case handled by this plugin
 */
async function onCaseAdded(/* { caseId }, { messageContext } */) {
  // do nothing by default
}

/**
 * CASE_UPDATED action has been published referencing
 * a Case handled by this plugin
 */
async function onCaseUpdated(/* { caseId }, { messageContext } */) {
  // do nothing by default
}

/**
 * This function returns an object containing custom field data, which can be merged with the Result object and saved to the database
 */
async function extractCustomFieldsFromPayload(/* { payload, countryAbbreviation, partnerId, assayId } */) {
  return {}
}

async function findResult(/* availableResultDetails, knex */) {
  throw new Error('findResult not implemented for this plugin')
}

async function identifyDevice(/* payload, partnerId */) {
  throw new Error('identifyDevice not implemented for this plugin')
}

module.exports = {
  basePlugin,
}
