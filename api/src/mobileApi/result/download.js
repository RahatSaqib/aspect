const _ = require('lodash')
const Promise = require('bluebird')
const { getConstraints } = require('../../auth/constraints')
const { getUser } = require('../../auth/service')
const {
  generateResultQuery,
  getCount,
  getItems,
  getFollowUps,
  addResultDownloadLogQuery,
  insertResultWorkflowLogQuery,
  updateResultWorkflowLogQuery,
  getResultWorkflowStatusQuery,
} = require('./common/db')
const { getTransformedData } = require('./common/logic')

async function getDownloadResultsList(query, auth, setDelivered = false) {
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)
  const resultQuery = generateResultQuery(query, dataConstraints, false)

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount(resultQuery), getItems(resultQuery, query)])
  // get follow-ups for all results in the response for performance (filter later)
  const followUps = await getFollowUps(data)
  const transformedData = getTransformedData(data, setDelivered, followUps)
  const result = {
    ok: true,
    total,
    length: transformedData.length,
    data: transformedData,
  }

  return result
}

async function downloadResultsList(request) {
  const { query, auth } = request
  const user = await getUser(auth.credentials.name)
  const results = await getDownloadResultsList(query, auth, true)
  const resultIdsToBeRegistered = _.uniq(results.data.map(result => result.id))
  await addResultDownloadLog(resultIdsToBeRegistered, user.id)
  const resultIdsToUpdate = _.uniq(
    results.data.filter(result => result.workflowStatus.setDelivered).map(result => result.id)
  )
  await updateResultWorkflowStatus(resultIdsToUpdate, user.id, 'Delivered')
  return results
}

const addResultDownloadLog = async (idsToBeRegistered, userId) => {
  const now = new Date()
  return Promise.each(idsToBeRegistered, async resultId => addResultDownloadLogQuery(resultId, now, userId))
}

const updateResultWorkflowStatus = async (resultIdsToUpdate, userId, resultWorkflowStatusExternalId) => {
  const { id: resultWorkflowStatusId } = await getResultWorkflowStatusQuery(resultWorkflowStatusExternalId)
  const now = new Date()
  return Promise.each(resultIdsToUpdate, async resultId => {
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
  downloadResultsList,
}
