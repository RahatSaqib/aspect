const Boom = require('boom')
const _ = require('lodash')
const { addResultConstraints } = require('./common')

const DONOT_LOG_DELIVERED = ['Delivered', 'Acknowledged', 'Flagged', 'Error']
const DELIVERED_EXTERNALID = 'Delivered'
const ACKNOWLEDGED_EXTERNALID = 'Acknowledged'

const millisInDay = 1000 * 60 * 60 * 24

function* addResult(initialContext) {
  const context = yield* initialContext.withTransformedResultPayload()
  const { knex, now, payload } = context

  // Look up existing result matching external id if specified
  let existingResult = null
  if (payload.id) {
    const existingResults = yield knex('Result as r')
      .where({ 'r.externalId': payload.id })
      .innerJoin('Device as d', 'r.deviceId', 'd.id')
      .leftJoin('Sample as s', 'r.sampleId', 's.id')
      .modify(addResultConstraints, context, {
        device: 'd',
        result: 'r',
        sample: 's',
      })
      .distinct('r.*')
      .limit(2)
    if (existingResults.length > 1) {
      return Boom.badRequest(`Cannot find unique result with id ${payload.id}`)
    }
    existingResult = existingResults[0]
  }
  const deviceId = existingResult ? existingResult.deviceId : context.device.id

  const assayQ = knex('Assay as a')
    .join('Device as d', 'a.deviceTypeId', 'd.deviceTypeId')
    .where({ 'd.id': deviceId })
    .limit(2)
    .select('a.id', 'a.externalId')
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
  const resultTypeQ = knex('ResultType as rt').first('rt.id')
  if (_.has(payload, 'type.id')) {
    resultTypeQ.where({ 'rt.externalId': _.get(payload, 'type.id') })
  } else if (existingResult) {
    resultTypeQ.where({ 'rt.id': existingResult.resultTypeId })
  } else {
    resultTypeQ.where({ 'rt.externalId': 'Patient' })
  }

  // Select ResultSource if specified, otherwise Diagnostic Device
  const resultSourceQ = knex('ResultSource as rs').first('rs.id')
  if (_.has(payload, 'source.id')) {
    resultSourceQ.where({ 'rs.externalId': _.get(payload, 'source.id') })
  } else if (existingResult) {
    resultSourceQ.where({ 'rs.id': existingResult.resultSourceId })
  } else {
    resultSourceQ.where({ 'rs.externalId': 'DiagnosticDevice' })
  }

  // Select Workflow Status if specified, otherwise Error or OK depending on error payload
  const resultWorkflowStatusQ = knex('ResultWorkflowStatus as rs').first(
    'rs.id'
  )
  if (_.has(payload, 'workflow.status.id')) {
    resultWorkflowStatusQ.where({
      'rs.externalId': _.get(payload, 'workflow.status.id'),
    })
  } else if (payload.error) {
    resultWorkflowStatusQ.where({ 'rs.externalId': 'Error' })
  } else if (existingResult) {
    resultWorkflowStatusQ.where({
      'rs.id': existingResult.resultWorkflowStatusId,
    })
  } else {
    resultWorkflowStatusQ.where({ 'rs.externalId': 'OK' })
  }

  // Categories if specified, otherwise Error or Success depending on error payload
  const categoryQ = knex('ResultCategory as rc').select('rc.id')
  const categoryIds = _.compact(_.map(payload.category, 'id'))
  if (categoryIds.length > 0) {
    categoryQ.whereIn('rc.externalId', categoryIds)
  } else if (payload.error) {
    categoryQ.where({ 'rc.externalId': 'Error' })
  } else if (existingResult) {
    categoryQ.whereIn(
      'rc.id',
      _.compact([
        existingResult.resultCategory1,
        existingResult.resultCategory2,
      ])
    )
  } else {
    categoryQ.where({ 'rc.externalId': 'Success' })
  }

  const [
    assays,
    site,
    resultType,
    resultSource,
    resultWorkflowStatus,
    categories,
  ] = yield Promise.all([
    assayQ,
    siteQ,
    resultTypeQ,
    resultSourceQ,
    resultWorkflowStatusQ,
    categoryQ,
  ])

  if (
    !site ||
    !resultType ||
    !resultSource ||
    !resultWorkflowStatus ||
    categories.length === 0 ||
    assays.length !== 1
  ) {
    const requestErrors = []
    if (!site) {
      requestErrors.push('assigned site for device')
    }
    if (!resultType) {
      requestErrors.push(`result type with id ${_.get(payload, 'type.id')}`)
    }
    if (!resultSource) {
      requestErrors.push(`result source with id ${_.get(payload, 'source.id')}`)
    }
    if (!resultWorkflowStatus) {
      requestErrors.push(
        `result workflow status id ${_.get(payload, 'workflow.status.id')}`
      )
    }
    if (categories.length === 0) {
      requestErrors.push(`result categories with ids ${categoryIds.join(' ')}`)
    }
    if (assays.length !== 1) {
      requestErrors.push(`assay with id ${_.get(payload, 'assay.id')}`)
    }
    return Boom.badRequest(`Cannot find ${requestErrors.join(', ')}`)
  }

  const assay = assays[0]

  let sampleTypeId = null
  const payloadSampleTypeId = _.get(payload, 'sample.type.id', false)
  if (payloadSampleTypeId) {
    sampleTypeId = (yield knex('SampleType')
      .where({ externalId: payloadSampleTypeId })
      .first('id')).id
  }

  let sampleOriginSiteId = site.id
  const payloadOriginSiteId = _.get(payload, 'sample.originSite.id', false)
  if (payloadOriginSiteId) {
    sampleOriginSiteId = (yield knex('Site')
      .where({ partnerId: site.partnerId, externalId: payloadOriginSiteId })
      .first('id')).id
  }

  let sampleId
  if (!existingResult) {
    ;[sampleId] = yield knex('Sample').insert({
      externalId: _.get(payload, 'sample.id', null),
      collectedOn: _.get(payload, 'sample.collectedOn', null),
      sampleTypeId,
      originSiteId: sampleOriginSiteId,
    })
  } else {
    sampleId = existingResult.sampleId
    if (_.has(payload, 'sample')) {
      const existingSample = yield knex('Sample')
        .where({ id: sampleId })
        .first('externalId', 'collectedOn', 'sampleTypeId', 'originSiteId')
      yield knex('Sample').where({ id: sampleId }).update({
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

  // TODO should we merge within patient or result data payload?
  const resultData = _.has(payload, 'data')
    ? JSON.stringify(payload.data)
    : _.get(existingResult, 'resultData', null)

  const patientData = _.has(payload, 'patient')
    ? JSON.stringify(payload.patient)
    : _.get(existingResult, 'patientData')

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
    resultTypeId: resultType.id,
    resultSourceId: resultSource.id,
    resultWorkflowStatusId: resultWorkflowStatus.id,
    sampleId,
    sampleRunNumber: _.get(
      payload,
      'sample.runNumber',
      _.get(existingResult, 'sampleRunNumber', null)
    ),
    sampleGroup: _.get(
      payload,
      'sampleGroup',
      _.get(existingResult, 'sampleGroup', null)
    ),
    resultCategory1: _.get(categories, '[0].id', null),
    resultCategory2: _.get(categories, '[1].id', null),
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
    yield knex('Result').where({ id: resultId }).update(result)
  } else {
    ;[resultId] = yield knex('Result').insert(processedResult)
  }
  processedResult.id = resultId

  yield* context.postProcessResult(processedResult, existingResult)

  return {}
}

function* getResult(context) {
  const { knex, deviceLog } = context

  const resultQuery = knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('DeviceLog as dl', 'dl.resultId', 'r.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin('Sample as s', 'r.sampleId', 's.id')
    .leftJoin('SampleType as st', 's.sampleTypeId', 'st.id')
    .leftJoin('Site as sos', 's.originSiteId', 'sos.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('ResultType as rt', 'r.resultTypeId', 'rt.id')
    .leftJoin('ResultSource as rsc', 'r.resultSourceId', 'rsc.id')
    .leftJoin('ResultWorkflowStatus as rs', 'r.resultWorkflowStatusId', 'rs.id')
    .leftJoin('Partner as p', 'd.partnerId', 'p.id')
    .where('dl.id', deviceLog.id)
    .where('r.qcCheck', 1)
    .first(
      'r.externalId as resultExternalId',
      'r.resultData',
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
      'rc2.externalId as category2Id',
      'p.autoAcknowledgeOlderThanDays',
      'p.numberToLeaveUnacknowledged'
    )

  const row = yield resultQuery
  if (row == null) {
    return null
  }

  // only set to delivered the first time and
  // only if NOT acknowledged or flagged already
  if (_.indexOf(DONOT_LOG_DELIVERED, row.resultWorkflowStatusId) === -1) {
    yield* updateResultWorkflowStatus(
      context,
      row.resultId,
      DELIVERED_EXTERNALID
    )
    row.resultWorkflowStatusId = DELIVERED_EXTERNALID

    row.resultWorkflowStatusId = yield* autoAcknowledgeResultBasedOnPartnerRules(
      context,
      row,
      row
    )
  }

  const resultWorkflowLog = yield* getLatestResultWorkflowLog(
    knex,
    row.resultId
  )

  const result = {}

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

function* autoAcknowledgeResultBasedOnPartnerRules(
  context,
  resultDetails,
  partnerAutoAcknowledgeRules
) {
  const { knex, query } = context
  const {
    resultId,
    endedOn: testEndedOn,
    sampleOriginSiteId: sampleOriginSiteExternalId,
    resultWorkflowStatusId: currentResultWorkflowStatusId,
  } = resultDetails
  const {
    autoAcknowledgeOlderThanDays,
    numberToLeaveUnacknowledged,
  } = partnerAutoAcknowledgeRules

  let workflowStatus = currentResultWorkflowStatusId

  // Is this a historical sync and
  // do we have an end date for the test?
  // are auto acknowledge rules setup for partner?
  const offset = Number(query.offset)
  if (
    offset < 0 &&
    testEndedOn &&
    (autoAcknowledgeOlderThanDays || numberToLeaveUnacknowledged)
  ) {
    // At what age should a result be auto acknowledged?
    const autoAcknowledgeOlderThan = autoAcknowledgeOlderThanDays
      ? new Date(+new Date() - autoAcknowledgeOlderThanDays * millisInDay)
      : null
    if (testEndedOn < autoAcknowledgeOlderThan) {
      // Are there NO results that are more recent
      // than the auto acknowledgement cutoff date?
      const allResultsBeingSynced = yield knex('Result as r')
        .innerJoin('Sample as s', 'r.sampleId', 's.id')
        .innerJoin('Site as sos', 's.originSiteId', 'sos.id')
        .innerJoin(
          'ResultWorkflowStatus as rs',
          'r.resultWorkflowStatusId',
          'rs.id'
        )
        .where('sos.externalId', sampleOriginSiteExternalId)
        .where('r.qcCheck', 1)
        .orderBy('r.endedOn', 'desc') // TODO: What if results have already been acknowledged?
        .select('r.id', 'r.endedOn')
      if (
        !_.some(
          allResultsBeingSynced,
          result => result.endedOn > autoAcknowledgeOlderThan
        )
      ) {
        // Is this NOT one of the top results on the list
        // that should be left unacknowledged so that
        // the results list on the reporter isn't empty?
        const resultsToLeaveUnacknowledged = _.take(
          allResultsBeingSynced,
          numberToLeaveUnacknowledged
        )
        if (
          !_.some(
            resultsToLeaveUnacknowledged,
            result => result.id === resultId
          )
        ) {
          yield* updateResultWorkflowStatus(
            context,
            resultId,
            ACKNOWLEDGED_EXTERNALID
          )
          workflowStatus = ACKNOWLEDGED_EXTERNALID
        }
      }
    }
  }
  return yield new Promise(resolve => resolve(workflowStatus))
}

function* updateResultWorkflowStatus(
  context,
  resultId,
  workflowStatusExternalId,
  reason
) {
  const { knex, now } = context

  // get internal workflow status id based on the external id we got
  const workflowStatusRow = yield knex('ResultWorkflowStatus')
    .where('externalId', workflowStatusExternalId)
    .select('id')
    .first()
  if (workflowStatusRow === null) {
    throw new Error(
      `Workflow status with external ID "${workflowStatusExternalId}" not found`
    )
  }

  // update result
  const rows = yield knex('Result as r')
    .where('r.id', resultId)
    .update('resultWorkflowStatusId', workflowStatusRow.id)

  // keep log if update was successful. don't need to check permission again because
  // rows would be 0 if no permission in query above
  if (rows) {
    yield knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: workflowStatusRow.id,
      reason,
      changedOn: now,
      createdOn: now,
    })
  }

  return {}
}

function* getLatestResultWorkflowLog(knex, resultId) {
  return yield knex('ResultWorkflowLog')
    .where({ resultId })
    .orderBy('createdOn', 'desc')
    .orderBy('id', 'desc')
    .first('operator', 'changedOn')
}

module.exports = {
  addResult,
  getResult,
}
