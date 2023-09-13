const _ = require('lodash')
const Promise = require('bluebird')
const {
  countAllAwaitingTreatment,
  fetchResultsByUpdatedOnQuery,
  getCommentsOfResultById,
  getFollowUpsByResultIds,
  getAcknowledgementsByResultIds,
  getFlagsByResultIds,
  getUserSiteIds,
} = require('./db')
const { getAllSamplesRegistered } = require('../../sample/common/db')
const { setDeliveredResultWorkflowStatuses } = require('../../common/consts')
const { transformSampleResponse } = require('./helpers/transformSampleResponse')
const { transformResultResponse } = require('./helpers/transformResultResponse')
const { getConstraints } = require('../../../../auth/constraints')
const { getUser } = require('../../../../auth/service')
const {
  addResultDownloadLogQuery,
  getResultWorkflowStatusQuery,
  insertResultWorkflowLogQuery,
  updateResultWorkflowLogQuery,
} = require('../../../result/common/db')

const addResultDownloadLog = async (idsToBeRegistered, userId) => {
  const now = new Date()
  const resultDownloadLogs = idsToBeRegistered.map(resultId => {
    return {
      resultId,
      createdOn: now,
      createdBy: userId,
    }
  })

  return addResultDownloadLogQuery(resultDownloadLogs)
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

async function fetchEntriesServiceHandler(request) {
  const { query, auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const samples = await getAllSamplesRegistered(query, dataConstraints)
  const results = await fetchResultsByUpdatedOnQuery(query, dataConstraints)

  const acknowledgements = await getAcknowledgementsByResultIds(results)
  const flags = await getFlagsByResultIds(results)
  const userSiteIds = await getUserSiteIds(dataConstraints)
  const resultIdsToBeRegistered = _.uniq(results.map(result => result.id))
  const user = await getUser(auth.credentials.name)
  await addResultDownloadLog(resultIdsToBeRegistered, user.id)

  const resultIdsToUpdate = _.uniq(
    results
      .filter(result => setDeliveredResultWorkflowStatuses.includes(result.resultWorkflowStatusExternalId))
      .map(result => result.id)
  )
  await updateResultWorkflowStatus(resultIdsToUpdate, user.id, 'Delivered')

  const followUps = await getFollowUpsByResultIds(results)
  const comments = await getCommentsOfResultById(results)
  const awaitingTreatment = await countAllAwaitingTreatment(dataConstraints)

  const transformedResults = transformResultResponse(results, followUps, comments, acknowledgements, flags, userSiteIds)
  const transformedSamples = transformSampleResponse(query, samples, transformedResults)
  const entries = _.orderBy(
    _.concat(_.uniqBy(transformedResults, 'id'), _.uniqBy(transformedSamples, 'id')).filter(_.identity),
    ['updatedOn'],
    ['desc']
  )

  return {
    ok: !!entries,
    total: _.size(entries),
    awaitingTreatment: awaitingTreatment.count,
    data: entries,
  }
}

module.exports = { fetchEntriesServiceHandler }
