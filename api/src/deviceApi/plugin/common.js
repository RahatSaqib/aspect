const _ = require('lodash')
const inventory = require('../../inventory/service')

const DONOT_LOG_DELIVERED = ['Delivered', 'Acknowledged', 'Flagged', 'Error']
const DELIVERED_EXTERNALID = 'Delivered'
const ACKNOWLEDGED_EXTERNALID = 'Acknowledged'

const millisInDay = 1000 * 60 * 60 * 24

/**
 * Consumes inventory for the new result
 */
function* consumeInventoryForResult(context, result) {
  const { knex, payload } = context
  // Update Inventory Levels at Site
  const consumablesInResultData = _.isEmpty(payload.consumable)
    ? []
    : payload.consumable
  yield* inventory.consumeInventoryForResult(
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

function* addResultWorkflowLogIfChanged(context, result, previousResult) {
  const { knex, payload, now } = context

  // Log Result Workflow Update if any field changed
  let resultWorkflowChanged =
    !previousResult ||
    previousResult.resultWorkflowStatusId !== result.resultWorkflowStatusId
  if (
    !resultWorkflowChanged &&
    (_.has(payload, 'workflow.operator') ||
      _.has(payload, 'workflow.changedOn'))
  ) {
    // check to see if operator or changedOn is different from latest log
    const resultWorkflowLog = yield* getLatestResultWorkflowLog(knex, result.id)
    resultWorkflowChanged =
      !resultWorkflowLog ||
      _.get(payload, 'workflow.operator', null) !==
        resultWorkflowLog.operator ||
      +_.get(payload, 'workflow.changedOn', NaN) !==
        +resultWorkflowLog.changedOn
  }

  if (resultWorkflowChanged) {
    yield knex('ResultWorkflowLog').insert({
      resultId: result.id,
      resultWorkflowStatusId: result.resultWorkflowStatusId,
      operator: _.get(payload, 'workflow.operator', null),
      changedOn: _.get(payload, 'workflow.changedOn', now),
      createdOn: now,
    })
  }
}

function* updateResultWorkflowStatusOnGetResult(context) {
  const { knex, deviceLog } = context
  const row = yield knex('Result as r')
    .innerJoin('DeviceLog as dl', 'dl.resultId', 'r.id')
    .leftJoin('ResultWorkflowStatus as rs', 'r.resultWorkflowStatusId', 'rs.id')
    .leftJoin('Partner as p', 'r.partnerId', 'p.id')
    .where('dl.id', deviceLog.id)
    .first(
      'r.startedOn',
      'r.endedOn',
      'r.id as resultId',
      'rs.externalId as resultWorkflowStatusId',
      'p.autoAcknowledgeOlderThanDays',
      'p.numberToLeaveUnacknowledged'
    )
  // only set to delivered the first time and
  // only if NOT acknowledged or flagged already
  if (
    row != null &&
    _.indexOf(DONOT_LOG_DELIVERED, row.resultWorkflowStatusId) === -1
  ) {
    yield* updateResultWorkflowStatus(
      context,
      row.resultId,
      DELIVERED_EXTERNALID
    )

    yield* autoAcknowledgeResultBasedOnPartnerRules(context, row, row)
  }
}

function* autoAcknowledgeResultBasedOnPartnerRules(
  context,
  resultDetails,
  partnerAutoAcknowledgeRules
) {
  const { knex, query, device: { id: deviceId } } = context
  const {
    resultId,
    endedOn: testEndedOn,
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
      // FIXME Fix All results query. We should be able to limit this without loading all
      const allResultsBeingSynced = yield knex('Result as r')
        .innerJoin(
          'ResultWorkflowStatus as rs',
          'r.resultWorkflowStatusId',
          'rs.id'
        )
        .where('r.deviceId', deviceId)
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
  return workflowStatus
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
  addResultWorkflowLogIfChanged,
  consumeInventoryForResult,
  updateResultWorkflowStatusOnGetResult,
}
