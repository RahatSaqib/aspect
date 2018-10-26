const Boom = require('boom')
const _ = require('lodash')

const { isJson, deepMerge } = require('../shared/json')
const {
  resultSourceToId,
  resultCategoryToId,
  resultTypeToId,
  resultWorkflowStatusToId,
  sampleTypeToId,
} = require('../shared/dictionary')

const inventory = require('../inventory/service')

async function mergeResult(
  knex,
  deviceId,
  payload,
  { now = new Date(), sampleId = null } = {}
) {
  // Look up existing result matching external id if specified
  let existingResult = null
  if (payload.id) {
    existingResult = await knex('Result as r')
      .where({
        'r.externalId': payload.id,
        'r.deviceId': deviceId,
      })
      .first()
  }

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
    .where({ 'd.id': deviceId })
    .first('s.id', 's.partnerId', 's.geographyId', 's.latitude', 's.longitude')

  // Select ResultType if specified, otherwise Patient
  let resultTypeId = null
  if (_.has(payload, 'type.id')) {
    resultTypeId = await resultTypeToId(_.get(payload, 'type.id'))
  } else if (existingResult) {
    ;({ resultTypeId } = existingResult)
  } else {
    resultTypeId = await resultTypeToId('Patient')
  }

  // Select Workflow Status if specified, otherwise Error or OK depending on error payload
  let resultWorkflowStatusId = null
  if (_.has(payload, 'workflow.status.id')) {
    resultWorkflowStatusId = await resultWorkflowStatusToId(
      _.get(payload, 'workflow.status.id', '')
    )
  } else if (payload.error) {
    resultWorkflowStatusId = await resultWorkflowStatusToId('Error')
  } else if (existingResult) {
    ;({ resultWorkflowStatusId } = existingResult)
  } else {
    resultWorkflowStatusId = await resultWorkflowStatusToId('OK')
  }

  // Categories if specified, otherwise Error or Success depending on error payload
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
    ;({ resultCategory2 } = existingResult)
  }

  const [assays, site] = await Promise.all([assayQ, siteQ])

  if (
    !site ||
    !resultTypeId ||
    !resultWorkflowStatusId ||
    !resultCategory1 ||
    assays.length !== 1
  ) {
    const requestErrors = []
    if (!site) {
      requestErrors.push('assigned site for device')
    }
    if (!resultTypeId) {
      requestErrors.push(`result type with id ${_.get(payload, 'type.id')}`)
    }
    if (!resultWorkflowStatusId) {
      requestErrors.push(
        `result workflow status id ${_.get(payload, 'workflow.status.id')}`
      )
    }
    if (!resultCategory1) {
      requestErrors.push(`result categories with ids ${categoryIds.join(' ')}`)
    }
    if (assays.length !== 1) {
      requestErrors.push(`assay with id ${_.get(payload, 'assay.id')}`)
    }
    throw Boom.badRequest(`Cannot find ${requestErrors.join(', ')}`)
  }

  const assay = assays[0]

  // Select ResultSource if specified, otherwise from Assay
  let resultSourceId = null
  if (_.has(payload, 'source.id')) {
    resultSourceId = await resultSourceToId(_.get(payload, 'source.id', ''))
    if (!resultSourceId) {
      throw Boom.badRequest(
        `Cannot find result source with id ${_.get(payload, 'source.id')}`
      )
    }
  } else if (existingResult) {
    ;({ resultSourceId } = existingResult)
  } else {
    ;({ resultSourceId } = assay)
  }

  let sampleTypeId = null
  const payloadSampleTypeId = _.get(payload, 'sample.type.id', false)
  if (payloadSampleTypeId) {
    sampleTypeId = await sampleTypeToId(payloadSampleTypeId)
    if (sampleTypeId == null) {
      throw Boom.badRequest(`Cannot find sample type ${payloadSampleTypeId}`)
    }
  }

  let sampleOriginSiteId = site.id
  const payloadOriginSiteId = _.get(payload, 'sample.originSite.id', false)
  if (payloadOriginSiteId) {
    const sampleOriginSite = await knex('Site')
      .where({ partnerId: site.partnerId, externalId: payloadOriginSiteId })
      .first('id')
    if (sampleOriginSite == null) {
      throw Boom.badRequest(
        `Cannot find Sample origin site ${payloadOriginSiteId}`
      )
    }
    sampleOriginSiteId = sampleOriginSite.id
  }

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
      const existingSample =
        (await knex('Sample')
          .where({ id: sampleId })
          .first(
            'externalId',
            'collectedOn',
            'sampleTypeId',
            'originSiteId'
          )) || {}
      await knex('Sample')
        .where({ id: sampleId })
        .update({
          externalId: _.get(payload, 'sample.id', existingSample.externalId),
          collectedOn: _.get(
            payload,
            'sample.collectedOn',
            _.get(existingSample, 'collectedOn', null)
          ),
          sampleTypeId: payloadSampleTypeId
            ? sampleTypeId
            : existingSample.sampleTypeId,
          originSiteId: payloadOriginSiteId
            ? sampleOriginSiteId
            : existingSample.originSiteId,
        })
    }
  }

  const existingResultDataString = _.get(existingResult, 'resultData', null)
  const existingResultData = isJson(existingResultDataString)
    ? JSON.parse(existingResultDataString)
    : {}

  const resultData = _.has(payload, 'data')
    ? JSON.stringify(deepMerge(existingResultData, payload.data))
    : existingResultDataString

  const existingResultPatientString = _.get(existingResult, 'patientData', null)
  const existingResultPatient = isJson(existingResultPatientString)
    ? JSON.parse(existingResultPatientString)
    : {}
  const patientData = _.has(payload, 'patient')
    ? JSON.stringify(deepMerge(existingResultPatient, payload.patient))
    : existingResultPatientString

  const oemData = _.has(payload, 'oemData')
    ? String(payload.oemData)
    : _.get(existingResult, 'oemData')

  const rawData = _.has(payload, 'rawData')
    ? String(payload.rawData)
    : _.get(existingResult, 'rawData')

  const result = {
    latitude: _.get(
      payload,
      'location.latitude',
      _.get(existingResult, 'latitude', site.latitude)
    ),
    longitude: _.get(
      payload,
      'location.longitude',
      _.get(existingResult, 'longitude', site.longitude)
    ),
    assayId: assay.id,
    assayVersion: _.get(
      payload,
      'assay.version',
      _.get(existingResult, 'assayVersion', null)
    ),
    resultTypeId,
    resultSourceId,
    resultWorkflowStatusId,
    sampleId,
    sampleRunNumber: _.get(
      payload,
      'sample.runNumber',
      _.get(existingResult, 'sampleRunNumber', null)
    ),
    sampleGroup: _.get(
      payload,
      'sample.group',
      _.get(existingResult, 'sampleGroup', null)
    ),
    resultCategory1,
    resultCategory2,
    resultData,
    startedOn: _.get(
      payload,
      'startedOn',
      _.get(existingResult, 'startedOn', null)
    ),
    endedOn: _.get(payload, 'endedOn', _.get(existingResult, 'endedOn', null)),
    consumableSerial: _.get(
      payload,
      'consumable[0].serial',
      _.get(existingResult, 'consumableSerial', null)
    ),
    consumableExpirationDate: _.get(
      payload,
      'consumable[0].expirationDate',
      _.get(existingResult, 'consumableExpirationDate', null)
    ),
    consumableLot: _.get(
      payload,
      'consumable[0].lot',
      _.get(existingResult, 'consumableLot', null)
    ),
    instrumentSerial: _.get(
      payload,
      'instrument.serial',
      _.get(existingResult, 'instrumentSerial', null)
    ),
    moduleSerial: _.get(
      payload,
      'instrument.module.serial',
      _.get(existingResult, 'moduleSerial', null)
    ),
    moduleName: _.get(
      payload,
      'instrument.module.name',
      _.get(existingResult, 'moduleName', null)
    ),
    oemData,
    rawData,
    researchId: _.get(
      payload,
      'research.id',
      _.get(existingResult, 'researchId', null)
    ),
    patientData,
    senderVersion: _.get(
      payload,
      'sender.version',
      _.get(existingResult, 'senderVersion', null)
    ),
    senderOperator: _.get(
      payload,
      'sender.operator',
      _.get(existingResult, 'senderOperator', null)
    ),
    notes: _.get(payload, 'notes', _.get(existingResult, 'notes', null)),
    errorCode: _.get(
      payload,
      'error.code',
      _.get(existingResult, 'errorCode', null)
    ),
    errorNotes: _.get(
      payload,
      'error.notes',
      _.get(existingResult, 'errorNotes', null)
    ),
    updatedOn: now,
    createdOn: _.get(existingResult, 'createdOn', now),
  }

  // Processed result contains result with additional fields
  // we want to insert but never update and will be passed to
  // plugins for further processing. It should contain all columns
  // from the Result table
  const processedResult = Object.assign(
    {
      externalId: payload.id,
      deviceId,
      partnerId: site.partnerId,
      geographyId: site.geographyId,
      siteId: site.id,
      createdOn: now,
    },
    result
  )

  let resultId
  if (existingResult) {
    resultId = existingResult.id
    await knex('Result')
      .where({ id: resultId })
      .update(result)
  } else {
    ;[resultId] = await knex('Result').insert(processedResult)
  }
  processedResult.id = resultId
  return { processedResult, existingResult }
}

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
    .leftJoin('ResultWorkflowStatus as rs', 'r.resultWorkflowStatusId', 'rs.id')
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
  if (
    consumable.serial != null ||
    consumable.lot != null ||
    consumable.expirationDate != null
  ) {
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
  return {}
}

