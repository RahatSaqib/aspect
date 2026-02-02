const excludeResult = require('../result/excludeResult')
const issueTriggers = require('../issueTriggers')
const issueResolutions = require('../issueResolutions')
const filtersOpenIssues = require('../../issue/filterConditions')
const { extractSampleId } = require('../deviceType/extractSampleId')

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
  preProcessUpdateDeviceConfiguration,
  postProcessUpdateDeviceConfiguration,
  postProcessGetResult,
  preProcessMergeResult,
  excludeResult,
  transformMergeResultPayload,
  onResultLogged,
  onGxAlertAuthenticated,
  onCaseAdded,
  onCaseUpdated,
  onPatientAdded,
  onPatientUpdated,
  getCustomFields,
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
 * In daily details we are going to send the custom fields configured.
 * This function will return the daily details to be shared with all the gxconnect deployments.
 *
 */
async function getCustomFields() {
  return null
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
 * PATIENT_ADDED action has been published referencing
 * a Patient handled by this plugin
 */
async function onPatientAdded(/* { patientId }, { messageContext } */) {
  // do nothing by default
}

/**
 * PATIENT_UPDATED action has been published referencing
 * a Patient handled by this plugin
 */
async function onPatientUpdated(/* { patientId }, { messageContext } */) {
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
