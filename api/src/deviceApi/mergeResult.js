const Boom = require('@hapi/boom')
const _ = require('lodash')
const { mergeResultWithPayload } = require('../result/common/logic')
const { resultSourceToId, resultTypeToId, resultWorkflowStatusToId, sampleTypeToId } = require('../shared/dictionary')
const { getLatestResultWorkflowLog } = require('./result')
const { getResultCategoriesFromPayload } = require('./utils')
const { isValidSampleExternalIdMobileFormat } = require('../sample/common/logic')
const { getSampleByExternalId } = require('../sample/common/db')

async function mergeResult(knex, deviceId, payload, { now = new Date() } = {}, context) {
  const { result: existingResult, isTransferred } = await getResultRecord(
    knex,
    payload,
    deviceId,
    context?.existingResultId
  )

  const testStartedOn = _.get(payload, 'startedOn', _.get(existingResult, 'startedOn', null))
  // Select ResultType if specified, otherwise Patient
  const resultTypeId = await getResultTypeId(payload, existingResult)

  // Select Workflow Status if specified, otherwise Error or OK depending on error payload
  const resultWorkflowStatusId = await getResultWorkflowStatusId(knex, payload, existingResult)

  // Categories if specified, otherwise Error or Success depending on error payload
  const { resultCategory1, resultCategory2 } = await getResultCategoriesFromPayload(payload, existingResult)

  // Gets the site that is linked to the device as well as the valid types of assays that can be used on the device
  const { assays, site: deviceSite } = await getSiteAndAssays(knex, payload, existingResult, deviceId)

  // Exit on any error
  const requestErrors = await getResultErrors({ site: deviceSite, resultTypeId, resultCategory1, assays, payload })
  if (!_.isEmpty(requestErrors)) {
    throw Boom.badRequest(`Cannot find ${requestErrors.join(', ')}`)
  }

  const [assay] = assays

  // Select ResultSource if specified, otherwise from Assay
  const resultSourceId = await getResultSourceId(payload, existingResult, assay)

  // Sample Type
  let sampleTypeId = null
  const payloadSampleTypeId = payload.sample?.type?.id
  if (payloadSampleTypeId) {
    sampleTypeId = await sampleTypeToId(payloadSampleTypeId)
    if (sampleTypeId == null) {
      throw Boom.badRequest(`Cannot find sample type ${payloadSampleTypeId}`)
    }
  }
  let existingSample = null
  const payloadSampleExternalId = payload.sample?.id
  if (payloadSampleExternalId) {
    existingSample = isValidSampleExternalIdMobileFormat(payloadSampleExternalId)
      ? await getSampleByExternalId(knex, payloadSampleExternalId, deviceSite.countryId)
      : await getMatchingSample(knex, payloadSampleExternalId, payloadSampleTypeId, deviceSite.countryId, testStartedOn)
  }
  const { sampleOriginSiteId, reportableSiteId } = await resolveSiteAssignments(
    knex,
    payload,
    deviceSite,
    existingResult,
    existingSample,
    isTransferred
  )

  const opts = {
    sampleId: existingSample?.id || existingResult?.sampleId,
    sampleTypeId,
    sampleOriginSiteId,
    payloadSampleTypeId,
  }

  const sampleId = await upsertSample(knex, payload, existingSample, opts)

  const { patientData, resultData, resultDataHash, shouldTriggerResultNotification } = mergeResultWithPayload(
    existingResult,
    payload
  )

  const preProcessedResult = {
    latitude: _.get(payload, 'location.latitude', _.get(existingResult, 'latitude', deviceSite.latitude)),
    longitude: _.get(payload, 'location.longitude', _.get(existingResult, 'longitude', deviceSite.longitude)),
    assayId: assay.id,
    assayVersion: _.get(payload, 'assay.version', _.get(existingResult, 'assayVersion', null)),
    resultTypeId,
    resultSourceId,
    sampleId,
    sampleRunNumber: _.get(payload, 'sample.runNumber', _.get(existingResult, 'sampleRunNumber', null)),
    sampleGroup: _.get(payload, 'sample.group', _.get(existingResult, 'sampleGroup', null)),
    resultCategory1,
    resultCategory2,
    resultData,
    resultDataHash,
    startedOn: testStartedOn,
    endedOn: _.get(payload, 'endedOn', _.get(existingResult, 'endedOn', null)),
    consumableSerial: _.get(payload, 'consumable[0].serial', _.get(existingResult, 'consumableSerial', null)),
    consumableExpirationDate: _.get(
      payload,
      'consumable[0].expirationDate',
      _.get(existingResult, 'consumableExpirationDate', null)
    ),
    consumableLot: _.get(payload, 'consumable[0].lot', _.get(existingResult, 'consumableLot', null)),
    instrumentSerial: _.get(payload, 'instrument.serial', _.get(existingResult, 'instrumentSerial', null)),
    moduleSerial: _.get(payload, 'instrument.module.serial', _.get(existingResult, 'moduleSerial', null)),
    moduleName: _.get(payload, 'instrument.module.name', _.get(existingResult, 'moduleName', null)),
    oemData: _.has(payload, 'oemData') ? String(payload.oemData) : _.get(existingResult, 'oemData'),
    rawData: _.has(payload, 'rawData') ? String(payload.rawData) : _.get(existingResult, 'rawData'),
    researchId: _.get(payload, 'research.id', _.get(existingResult, 'researchId', null)),
    patientData,
    senderVersion: _.get(payload, 'sender.version', _.get(existingResult, 'senderVersion', null)),
    senderOperator: _.get(payload, 'sender.operator', _.get(existingResult, 'senderOperator', null)),
    notes: _.get(payload, 'notes', _.get(existingResult, 'notes', null)),
    errorCode: _.get(payload, 'error.code', _.get(existingResult, 'errorCode', null)),
    errorNotes: _.get(payload, 'error.notes', _.get(existingResult, 'errorNotes', null)),
    updatedOn: now,
    createdOn: _.get(existingResult, 'createdOn', now),
    reportableSiteId,
    gxAlertTestId: _.get(payload, 'gxAlertTestId'),
    gxAlertSyncedOn: _.get(payload, 'gxAlertTestId') ? now : null,
  }

  // Extract CustomFields from Payload
  const countryAbbreviation = await getCountryAbbreviationByDeviceId(knex, deviceId)
  const customFieldsData = await context.extractCustomFieldsFromPayload({
    payload,
    countryAbbreviation,
    partnerId: deviceSite.partnerId,
    assayId: assay.id,
    deviceId,
  })

  const preProcessedResultWithCustomFields = _.merge(preProcessedResult, customFieldsData)

  const result = {
    ...preProcessedResultWithCustomFields,
    resultData: JSON.stringify(preProcessedResultWithCustomFields.resultData),
    patientData: !_.isEmpty(preProcessedResultWithCustomFields.patientData)
      ? JSON.stringify(preProcessedResultWithCustomFields.patientData)
      : null,
  }

  // Processed result contains result with additional fields
  // we want to insert but never update and will be passed to
  // plugins for further processing. It should contain all columns
  // from the Result table
  const processedResult = {
    externalId: payload.id,
    deviceId,
    partnerId: deviceSite.partnerId,
    siteId: deviceSite.id,
    createdOn: now,
    ...result,
  }

  let resultId
  if (existingResult) {
    resultId = existingResult.id
    await knex('Result').where({ id: resultId }).update(result)
  } else {
    ;[resultId] = await knex('Result').insert(processedResult)
  }

  const [lastLogId] = await knex('ResultWorkflowLog').insert({
    resultId,
    resultWorkflowStatusId,
    createdOn: now,
    changedOn: now,
    createdBy: 1,
  })
  await knex('Result').where({ id: resultId }).update({
    resultWorkflowStatusLogId: lastLogId,
    updatedOn: now,
  })
  processedResult.resultWorkflowStatusLogId = lastLogId
  processedResult.resultWorkflowStatusId = resultWorkflowStatusId
  processedResult.id = resultId
  processedResult.updatedOn = now
  return {
    processedResult,
    existingResult,
    shouldTriggerResultNotification,
  }
}

