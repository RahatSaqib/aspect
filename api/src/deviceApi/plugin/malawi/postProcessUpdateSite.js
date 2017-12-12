const { notifyResultUpdated } = require('../../../messages')
const { mergeResult, getResult } = require('../../result')
const { addResultWorkflowLogIfChanged } = require('../common')

const DEVICE_TYPE_CHAI = 'CHAILIMS'
const DEVICE_TYPE_REPORTER = 'AspectReporter'

const DELIVERABLE_EXTERNALID = 'Deliverable'
const DELIVERED_EXTERNALID = 'Delivered'
const ACKNOWLEDGED_EXTERNALID = 'Acknowledged'
const FLAGGED_EXTERNALID = 'Flagged'
const ERROR_EXTERNALID = 'Error'
const PURGED_EXTERNALID = 'Purged'

const MERGEABLE_CHAI_IDS = [
  DELIVERABLE_EXTERNALID,
  DELIVERED_EXTERNALID,
  ACKNOWLEDGED_EXTERNALID,
  FLAGGED_EXTERNALID,
  ERROR_EXTERNALID,
]

const millisInDay = 1000 * 60 * 60 * 24

function* postProcessUpdateSite(context, site, previousSite) {
  const { knex, dispatch, deviceId, deviceType, now } = context
  if (deviceType === DEVICE_TYPE_REPORTER && site.id !== previousSite.id) {
    yield* purgePreviousResults(knex, dispatch, deviceId, now)
    yield* generateHistoricalResults(knex, dispatch, deviceId, site.id, now)
  }
}

function* purgePreviousResults(knex, dispatch, deviceId, now) {
  const { id: purgedStatusId } = yield knex('ResultWorkflowStatus')
    .where({ externalId: PURGED_EXTERNALID })
    .first('id')
  yield knex('Result')
    .where({ deviceId })
    .update({ resultWorkflowStatusId: purgedStatusId })
  const resultIds = yield knex('Result as r')
    .join('Device as d', 'r.deviceId', 'd.id')
    .where({
      'd.id': deviceId,
      'r.resultWorkflowStatusId': purgedStatusId,
    })
    .select('r.id as resultId', 'd.name as deviceName')
  const payload = { resultWorkflowStatus: PURGED_EXTERNALID }
  for (const { resultId, deviceName } of resultIds) {
    yield knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: purgedStatusId,
      operator: '',
      reason: `Purge Result from ${deviceName} on change of site`,
      createdOn: now,
      changedOn: now,
    })
    dispatch(notifyResultUpdated(resultId, payload, 'MalawiPlugin'))
  }
}

function* generateHistoricalResults(
  knex,
  dispatch,
  deviceId,
  siteId,
  now = new Date()
) {
  const partner = yield knex('Site as s')
    .join('Partner as p', 's.partnerId', 'p.id')
    .where({ 's.id': siteId })
    .first(
      'p.deviceLogHistoryDays',
      'p.autoAcknowledgeOlderThanDays',
      'p.numberToLeaveUnacknowledged'
    )
  const {
    deviceLogHistoryDays,
    autoAcknowledgeOlderThanDays,
    numberToLeaveUnacknowledged,
  } = partner

  if (deviceLogHistoryDays == null) {
    return
  }

  const historyCutoff = new Date(
    +new Date() - deviceLogHistoryDays * millisInDay
  )

  const sourceResults = yield knex('DeviceLog as dl')
    .join('Result as r', 'dl.resultId', 'r.id')
    .join('ResultWorkflowStatus as rws', 'r.resultWorkflowStatusId', 'rws.id')
    .join('Device as d', 'dl.deviceId', 'd.id')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .join('Sample as sm', 'r.sampleId', 'sm.id')
    .where({
      'r.qcCheck': 1,
      'dt.externalId': DEVICE_TYPE_CHAI,
      'sm.originSiteId': siteId,
    })
    .where('dl.createdOn', '>=', historyCutoff)
    .whereIn('rws.externalId', MERGEABLE_CHAI_IDS)
    .orderBy('r.endedOn', 'asc')
    .distinct(
      'r.id as resultId',
      'sm.id as sampleId',
      'r.endedOn as resultEndedOn',
      'd.name as deviceName'
    )

  const autoAcknowledgeOlderThan = autoAcknowledgeOlderThanDays
    ? new Date(+new Date() - autoAcknowledgeOlderThanDays * millisInDay)
    : null
  const autoAcknowledgeMaxIndex =
    sourceResults.length - numberToLeaveUnacknowledged

  const { id: acknowledgedStatusId } = yield knex('ResultWorkflowStatus')
    .where({ externalId: ACKNOWLEDGED_EXTERNALID })
    .first('id')

  let index = -1
  for (const {
    resultId,
    resultEndedOn,
    deviceName,
    sampleId,
  } of sourceResults) {
    index += 1

    const sourceResult = yield* getResult(knex, resultId)
    const payload = reporterResultFromChaiResult(sourceResult)
    payload.workflow = { status: { id: DELIVERABLE_EXTERNALID } }

    const { processedResult, existingResult } = yield* mergeResult(
      knex,
      deviceId,
      payload,
      { sampleId, now }
    )
    yield* addResultWorkflowLogIfChanged(
      knex,
      payload,
      processedResult,
      existingResult,
      `Historical Result from ${deviceName}`,
      now
    )

    const autoAcknowledge =
      index < autoAcknowledgeMaxIndex &&
      (resultEndedOn != null &&
        autoAcknowledgeOlderThan != null &&
        +resultEndedOn < +autoAcknowledgeOlderThan)

    const resultUpdates = { qcCheck: 1 }
    if (autoAcknowledge) {
      processedResult.resultWorkflowStatusId = acknowledgedStatusId
      yield* addResultWorkflowLogIfChanged(
        knex,
        payload,
        processedResult,
        existingResult,
        `Auto acknowledged from ${deviceName}`,
        new Date(+now + 1000) // in future to maintain order in UI
      )
      resultUpdates.resultWorkflowStatusId = acknowledgedStatusId
    }

    Object.assign(processedResult, resultUpdates)
    yield knex('Result')
      .where({ id: processedResult.id })
      .update(resultUpdates)
    yield knex('ResultGeneratedResult').insert({
      sourceResultId: resultId,
      generatedResultId: processedResult.id,
    })

    dispatch(notifyResultUpdated(processedResult.id, payload, 'MalawiPlugin'))
  }
}

function reporterResultFromChaiResult(chaiResult) {
  return {
    id: chaiResult.id,
    assay: { id: chaiResult.assay.id },
    sample: chaiResult.sample,
    data: chaiResult.data,
    patient: chaiResult.patient,
    endedOn: chaiResult.endedOn,
  }
}

module.exports = postProcessUpdateSite
