const Boom = require('@hapi/boom')
const Promise = require('bluebird')
const { getConstraints } = require('../../auth/constraints')
const { getUser } = require('../../auth/service')
const logger = require('../../shared/logger')
const {
  getFollowUpsOfResultById,
  getItemsV2,
  generateResultQueryV2,
  addResultDownloadLogQuery,
  insertResultWorkflowLogQuery,
  updateResultWorkflowLogQuery,
  getResultWorkflowStatusQuery,
} = require('./common/db')
const { getResultItemTransformedDataV2 } = require('./common/logic')

async function getDownloadResultById(resultId, auth, setDelivered = false) {
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const resultQuery = generateResultQueryV2(false, dataConstraints, resultId)

  // return result when both queries are finished
  const [data] = await getItemsV2(resultQuery, resultId)
  let transformedData = null

  if (data) {
    // get follow ups for a single result
    const followUps = await getFollowUpsOfResultById(resultId)

    transformedData = await getResultItemTransformedDataV2(data, setDelivered, followUps)
  }
  const result = {
    ok: !!data,
    data: transformedData,
  }

  return result
}

async function downloadResultByIdV2(request) {
  const {
    params: { resultId },
    auth,
  } = request
  const user = await getUser(auth.credentials.name)
  const result = await getDownloadResultById(resultId, auth, true)
  const myProm = async () => {
    if (result?.data?.id) {
      await addResultDownloadLog([result.data.id], user.id)
      if (result.data.workflowStatus.setDelivered) {
        await updateResultWorkflowStatus([result.data.id], user.id, 'Delivered')
      }
    }
  }
  myProm().catch(err => {
    logger.error(err)
  })
  return result.ok ? result : Boom.notFound()
}

const addResultDownloadLog = async (idsToBeRegistered, userId) => {
  const now = new Date()
  return Promise.each(idsToBeRegistered, async resultId => addResultDownloadLogQuery(resultId, now, userId))
}

const updateResultWorkflowStatus = async (idsToUpdate, userId, resultWorkflowStatusExternalId) => {
  const { id: resultWorkflowStatusId } = await getResultWorkflowStatusQuery(resultWorkflowStatusExternalId)
  const now = new Date()
  return Promise.each(idsToUpdate, async resultId => {
    const [resultWorkflowStatusLogId] = await insertResultWorkflowLogQuery(
      resultId,
      resultWorkflowStatusId,
      now,
      userId
    )
    await updateResultWorkflowLogQuery(resultId, userId, now, resultWorkflowStatusLogId)
  })
}

module.exports = {
  downloadResultByIdV2,
}