async function getResultRecord(knex, payload, deviceId, resultId) {
  let resultData = null
  const baseQuery = knex('Result as r')
    .leftJoin('ResultTransferLog as rtl', 'r.id', 'rtl.resultId')
    .first(knex.raw('r.*'), knex.raw('rtl.id is not null as isTransferred'))
  if (resultId) {
    resultData = await baseQuery.where('r.id', resultId)
  } else if (payload.id) {
    resultData = await baseQuery.where({
      'r.externalId': payload.id,
      'r.deviceId': deviceId,
    })
  }

  if (!resultData) {
    return { result: null, isTransferred: false }
  }

  const { isTransferred, ...resultRecord } = resultData
  return { result: resultRecord, isTransferred }
}

async function getResultTypeId(payload, existingResult) {
  let resultTypeId = null
  if (_.has(payload, 'type.id')) {
    resultTypeId = await resultTypeToId(_.get(payload, 'type.id'))
  } else if (existingResult) {
    ;({ resultTypeId } = existingResult)
  } else {
    resultTypeId = await resultTypeToId('Patient')
  }
  return resultTypeId
}

async function getResultWorkflowStatusId(knex, payload, existingResult) {
  let resultWorkflowStatusId = null
  if (_.has(payload, 'workflow.status.id')) {
    resultWorkflowStatusId = await resultWorkflowStatusToId(_.get(payload, 'workflow.status.id', ''))
  } else if (
    payload.error ||
    (_.get(payload, 'data.resultText') && _.get(payload, 'data.resultText').toUpperCase().indexOf('ERROR') !== -1)
  ) {
    resultWorkflowStatusId = await resultWorkflowStatusToId('Error')
  } else if (existingResult) {
    ;({ resultWorkflowStatusId } = await getLatestResultWorkflowLog(knex, existingResult.id))
  } else {
    resultWorkflowStatusId = await resultWorkflowStatusToId('OK')
  }
  return resultWorkflowStatusId
}

