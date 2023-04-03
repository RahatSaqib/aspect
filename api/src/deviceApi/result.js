const Boom = require('@hapi/boom')
const _ = require('lodash')
const crypto = require('crypto')

const { isJson, deepMerge } = require('../shared/json')
const {
  resultSourceToId,
  resultCategoryToId,
  resultTypeToId,
  resultWorkflowStatusToId,
  sampleTypeToId,
} = require('../shared/dictionary')
const { convertStringToFloat } = require('../shared/string')

const { getDevice } = require('../device/service')
const inventory = require('../inventory/service')

// ----------------------------------------------------------
async function getExistingResult(knex, payload, deviceId) {
  let existingResult = null
  if (payload.id) {
    existingResult = await knex('Result as r')
      .where({
        'r.externalId': payload.id,
        'r.deviceId': deviceId,
      })
      .first()
  }
  return existingResult
}

// ----------------------------------------------------------
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

// ----------------------------------------------------------
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

// ----------------------------------------------------------
async function getResultCategories(payload, existingResult) {
  const categoryIds = _.map(payload.category, 'id')
  let resultCategory1 = null
  let resultCategory2 = null
  if (categoryIds.length > 0 && categoryIds[0]) {
    resultCategory1 = await resultCategoryToId(categoryIds[0])
  } else if (payload.error) {
    resultCategory1 = await resultCategoryToId('Error')
  } else if (existingResult && existingResult.resultCategory1) {
    ;({ resultCategory1 } = existingResult)
  } else {
    resultCategory1 = await resultCategoryToId('Success')
  }
  if (categoryIds.length > 1 && categoryIds[1]) {
    resultCategory2 = await resultCategoryToId(categoryIds[1])
  } else if (existingResult && existingResult.resultCategory2) {
    resultCategory2 = null
  }
  return { categoryIds, resultCategory1, resultCategory2 }
}

// ----------------------------------------------------------
async function getResultErrors({ site, resultTypeId, resultCategory1, assays, categoryIds, payload }) {
  const requestErrors = []
  if (!site) {
    requestErrors.push('assigned site for device')
  }
  if (!resultTypeId) {
    requestErrors.push(`result type with id ${_.get(payload, 'type.id')}`)
  }
  if (!resultCategory1) {
    requestErrors.push(`result categories with ids ${categoryIds.join(' ')}`)
  }
  if (assays?.length !== 1) {
    requestErrors.push(`assay with id ${_.get(payload, 'assay.id')}`)
  }
  return requestErrors
}

// ----------------------------------------------------------
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

