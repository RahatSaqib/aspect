const Boom = require('@hapi/boom')
const { getUser } = require('../../auth/service')
const { resultWorkflowStatusToId } = require('../../shared/dictionary')
const {
  insertResultWorkflowLog,
  updateResultWithResultWorkflowLog,
  getLatestResultWorkflowLog,
} = require('./common/db')

const FLAGGED_EXTERNALID = 'Flagged'

// update result workflow
async function updateWorkflowStatusToFlagged(request) {
  const { auth, params, payload } = request
  const { resultId } = params
  const { id: currentUserId } = await getUser(auth.credentials.name)

  // get the result so that we can check access and if status changed
  const result = await getLatestResultWorkflowLog(resultId)
  const flaggedId = await resultWorkflowStatusToId(FLAGGED_EXTERNALID)
  const resultWorkflowLogEntry = {
    resultId,
    resultWorkflowStatusId: flaggedId,
    createdBy: currentUserId,
    reason: payload.reason,
    changedOn: payload.changedOn,
  }
  const errorMessage = await updateResultWorkflowStatusByResultId(
    resultWorkflowLogEntry,
    payload.changedOn,
    result?.resultWorkflowChangedOn
  )

  if (errorMessage) {
    return Boom.badRequest(errorMessage)
  }

  return {
    ok: true,
    data: `Result ${resultId} has been flagged successfully`,
  }
}

// supporting function for update workflow status
async function updateResultWorkflowStatusByResultId(resultWorkflowLogEntry, clientDate, resultWorkflowChangedOn) {
  // update the resultWorkflowStatusId.
  if (resultWorkflowChangedOn < clientDate || !resultWorkflowChangedOn) {
    const [lastLogId] = await insertResultWorkflowLog(resultWorkflowLogEntry)
    await updateResultWithResultWorkflowLog(resultWorkflowLogEntry, lastLogId, new Date())
  }
}

module.exports = {
  updateWorkflowStatusToFlagged,
  updateResultWorkflowStatusByResultId,
}