async function getResultErrors({ site, resultTypeId, resultCategory1, assays, payload }) {
  const requestErrors = []
  if (!site) {
    requestErrors.push('assigned site for device')
  }
  if (!resultTypeId) {
    requestErrors.push(`result type with id ${_.get(payload, 'type.id')}`)
  }
  if (!resultCategory1) {
    requestErrors.push(`result category 1 with categories with ids ${JSON.stringify(_.get(payload, 'category'))}}`)
  }
  if (assays?.length !== 1) {
    requestErrors.push(`assay with id ${_.get(payload, 'assay.id')}`)
  }
  return requestErrors
}

async function getResultSourceId(payload, existingResult, assay) {
  let resultSourceId = null
  if (_.has(payload, 'source.id')) {
    resultSourceId = await resultSourceToId(_.get(payload, 'source.id', ''))
    if (!resultSourceId) {
      throw Boom.badRequest(`Cannot find result source with id ${_.get(payload, 'source.id')}`)
    }
  } else if (existingResult) {
    ;({ resultSourceId } = existingResult)
  } else {
    ;({ resultSourceId } = assay)
  }
  return resultSourceId
}

async function resolveSiteAssignments(knex, payload, deviceSite, existingResult, existingSample, isTransferred) {
  // Sample.originSiteId
  let payloadSampleOriginSiteId = null
  const payloadSampleOriginSiteExternalId = payload.sample?.originSite?.id || false
  if (payloadSampleOriginSiteExternalId) {
    const sampleSiteRow = await knex('Site').where('externalId', payloadSampleOriginSiteExternalId).first('id')
    payloadSampleOriginSiteId = sampleSiteRow?.id || null
  }

  const sampleOriginSiteId = existingSample?.registeredInMobile
    ? existingSample.originSiteId
    : payloadSampleOriginSiteId || deviceSite.id

  // Result.reportableSiteId
  let reportableSiteId = deviceSite.id
  if (isTransferred) {
    reportableSiteId = existingResult.reportableSiteId
  } else if (existingSample?.registeredInMobile) {
    reportableSiteId = existingSample.originSiteId
  }

  return { sampleOriginSiteId, reportableSiteId }
}

/**
 * Finds an existing unique sample ID in a specific country.
 * @param {Object} knex - The Knex database instance
 * @param {string|null} sampleExternalId - The external ID of the sample to search for
 * @param {string|null} sampleTypeExternalId - The external ID of the sample type to match
 * @param {number} countryId - The ID of the country to search within
 * @param {Date} testStartedOn - The timestamp to filter samples by collection date
 * @returns {Promise<number|null>} The ID of the matching sample if found, null otherwise
 *
 * @description
 * This function searches for an existing unique sample in the database that matches the given criteria:
 * 1. Has the specified external ID
 * 2. Belongs to the specified country
 * 3. Was collected before or on the test start date
 *
 * - Returns a single match if only one exists
 * - Return null if the match is not a single match (zero or multiple samples found)
 */