// ----------------------------------------------------------
async function getSiteIdVarieties(knex, payload, site, now) {
  let sampleOriginSiteId = site.id
  let reportableSiteId = site.id
  const payloadOriginSiteId = _.get(payload, 'sample.originSite.id', false)
  if (payloadOriginSiteId) {
    const originSiteStateName = _.get(payload, 'sample.originSite.state')
    let { id: originSiteGeographyId } =
      (await knex('Geography')
        .where('countryId', site.countryId)
        .whereNull('stateId')
        .whereNull('lgaId')
        .first('id')) || {}
    if (originSiteStateName) {
      let { id: originSiteStateId } =
        (await knex('State as s')
          .join('Geography as g', 's.id', 'g.stateId')
          .where({
            'g.countryId': site.countryId,
            's.name': originSiteStateName,
          })
          .first('s.id')) || {}
      if (!originSiteStateId) {
        ;[originSiteStateId] = await knex('State').insert({
          name: originSiteStateName,
        })
      }
      let { id: originSiteStateGeographyId } =
        (await knex('Geography')
          .whereNull('lgaId')
          .andWhere({
            countryId: site.countryId,
            stateId: originSiteStateId,
          })
          .first('id')) || {}
      if (!originSiteStateGeographyId) {
        ;[originSiteStateGeographyId] = await knex('Geography').insert({
          countryId: site.countryId,
          stateId: originSiteStateId,
        })
      }
      originSiteGeographyId = originSiteStateGeographyId
      const originSiteLgaName = _.get(payload, 'sample.originSite.lga')
      if (originSiteLgaName) {
        let { id: originSiteLgaId } =
          (await knex('Lga as l')
            .join('Geography as g', 'l.id', 'g.lgaId')
            .where({
              'g.stateId': originSiteStateId,
              'l.name': originSiteLgaName,
            })
            .first('l.id')) || {}
        if (!originSiteLgaId) {
          ;[originSiteLgaId] = await knex('Lga').insert({
            name: originSiteLgaName,
          })
        }
        let { id: originSiteLgaGeographyId } =
          (await knex('Geography')
            .where({
              countryId: site.countryId,
              stateId: originSiteStateId,
              lgaId: originSiteLgaId,
            })
            .first('id')) || {}
        if (!originSiteLgaGeographyId) {
          ;[originSiteLgaGeographyId] = await knex('Geography').insert({
            countryId: site.countryId,
            stateId: originSiteStateId,
            lgaId: originSiteLgaId,
          })
        }
        originSiteGeographyId = originSiteLgaGeographyId
      }
    }
    let sampleOriginSite = await knex('Site')
      .where({ partnerId: site.partnerId, externalId: payloadOriginSiteId })
      .first()
    let siteGeography = {}
    if (sampleOriginSite && sampleOriginSite.geographyId) {
      siteGeography = await knex('Geography').where('id', sampleOriginSite.geographyId).first()
    }
    if (originSiteGeographyId) {
      const originSiteGeography = (await knex('Geography').where('id', originSiteGeographyId).first()) || {}
      if (originSiteGeography.countryId && !siteGeography.countryId) {
        siteGeography.countryId = originSiteGeography.countryId
      }
      if (siteGeography.countryId && originSiteGeography.stateId && !siteGeography.stateId) {
        siteGeography.stateId = originSiteGeography.stateId
      }
      if (siteGeography.stateId && originSiteGeography.lgaId && !siteGeography.lgaId) {
        siteGeography.lgaId = originSiteGeography.lgaId
      }
    }
    if (siteGeography.countryId) {
      siteGeography =
        (await knex('Geography')
          .where('countryId', siteGeography.countryId)
          .andWhere(function () {
            if (siteGeography.stateId) {
              this.where('stateId', siteGeography.stateId)
            } else {
              this.whereNull('stateId')
            }
          })
          .andWhere(function () {
            if (siteGeography.lgaId) {
              this.where('lgaId', siteGeography.lgaId)
            } else {
              this.whereNull('lgaId')
            }
          })
          .first()) || {}
    }
    const sampleOriginSiteName = _.get(payload, 'sample.originSite.name')
    const sampleOriginSiteDetailsInPayload = {
      name: sampleOriginSiteName,
      shortName: _.get(payload, 'sample.originSite.shortName'),
      notes: _.get(payload, 'sample.originSite.notes'),
      partnerId: site.partnerId,
      geographyId: siteGeography.id || originSiteGeographyId,
      city: _.get(payload, 'sample.originSite.city'),
      street1: _.get(payload, 'sample.originSite.street1'),
      street2: _.get(payload, 'sample.originSite.street2'),
      zip: _.get(payload, 'sample.originSite.zip'),
      longitude: convertStringToFloat(_.get(payload, 'sample.originSite.location.longitude')),
      latitude: convertStringToFloat(_.get(payload, 'sample.originSite.location.latitude')),
      timezoneId: _.get(payload, 'sample.originSite.timezoneId'),
      hoursStart: convertStringToFloat(_.get(payload, 'sample.originSite.hoursStart')),
      hoursEnd: convertStringToFloat(_.get(payload, 'sample.originSite.hoursEnd')),
    }
    if (!sampleOriginSite) {
      if (!sampleOriginSiteName) {
        throw Boom.badRequest(`Cannot find Sample origin site ${payloadOriginSiteId}`)
      }
      const newSampleOriginSite = {
        ...sampleOriginSiteDetailsInPayload,
        externalId: payloadOriginSiteId,
        createdOn: now,
        updatedOn: now,
      }
      if (!newSampleOriginSite.shortName) {
        newSampleOriginSite.shortName = sampleOriginSiteName
      }
      if (newSampleOriginSite.shortName.length > 45) {
        newSampleOriginSite.shortName = newSampleOriginSite.shortName.substr(0, 45)
      }
      const [newSampleOriginSiteId] = await knex('Site').insert(newSampleOriginSite)
      sampleOriginSite = { id: newSampleOriginSiteId }
    } else {
      await knex('Site')
        .where('id', sampleOriginSite.id)
        .update({
          ..._.omit(sampleOriginSite, ['id']),
          ..._.omitBy(sampleOriginSiteDetailsInPayload, _.isNil),
        })
    }
    sampleOriginSiteId = sampleOriginSite.id
    reportableSiteId = sampleOriginSite.id
  }
  return { sampleOriginSiteId, reportableSiteId, payloadOriginSiteId }
}