/**
 * Consumes inventory for the new result
 */
async function consumeInventoryForResult(knex, payload, result) {
  // TODO ASP-355 Move consumeInventory for Result to listener
  // Update Inventory Levels at Site
  const consumablesInResultData = _.isEmpty(payload.consumable)
    ? []
    : payload.consumable
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
  let resultWorkflowChanged =
    !previousResult ||
    previousResult.resultWorkflowStatusId !== result.resultWorkflowStatusId
  let latestResultWorkflowLog
  if (
    !resultWorkflowChanged &&
    (_.has(payload, 'workflow.operator') ||
      _.has(payload, 'workflow.changedOn'))
  ) {
    // check to see if operator or changedOn is different from latest log
    latestResultWorkflowLog = await getLatestResultWorkflowLog(knex, result.id)
    resultWorkflowChanged =
      !latestResultWorkflowLog ||
      _.get(payload, 'workflow.operator', null) !==
        latestResultWorkflowLog.operator ||
      +_.get(payload, 'workflow.changedOn', NaN) !==
        +latestResultWorkflowLog.changedOn
  }
  if (!resultWorkflowChanged && changedOn) {
    // check to see if specified changedOn is different from latest log
    if (!latestResultWorkflowLog) {
      latestResultWorkflowLog = await getLatestResultWorkflowLog(knex, result.id)
    }
    resultWorkflowChanged =
      !latestResultWorkflowLog ||
      +changedOn !== +latestResultWorkflowLog.changedOn
  }

  if (resultWorkflowChanged) {
    await knex('ResultWorkflowLog').insert({
      resultId: result.id,
      resultWorkflowStatusId: result.resultWorkflowStatusId,
      reason,
      operator:
        _.get(payload, 'workflow.operator', null) ||
        _.get(payload, 'sender.operator', null),
      changedOn: _.get(payload, 'workflow.changedOn', changedOn || now),
      createdOn: now,
    })
  }
  return resultWorkflowChanged
}

