const _ = require('lodash')
const inventory = require('../../inventory/service')

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
    const resultWorkflowLog = await getLatestResultWorkflowLog(knex, result.id)
    resultWorkflowChanged =
      !resultWorkflowLog ||
      _.get(payload, 'workflow.operator', null) !==
        resultWorkflowLog.operator ||
      +_.get(payload, 'workflow.changedOn', NaN) !==
        +resultWorkflowLog.changedOn
  }

  if (resultWorkflowChanged) {
    await knex('ResultWorkflowLog').insert({
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

async function updateResultWorkflowStatus(
  knex,
  resultId,
  workflowStatusExternalId,
  reason,
  now = new Date()
) {
  // get internal workflow status id based on the external id we got
  const workflowStatusRow = await knex('ResultWorkflowStatus')
    .where('externalId', workflowStatusExternalId)
    .select('id')
    .first()
  if (workflowStatusRow === null) {
    throw new Error(
      `Workflow status with external ID "${workflowStatusExternalId}" not found`
    )
  }

  // update result
  const rows = await knex('Result as r')
    .where('r.id', resultId)
    .update('resultWorkflowStatusId', workflowStatusRow.id)

  // keep log if update was successful. don't need to check permission again because
  // rows would be 0 if no permission in query above
  if (rows) {
    await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: workflowStatusRow.id,
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
  addResultWorkflowLogIfChanged,
  consumeInventoryForResult,
  updateResultWorkflowStatus,
}
