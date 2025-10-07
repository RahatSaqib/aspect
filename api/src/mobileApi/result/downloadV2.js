const _ = require('lodash')
const Promise = require('bluebird')
const { getConstraints } = require('../../auth/constraints')
const { getUser } = require('../../auth/service')
const logger = require('../../shared/logger')
const { getPageParams } = require('../../routes')
const {
  getFollowUpsV2,
  getCountV2,
  getItemsV2,
  getAwaitingTreatment,
  generateResultQueryV2,
  addResultDownloadLogQuery,
  insertResultWorkflowLogQuery,
  updateResultWorkflowLogQuery,
  getResultWorkflowStatusQuery,
} = require('./common/db')
const { getTransformedDataV2 } = require('./common/logic')

async function getDownloadResultsListV2(query, auth, setDelivered = false) {
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)
  const { size } = getPageParams(query)

  const resultQuery = generateResultQueryV2(query, dataConstraints, false)

  // return result when both queries are finished
  const [{ count: total }, data, { count: awaitingTreatment }] = await Promise.all([
    getCountV2(resultQuery),
    getItemsV2(resultQuery, query),
    getAwaitingTreatment(resultQuery),
  ])

  // get follow ups for all results in the response for performance (filter later)
  const followUps = await getFollowUpsV2(data)

  const transformedData = await getTransformedDataV2(data, setDelivered, followUps)

  // total pages calculation
  const totalPages = Math.ceil(total / size)

  // Next page available or not calculation
  const nextPage = query.offset < totalPages - 1 ? query.offset + 1 : false

  const result = {
    ok: true,
    total,
    awaitingTreatment,
    length: transformedData.length,
    pages: totalPages,
    hasNext: !!nextPage,
    offset: query.offset || 0,
    data: transformedData,
  }

  if (nextPage) {
    result.nextPage = nextPage
  }

  return result
}

async function downloadResultsListV2(request) {
  const { query, auth } = request
  const user = await getUser(auth.credentials.name)
  const results = await getDownloadResultsListV2(query, auth, true)
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
  downloadResultsListV2,
}
