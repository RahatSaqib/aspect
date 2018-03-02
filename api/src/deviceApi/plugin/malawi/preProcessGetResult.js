const _ = require('lodash')
const { updateResultWorkflowStatus } = require('../common')
const { resultUpdated } = require('../../../messages')

const DELIVERED_EXTERNALID = 'Delivered'
const ACKNOWLEDGED_EXTERNALID = 'Acknowledged'
const FLAGGED_EXTERNALID = 'Flagged'
const ERROR_EXTERNALID = 'Error'

const DONOT_LOG_DELIVERED = [
  DELIVERED_EXTERNALID,
  ACKNOWLEDGED_EXTERNALID,
  FLAGGED_EXTERNALID,
  ERROR_EXTERNALID,
]

async function preProcessGetResult({ knex, publish, resultId, query, now }) {
  const offset = Number(query.offset)
  await updateResultWorkflowStatusOnGetResult(
    knex,
    publish,
    resultId,
    offset,
    now
  )
}

async function updateResultWorkflowStatusOnGetResult(
  knex,
  publish,
  resultId,
  offset,
  now = new Date()
) {
  const row = await knex('Result as r')
    .leftJoin('ResultWorkflowStatus as rs', 'r.resultWorkflowStatusId', 'rs.id')
    .where('r.id', resultId)
    .first('r.id as resultId', 'rs.externalId as resultWorkflowStatusId')
  // only set to delivered the first time and
  // only if NOT acknowledged or flagged already
  if (
    row != null &&
    _.indexOf(DONOT_LOG_DELIVERED, row.resultWorkflowStatusId) === -1
  ) {
    await updateResultWorkflowStatus(
      knex,
      row.resultId,
      DELIVERED_EXTERNALID,
      now
    )
    publish(resultUpdated(row.resultId))
  }
}

module.exports = preProcessGetResult
