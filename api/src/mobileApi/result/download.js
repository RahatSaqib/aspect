const _ = require('lodash')
const Promise = require('bluebird')
const { getConstraints } = require('../../auth/constraints')
const { getUser } = require('../../auth/service')
const logger = require('../../shared/logger')
const {
  generateResultQuery,
  getCount,
  getItems,
  getFollowUps,
  getComments,
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

  // get follow ups for all results in the response for performance (filter later)
  const followUps = await getFollowUps(data)
  // get comments for all results in the response for performance (filter later)
  const comments = await getComments(data)

  const transformedData = getTransformedData(data, setDelivered, followUps, comments)
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
  const myProm = async () => {
    const idsToUpdate = _.uniq(
      _.map(
        _.pickBy(results.data, elem => elem.workflowStatus.setDelivered),
        elem => elem.id
      )
    )
    const idsToBeRegistered = _.uniq(_.map(results.data, elem => elem.id))
    if (idsToUpdate && idsToUpdate.length > 0) await updateResultWorkflowStatus(idsToUpdate, user.id, 'Delivered')
    if (idsToBeRegistered && idsToBeRegistered.length > 0) await addResultDownloadLog(idsToBeRegistered, user.id)
  }
  myProm().catch(err => {
    logger.error(err)
  })
  return results
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
  downloadResultsList,
}
