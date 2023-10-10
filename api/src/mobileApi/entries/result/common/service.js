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
const { getSiteByIds, getSitesQuery } = require('../../../../site/service')

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
  const clinicIds = await getSitesQuery(dataConstraints)
  const samples = await getAllSamplesRegistered(query, clinicIds)
  const results = await fetchResultsByUpdatedOnQuery(query, clinicIds)

  let transformedResults = []
  if (!_.isEmpty(results)) {
    const originSiteIds = results
      .filter(r => !!r.transferStatusLogData)
      .map(r => JSON.parse(r.transferStatusLogData).sampleOriginSiteId)

    const transferOriginIds = await getSiteByIds(originSiteIds)

    // map origin id to name
    const originSitesMap = _.reduce(
      transferOriginIds,
      (result, item) => {
        result[item.id] = item.name
        return result
      },
      {}
    )

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
    transformedResults = transformResultResponse(
      results,
      followUps,
      comments,
      acknowledgements,
      flags,
      userSiteIds,
      originSitesMap
    )
  }

  const awaitingTreatment = await countAllAwaitingTreatment(dataConstraints)
  // get origin Ids for each result
  const transformedSamples = transformSampleResponse(query, samples)

  const mergedData = transformedResults.reduce((mergedResults, result) => {
    const existingObj = mergedResults.find(item => item.id === result.id)

    if (existingObj) {
      const uniqueHistory = new Set(existingObj.history.map(JSON.stringify))

      result.history.forEach(history => {
        if (history.event === 'transferEvent' && !uniqueHistory.has(JSON.stringify(history))) {
          uniqueHistory.add(JSON.stringify(history))
          existingObj.history.push(history)
        }
      })

      existingObj.history.sort((historyA, historyB) => new Date(historyB.updatedOn) - new Date(historyA.updatedOn))
    } else {
      mergedResults.push(result)
    }
    return mergedResults
  }, [])

  const entries = _.orderBy(
    _.concat(_.uniqBy(mergedData, 'id'), _.uniqBy(transformedSamples, 'id')).filter(_.identity),
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