// ----------------------------------------------------------
async function getExistingSample(knex, payload, existingResult, opts) {
  let { sampleId } = opts
  const { sampleTypeId, sampleOriginSiteId, payloadOriginSiteId, payloadSampleTypeId } = opts
  let existingSample
  if (sampleId == null && existingResult == null) {
    ;[sampleId] = await knex('Sample').insert({
      externalId: _.get(payload, 'sample.id', null),
      collectedOn: _.get(payload, 'sample.collectedOn', null),
      sampleTypeId,
      originSiteId: sampleOriginSiteId,
    })
  } else {
    if (sampleId == null) {
      ;({ sampleId } = existingResult)
    }
    if (_.has(payload, 'sample')) {
      existingSample =
        (await knex('Sample')
          .where({ id: sampleId })
          .first('externalId', 'collectedOn', 'sampleTypeId', 'originSiteId')) || {}
      await knex('Sample')
        .where({ id: sampleId })
        .update({
          externalId: _.get(payload, 'sample.id', existingSample.externalId),
          collectedOn: _.get(payload, 'sample.collectedOn', _.get(existingSample, 'collectedOn', null)),
          sampleTypeId: payloadSampleTypeId ? sampleTypeId : existingSample.sampleTypeId,
          originSiteId: payloadOriginSiteId ? sampleOriginSiteId : existingSample.originSiteId,
        })
    }
  }
  return { existingSample, sampleId }
}

