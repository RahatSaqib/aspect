const _ = require('lodash')
const inventory = require('../../inventory/service')

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

function* getLatestResultWorkflowLog(knex, resultId) {
  return yield knex('ResultWorkflowLog')
    .where({ resultId })
    .orderBy('createdOn', 'desc')
    .orderBy('id', 'desc')
    .first('operator', 'changedOn')
}

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

module.exports = {
  addResultWorkflowLogIfChanged,
  consumeInventoryForResult,
}