async function updateResultWorkflowStatus(
  knex,
  resultId,
  workflowStatusExternalId,
  reason,
  now = new Date()
) {
  // get internal workflow status id based on the external id we got
  const resultWorkflowStatusId = await resultWorkflowStatusToId(
    workflowStatusExternalId
  )
  if (resultWorkflowStatusId === null) {
    throw new Error(
      `Workflow status with external ID "${workflowStatusExternalId}" not found`
    )
  }

  // update result
  const rows = await knex('Result as r')
    .where('r.id', resultId)
    .update({ resultWorkflowStatusId })

  // keep log if update was successful. don't need to check permission again because
  // rows would be 0 if no permission in query above
  if (rows) {
    await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId,
      reason,
      changedOn: now,
      createdOn: now,
    })
  }

  return {}
}

async function getLatestResultWorkflowLog(knex, resultId) {
  const latestResultWorkFlowLog = await knex('ResultWorkflowLog')
    .where({ resultId })
    .orderBy('createdOn', 'desc')
    .orderBy('id', 'desc')
    .first('operator', 'changedOn')
  return latestResultWorkFlowLog
}

module.exports = {
  mergeResult,
  getResult,
  postProcessMergeResult,
  consumeInventoryForResult,
  addResultWorkflowLogIfChanged,
  updateResultWorkflowStatus,
}