// ----------------------------------------------------------
async function getSiteAdAssays(knex, payload, existingResult, deviceId) {
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

// ----------------------------------------------------------
function sanitizeResultData(obj) {
  const names = _.keys(obj)
  // sort all props by name
  names.sort()
  const objSortedByPropNames = _.reduce(
    names,
    (acc, propName) => {
      // remove all `date` props because they differ because of timezone shifts
      if (['testEndedOn', 'testStartedOn', 'messageSentOn', 'cartridgeExpirationDate'].includes(propName)) {
        return acc
      }
      let value = obj[propName]
      if (_.isPlainObject(value)) {
        value = sanitizeResultData(value)
      } else if (_.isArray(value)) {
        value = _.map(value, item => {
          if (_.isPlainObject(item)) {
            return sanitizeResultData(item)
          }
          return item
        })
      }
      acc[propName] = value
      return acc
    },
    {}
  )
  return objSortedByPropNames
}

// ----------------------------------------------------------
function getResultDataHash(obj) {
  const objSanitized = sanitizeResultData(obj)
  const objHash = crypto.createHash('md5').update(JSON.stringify(objSanitized)).digest('hex')
  return objHash
}

// ----------------------------------------------------------
async function mergeResult(knex, deviceId, payload, { now = new Date(), sampleId = null } = {}) {
  // Look up existing result matching external id if specified
  const existingResult = await getExistingResult(knex, payload, deviceId)

  // Select ResultType if specified, otherwise Patient
  const resultTypeId = await getResultTypeId(payload, existingResult)

  // Select Workflow Status if specified, otherwise Error or OK depending on error payload
  const resultWorkflowStatusId = await getResultWorkflowStatusId(knex, payload, existingResult)

  // Categories if specified, otherwise Error or Success depending on error payload
  const { categoryIds, resultCategory1, resultCategory2 } = await getResultCategories(payload, existingResult)

  //
  const { assays, site } = getSiteAdAssays(knex, payload, existingResult, deviceId)

  // exit on any error
  const requestErrors = await getResultErrors({ site, resultTypeId, resultCategory1, assays, categoryIds, payload })
  if (!_.isEmpty(requestErrors)) {
    throw Boom.badRequest(`Cannot find ${requestErrors.join(', ')}`)
  }

  const [assay] = assays

  // Select ResultSource if specified, otherwise from Assay
  const resultSourceId = await getResultSourceId(payload, existingResult, assay)

  let sampleTypeId = null
  const payloadSampleTypeId = _.get(payload, 'sample.type.id', false)
  if (payloadSampleTypeId) {
    sampleTypeId = await sampleTypeToId(payloadSampleTypeId)
    if (sampleTypeId == null) {
      throw Boom.badRequest(`Cannot find sample type ${payloadSampleTypeId}`)
    }
  }

  //
  const { sampleOriginSiteId, reportableSiteId, payloadOriginSiteId } = await getSiteIdVarieties(
    knex,
    payload,
    site,
    now
  )

  //
  const opts = { sampleTypeId, sampleOriginSiteId, payloadOriginSiteId, payloadSampleTypeId }
  const existingSampleDetails = await getExistingSample(knex, payload, existingResult, opts)
  ;({ sampleId } = existingSampleDetails)

  //
  const existingResultDataString = _.get(existingResult, 'resultData', null)
  const existingResultDataHash = _.get(existingResult, 'resultDataHash', null)
  const existingResultData = isJson(existingResultDataString) ? JSON.parse(existingResultDataString) : {}
  const resultData = payload.data ? deepMerge({ ...existingResultData }, payload.data) : existingResultData

  let shouldTriggerResultNotification = true
  let resultDataHash
  if (existingResultDataString && existingResultDataHash && payload.data) {
    /**
     * get hash of new resultData and if it is the same as already saved `resultDataHash` then
     * skip ResultUpdated notification because we already processed it
     */
    resultDataHash = getResultDataHash(resultData)
    if (existingResultDataHash === resultDataHash) {
      shouldTriggerResultNotification = false
    }
  }

  const existingResultPatientString = _.get(existingResult, 'patientData', null)
  const existingResultPatient = isJson(existingResultPatientString) ? JSON.parse(existingResultPatientString) : {}
  const patientData = _.has(payload, 'patient')
    ? JSON.stringify(deepMerge({ ...existingResultPatient }, payload.patient))
    : existingResultPatientString

  const oemData = _.has(payload, 'oemData') ? String(payload.oemData) : _.get(existingResult, 'oemData')

  const rawData = _.has(payload, 'rawData') ? String(payload.rawData) : _.get(existingResult, 'rawData')

  const gxAlertTestId = _.get(payload, 'gxAlertTestId')
  const gxAlertSyncedOn = gxAlertTestId ? now : null

  const result = {
    latitude: _.get(payload, 'location.latitude', _.get(existingResult, 'latitude', site.latitude)),
    longitude: _.get(payload, 'location.longitude', _.get(existingResult, 'longitude', site.longitude)),
    assayId: assay.id,
    assayVersion: _.get(payload, 'assay.version', _.get(existingResult, 'assayVersion', null)),
    resultTypeId,
    resultSourceId,
    sampleId,
    sampleRunNumber: _.get(payload, 'sample.runNumber', _.get(existingResult, 'sampleRunNumber', null)),
    sampleGroup: _.get(payload, 'sample.group', _.get(existingResult, 'sampleGroup', null)),
    resultCategory1,
    resultCategory2,
    resultData: JSON.stringify(resultData),
    resultDataHash,
    startedOn: _.get(payload, 'startedOn', _.get(existingResult, 'startedOn', null)),
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
    oemData,
    rawData,
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

    gxAlertTestId,
    gxAlertSyncedOn,
  }

  // Processed result contains result with additional fields
  // we want to insert but never update and will be passed to
  // plugins for further processing. It should contain all columns
  // from the Result table
  const processedResult = {
    externalId: payload.id,
    deviceId,
    partnerId: site.partnerId,
    geographyId: site.geographyId,
    siteId: site.id,
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
    // changeFlags: {
    //   sampleIdHasChanged: _.get(payload, 'sample.id', existingSample.externalId) !== existingSample.externalId,
    //   patientIdHasChanged: _.get(payload, 'patient.id', existingResultPatient.id) !== existingResultPatient.id,
    // },
  }
}

// ----------------------------------------------------------
async function getResult(knex, resultId) {
  const row = await knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('Sample as s', 'r.sampleId', 's.id')
    .leftJoin('SampleType as st', 's.sampleTypeId', 'st.id')
    .leftJoin('Site as sos', 's.originSiteId', 'sos.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('ResultType as rt', 'r.resultTypeId', 'rt.id')
    .leftJoin('ResultSource as rsc', 'r.resultSourceId', 'rsc.id')
    .leftJoin('ResultWorkflowLog as rsl', 'r.resultWorkflowStatusLogId', 'rsl.id')
    .leftJoin('ResultWorkflowStatus as rs', 'rsl.resultWorkflowStatusId', 'rs.id')
    .where('r.id', resultId)
    .first(
      'r.externalId as resultExternalId',
      'r.resultData',
      'r.formData',
      'r.patientData',
      'r.oemData',
      'r.startedOn',
      'r.endedOn',
      'r.updatedOn',
      'r.researchId',
      'r.notes',
      'r.senderVersion',
      'r.senderOperator',
      'r.errorCode',
      'r.errorNotes',
      'r.consumableSerial',
      'r.consumableExpirationDate',
      'r.consumableLot',
      'r.instrumentSerial',
      'r.moduleName',
      'r.moduleSerial',
      'r.id as resultId',
      'r.sampleGroup',
      'a.externalId as assayId',
      'r.assayVersion',
      'r.rawData',
      'r.latitude',
      'r.longitude',
      'rt.externalId as resultTypeId',
      'rsc.externalId as resultSourceId',
      'rs.externalId as resultWorkflowStatusId',
      'r.sampleRunNumber',
      's.externalId as sampleId',
      's.collectedOn as sampleCollectedOn',
      'sos.externalId as sampleOriginSiteId',
      'st.externalId as sampleTypeId',
      'rc1.externalId as category1Id',
      'rc2.externalId as category2Id'
    )

  if (row == null) {
    // TODO when is this null??
    return null
  }

  const resultWorkflowLog = await knex('ResultWorkflowLog')
    .where({ resultId: row.resultId })
    .orderBy('createdOn', 'desc')
    .orderBy('id', 'desc')
    .first('operator', 'changedOn')

  const result = { formData: null }

  if (row.resultExternalId != null) {
    result.id = row.resultExternalId
  }

  result.assay = { id: row.assayId }
  if (row.assayVersion != null) {
    result.assay.version = row.assayVersion
  }

  const location = { latitude: row.latitude, longitude: row.longitude }
  if (location.latitude != null || location.longitude != null) {
    result.location = location
  }
  result.type = { id: row.resultTypeId }
  result.source = { id: row.resultSourceId }
  result.workflow = { status: { id: row.resultWorkflowStatusId } }
  if (resultWorkflowLog) {
    result.workflow.changedOn = resultWorkflowLog.changedOn
    if (resultWorkflowLog.operator != null) {
      result.workflow.operator = resultWorkflowLog.operator
    }
  }

  const sample = {}
  if (row.sampleId != null) {
    sample.id = row.sampleId
  }

  if (row.sampleCollectedOn != null) {
    sample.collectedOn = row.sampleCollectedOn
  }
  if (row.sampleTypeId != null) {
    sample.type = { id: row.sampleTypeId }
  }
  if (row.sampleOriginSiteId != null) {
    sample.originSite = { id: row.sampleOriginSiteId }
  }
  if (row.sampleGroup != null) {
    sample.group = row.sampleGroup
  }
  if (row.sampleRunNumber != null) {
    sample.runNumber = row.sampleRunNumber
  }
  if (!_.isEmpty(sample)) {
    result.sample = sample
  }

  const categories = []
  if (row.category1Id != null) {
    categories.push({ id: row.category1Id })
  }
  if (row.category2Id != null) {
    categories.push({ id: row.category2Id })
  }
  if (categories.length > 0) {
    result.category = categories
  }

  result.data = JSON.parse(row.resultData)
  if (row.formData != null) {
    result.formData = JSON.parse(row.formData)
  }

  if (row.startedOn != null) {
    result.startedOn = row.startedOn
  }

  if (row.endedOn != null) {
    result.endedOn = row.endedOn
  }

  const consumable = {
    serial: row.consumableSerial,
    lot: row.consumableLot,
    expirationDate: row.consumableExpirationDate,
  }
  if (consumable.serial != null || consumable.lot != null || consumable.expirationDate != null) {
    result.consumable = [consumable]
  }

  const instrument = { serial: row.instrumentSerial }
  const module = { name: row.moduleName, serial: row.moduleSerial }
  if (module.name != null || module.serial != null) {
    instrument.module = module
  }

  if (instrument.serial != null || instrument.module != null) {
    result.instrument = instrument
  }

  const research = { id: row.researchId }
  if (research.id != null) {
    result.research = research
  }

  if (row.patientData != null) {
    result.patient = JSON.parse(row.patientData)
  }

  if (row.oemData != null) {
    result.oemData = row.oemData
  }

  if (row.rawData != null) {
    result.rawData = row.rawData
  }

  const sender = { version: row.senderVersion, operator: row.senderOperator }
  if (sender.version != null || sender.operator != null) {
    result.sender = sender
  }
  if (row.notes != null) {
    result.notes = row.notes
  }

  const error = { code: row.errorCode, notes: row.errorNotes }
  if (error.code != null || error.notes != null) {
    result.error = error
  }

  return result
}

async function postProcessMergeResult(context, result, previousResult) {
  const { knex, payload, now } = context

  await addResultWorkflowLogIfChanged(knex, payload, result, previousResult, 'Device API Update', now)

  await resolveAutoTagging(knex, result)
  // // TODO ASP-355 consume inventory using a message listener instead
  // // of within plugin/same transaction
  await consumeInventoryForResult(knex, payload, result)
  return {}
}

/**
 * Consumes inventory for the new result
 */
async function consumeInventoryForResult(knex, payload, result) {
  // TODO ASP-355 Move consumeInventory for Result to listener
  // Update Inventory Levels at Site
  const consumablesInResultData = _.isEmpty(payload.consumable) ? [] : payload.consumable
  await inventory.consumeInventoryForResult(
    result.id,
    result.assayId,
    result.siteId,
    consumablesInResultData,
    result.partnerId,
    result.startedOn,
    result.endedOn,
    knex
  )
}

const getTags = (regExp, field) => {
  const re = new RegExp(regExp, 'g')
  return field && field !== '' ? field.toString().match(re) : []
}

async function resolveAutoTagging(knex, result) {
  const country = await getCountryByDeviceId(knex, result.deviceId)

  // taggingResults is array of strings ['']
  const taggingResults = getAllResultTags(country, result)
  // existingTags is array [{ id: number, title: 'string' }]
  const existingTags = await getExistingTagByPartner(knex, result.partnerId, taggingResults, result.id)

  const tagsToBeAdded = _.uniqBy(_.filter(taggingResults, tag => !includesIgnoreCase(existingTags, tag)))

  const tagsToBeUpdated = _.uniqBy(
    _.filter(existingTags, tag =>
      includesIgnoreCase(
        taggingResults.map(title => ({ title })),
        tag.title
      )
    )
  )

  _.map(tagsToBeAdded, async tag => {
    const [tagId] = await knex('Tag').insert({
      title: tag,
      partnerId: result.partnerId,
    })
    await knex('ResultTag').insert({
      tagId,
      resultId: result.id,
    })
  })
  _.map(tagsToBeUpdated, async elem => {
    await knex('ResultTag').insert({
      tagId: elem.id,
      resultId: result.id,
    })
  })
}

function includesIgnoreCase(collection, value) {
  return _.some(collection, item => item.title.toLowerCase() === value.toLowerCase())
}

async function getCountryByDeviceId(knex, deviceId) {
  return knex('Device as d')
    .join('Geography as g', 'd.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .where('d.id', deviceId)
    .first()
}

function getAllResultTags(country, result) {
  let taggingResults = []
  let res = []
  if (country) {
    if (country.tagRegexSampleId && country.tagRegexSampleId !== '') {
      res = getTags(country.tagRegexSampleId, result.sampleId)

      if (res) taggingResults = taggingResults.concat(res)
    }

    if (country.tagRegexNotes && country.tagRegexNotes !== '') {
      res = getTags(country.tagRegexNotes, result.notes)
      if (res) taggingResults = taggingResults.concat(res)
    }
    const patientData = JSON.parse(result.patientData)
    if (patientData && country.tagRegexPatientId && country.tagRegexPatientId !== '') {
      res = getTags(country.tagRegexPatientId, patientData.id)
      if (res) taggingResults = taggingResults.concat(res)
    }
  }
  return _.uniqBy(taggingResults)
}

async function getExistingTagByPartner(knex, partnerId, taggingResults, resultId) {
  return knex('Tag as t')
    .join('ResultTag as rt', 't.id', 'rt.tagId')
    .select('t.id', 't.title')
    .distinct('t.id', 't.title')
    .where('t.partnerId', partnerId)
    .whereNot('rt.resultId', resultId)
    .whereIn('t.title', taggingResults)
}

async function addResultWorkflowLogIfChanged(
  knex,
  payload,
  result,
  previousResult,
  reason,
  now = new Date(),
  changedOn
) {
  // Log Result Workflow Update if any field changed
  let resultWorkflowChanged = !previousResult || previousResult.resultWorkflowStatusId !== result.resultWorkflowStatusId
  let latestResultWorkflowLog
  if (!resultWorkflowChanged && (_.has(payload, 'workflow.operator') || _.has(payload, 'workflow.changedOn'))) {
    // check to see if operator or changedOn is different from latest log
    latestResultWorkflowLog = await getLatestResultWorkflowLog(knex, result.id)
    resultWorkflowChanged =
      !latestResultWorkflowLog ||
      _.get(payload, 'workflow.operator', null) !== latestResultWorkflowLog.operator ||
      +_.get(payload, 'workflow.changedOn', NaN) !== +latestResultWorkflowLog.changedOn
  }
  if (!resultWorkflowChanged && changedOn) {
    // check to see if specified changedOn is different from latest log
    if (!latestResultWorkflowLog) {
      latestResultWorkflowLog = await getLatestResultWorkflowLog(knex, result.id)
    }
    resultWorkflowChanged = !latestResultWorkflowLog || +changedOn !== +latestResultWorkflowLog.changedOn
  }
  const device = await getDevice(result.deviceId)
  if (resultWorkflowChanged) {
    const [lastLogId] = await knex('ResultWorkflowLog').insert({
      resultId: result.id,
      resultWorkflowStatusId: result.resultWorkflowStatusId || (await resultWorkflowStatusToId('OK')),
      reason: reason || 'Device Api Update',
      operator: _.get(payload, 'workflow.operator', null) || _.get(payload, 'sender.operator', null) || device.name,
      changedOn: _.get(payload, 'workflow.changedOn', changedOn || now),
      createdOn: now,
    })
    await knex('Result').where('id', result.id).update({ resultWorkflowStatusLogId: lastLogId })
  }
  return resultWorkflowChanged
}

async function updateResultWorkflowStatus(knex, resultId, workflowStatusExternalId, reason, now = new Date()) {
  // get internal workflow status id based on the external id we got
  const resultWorkflowStatusId = await resultWorkflowStatusToId(workflowStatusExternalId)
  if (resultWorkflowStatusId === null) {
    throw new Error(`Workflow status with external ID "${workflowStatusExternalId}" not found`)
  }

  const [lastLogId] = await knex('ResultWorkflowLog').insert({
    resultId,
    resultWorkflowStatusId: resultWorkflowStatusId || (await resultWorkflowStatusToId('OK')),
    reason,
    changedOn: now,
    createdOn: now,
  })

  await knex('Result').where('id', resultId).update({ resultWorkflowStatusLogId: lastLogId })

  return {}
}

async function getLatestResultWorkflowLog(knex, resultId) {
  const latestResultWorkFlowLog = await knex('ResultWorkflowLog')
    .where({ resultId })
    .orderBy('createdOn', 'desc')
    .orderBy('id', 'desc')
    .first('operator', 'changedOn', 'resultWorkflowStatusId')
  return latestResultWorkFlowLog
}

module.exports = {
  mergeResult,
  getResult,
  postProcessMergeResult,
  consumeInventoryForResult,
  addResultWorkflowLogIfChanged,
  updateResultWorkflowStatus,
  getAllResultTags,
}
