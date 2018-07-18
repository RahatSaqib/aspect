const _ = require('lodash')
const { mergeResult, getResult } = require('../../result')
const { addResultWorkflowLogIfChanged } = require('../common')
const { resultWorkflowStatusToId } = require('../../../shared/dictionary')

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

async function postProcessUpdateSite(context, site, previousSite) {
  const { knex, actions, deviceId, deviceType, now } = context
  if (deviceType === DEVICE_TYPE_REPORTER && site.id !== previousSite.id) {
    await purgePreviousResults(knex, actions, deviceId, now)
    await generateHistoricalResults(knex, actions, deviceId, site.id, now)
  }
}

async function purgePreviousResults(knex, actions, deviceId, now) {
  const purgedStatusId = await resultWorkflowStatusToId(PURGED_EXTERNALID)
  await knex('Result')
    .where({ deviceId })
    .update({ resultWorkflowStatusId: purgedStatusId })
  const resultIds = await knex('Result as r')
    .join('Device as d', 'r.deviceId', 'd.id')
    .where({
      'd.id': deviceId,
      'r.resultWorkflowStatusId': purgedStatusId,
    })
    .select('r.id as resultId', 'd.name as deviceName')
  await Promise.all(
    _.map(resultIds, async result => {
      const { resultId, deviceName } = result

      await knex('ResultWorkflowLog').insert({
        resultId,
        resultWorkflowStatusId: purgedStatusId,
        operator: '',
        reason: `Purge Result from ${deviceName} on change of site`,
        createdOn: now,
        changedOn: now,
      })
      actions.resultUpdated(resultId)
    })
  )
}

async function generateHistoricalResults(
  knex,
  actions,
  deviceId,
  siteId,
  now = new Date()
) {
  const partner = await knex('Site as s')
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

  const sourceResults = await knex('DeviceLog as dl')
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

  const acknowledgedStatusId = await resultWorkflowStatusToId(
    ACKNOWLEDGED_EXTERNALID
  )

  let index = -1

  for (const result of sourceResults) {
    index += 1
    /* eslint-disable no-await-in-loop */
    await mergeResultAndUpdateWorkflowStatus(
      knex,
      actions,
      deviceId,
      now,
      result,
      index,
      autoAcknowledgeMaxIndex,
      autoAcknowledgeOlderThan,
      acknowledgedStatusId
    )
    /* eslint-enable no-await-in-loop */
  }
}

async function mergeResultAndUpdateWorkflowStatus(
  knex,
  actions,
  deviceId,
  now,
  result,
  index,
  autoAcknowledgeMaxIndex,
  autoAcknowledgeOlderThan,
  acknowledgedStatusId
) {
  const { resultId, resultEndedOn, deviceName, sampleId } = result

  const sourceResult = await getResult(knex, resultId)
  const payload = reporterResultFromChaiResult(sourceResult)
  payload.workflow = { status: { id: DELIVERABLE_EXTERNALID } }

  const { processedResult, existingResult } = await mergeResult(
    knex,
    deviceId,
    payload,
    { sampleId, now }
  )
  await addResultWorkflowLogIfChanged(
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
    await addResultWorkflowLogIfChanged(
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
  await knex('Result')
    .where({ id: processedResult.id })
    .update(resultUpdates)
  await knex('ResultGeneratedResult').insert({
    sourceResultId: resultId,
    generatedResultId: processedResult.id,
  })

  actions.resultUpdated(processedResult.id)
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
