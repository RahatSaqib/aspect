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

function* preProcessGetResult({ knex, dispatch, resultId, query, now }) {
  const offset = Number(query.offset)
  yield* updateResultWorkflowStatusOnGetResult(
    knex,
    dispatch,
    resultId,
    offset,
    now
  )
}

function* updateResultWorkflowStatusOnGetResult(
  knex,
  dispatch,
  resultId,
  offset,
  now = new Date()
) {
  const row = yield knex('Result as r')
    .leftJoin('ResultWorkflowStatus as rs', 'r.resultWorkflowStatusId', 'rs.id')
    .where('r.id', resultId)
    .first('r.id as resultId', 'rs.externalId as resultWorkflowStatusId')
  // only set to delivered the first time and
  // only if NOT acknowledged or flagged already
  if (
    row != null &&
    _.indexOf(DONOT_LOG_DELIVERED, row.resultWorkflowStatusId) === -1
  ) {
    yield* updateResultWorkflowStatus(
      knex,
      row.resultId,
      DELIVERED_EXTERNALID,
      now
    )
    dispatch(
      notifyResultUpdated(
        row.resultId,
        { resultWorkflowStatus: DELIVERED_EXTERNALID },
        'GetResult'
      )
    )
  }
}

module.exports = preProcessGetResult