async function getMatchingSample(knex, sampleExternalId, sampleTypeExternalId, countryId, testStartedOn) {
  if (!sampleExternalId || sampleExternalId.length < 7) {
    return Promise.resolve(null)
  }

  const samplesOfType = await knex('Sample as s')
    .join('Site as site', 's.originSiteId', 'site.id')
    .join('Geography as g', 'site.geographyId', 'g.id')
    .leftJoin('SampleType as st', 's.sampleTypeId', 'st.id')
    .where('s.externalId', sampleExternalId)
    .andWhere('g.countryId', countryId)
    .andWhere(qb => qb.whereNull('s.collectedOn').orWhere('s.collectedOn', '<=', testStartedOn))
    .orderBy('s.collectedOn', 'desc')
    .select('s.id', 'st.externalId as sampleTypeExternalId', 's.collectedOn')

  if (samplesOfType.length === 1) {
    return samplesOfType[0]
  }
  return null
}

/**
 * Creates a new sample or updates an existing one based on the provided payload and options.
 *
 * @param {Object} knex - The Knex database instance
 * @param {Object} payload - The payload containing sample information
 * @param {Object|null} existingResult - The existing result record if any
 * @param {Object} opts - Options object containing:
 * @param {number|null} opts.sampleId - The ID of an existing sample
 * @param {number|null} opts.sampleTypeId - The ID of the sample type
 * @param {number} opts.sampleOriginSiteId - The ID of the site where the sample originated
 * @param {string|null} opts.payloadOriginSiteId - The id of the origin site from payload
 * @param {string|null} opts.payloadSampleTypeId - The id of the sample type from payload
 * @returns {Promise<{existingSample: Object|null, sampleId: number}>} Object containing:
 *   - existingSample: The existing sample record if found and updated
 *   - sampleId: The ID of the created or updated sample
 *
 * @description
 * This function handles the creation or update of a sample record:
 * 1. If no sampleId exists and there's no existing result, creates a new sample
 * 2. If sampleId exists or can be derived from existingResult:
 *    - Retrieves the existing sample
 *    - Updates it with new information from the payload if available
 *    - Preserves existing values when payload data is not provided
 *    - For sample.originSiteId, it is always preserved.
 */
async function upsertSample(knex, payload, existingSample, opts) {
  const { sampleTypeId, sampleOriginSiteId, payloadSampleTypeId } = opts
  const now = new Date()
  let sampleId = existingSample?.id
  if (!existingSample) {
    ;[sampleId] = await knex('Sample').insert({
      externalId: _.get(payload, 'sample.id', null),
      collectedOn: _.get(payload, 'sample.collectedOn', null),
      registeredInMobile: false,
      sampleTypeId,
      originSiteId: sampleOriginSiteId,
      createdOn: now,
      updatedOn: now,
    })
  } else {
    await knex('Sample')
      .where({ id: sampleId })
      .update({
        externalId: payload?.sample?.id || payload?.data?.sampleId || existingSample.externalId,
        collectedOn: payload.sample.collectedOn || existingSample.collectedOn || null,
        sampleTypeId: payloadSampleTypeId ? sampleTypeId : existingSample.sampleTypeId,
        originSiteId: existingSample.originSiteId || sampleOriginSiteId,
        updatedOn: now,
      })
  }
  return sampleId
}

async function getSiteAndAssays(knex, payload, existingResult, deviceId) {
  const assayQ = knex('Assay as a')
    .join('Device as d', 'a.deviceTypeId', 'd.deviceTypeId')
    .where({ 'd.id': deviceId })
    .limit(2)
    .select('a.id', 'a.externalId', 'a.resultSourceId')
  const payloadAssayId = _.get(payload, 'assay.id', false)
  if (payloadAssayId) {
    assayQ.where({ 'a.externalId': payloadAssayId })
  } else if (existingResult) {
    assayQ.where({ 'a.id': existingResult.assayId })
  }

  const siteQ = knex('Site as s')
    .join('Device as d', 's.id', 'd.siteId')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .where({ 'd.id': deviceId })
    .first(
      's.id',
      's.partnerId',
      'g.countryId',
      's.geographyId',
      's.latitude',
      's.longitude',
      'd.defaultReportableSiteId'
    )

  const [assays, site] = await Promise.all([assayQ, siteQ])
  return { assays, site }
}

const getCountryAbbreviationByDeviceId = async (knex, deviceId) => {
  const { countryAbbreviation } = await knex('Device as d')
    .leftJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .where({ 'd.id': deviceId })
    .first('c.abbreviation as countryAbbreviation')

  return countryAbbreviation
}

module.exports = { mergeResult }
