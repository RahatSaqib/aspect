const _ = require('lodash')
const inventory = require('../../inventory/service')
const fact = require('../../fact/service')

/**
 * Consumes inventory for the new result
 */
function* consumeInventoryForResult(knex, payload, result) {
  // TODO ASP-355 Move consumeInventory for Result to listener
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

function* updateFactResultCountDevice(knex, payload, result) {
  yield* fact.calculateResultCounts(
    result.deviceId,
    result.assayId,
    result.resultCategory1,
    knex
  )
}

function* addResultWorkflowLogIfChanged(
  knex,
  payload,
  result,
  previousResult,
  reason,
  now = new Date()
) {
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
      reason,
      operator: _.get(payload, 'workflow.operator', null),
      changedOn: _.get(payload, 'workflow.changedOn', now),
      createdOn: now,
    })
  }
  return resultWorkflowChanged
}

function* updateResultWorkflowStatus(
  knex,
  resultId,
  workflowStatusExternalId,
  reason,
  now = new Date()
) {
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
  updateResultWorkflowStatus,
  updateFactResultCountDevice,
}
