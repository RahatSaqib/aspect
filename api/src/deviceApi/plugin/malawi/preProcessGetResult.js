const _ = require('lodash')
const { updateResultWorkflowStatus } = require('../common')
const { notifyResultUpdated } = require('../../../messages')

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

async function preProcessGetResult({ knex, dispatch, resultId, query, now }) {
  const offset = Number(query.offset)
  await updateResultWorkflowStatusOnGetResult(
    knex,
    dispatch,
    resultId,
    offset,
    now
  )
}

async function updateResultWorkflowStatusOnGetResult(
  knex,
  dispatch,
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
    dispatch(notifyResultUpdated(row.resultId))
  }
}

module.exports = preProcessGetResult
