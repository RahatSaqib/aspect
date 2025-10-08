const _ = require('lodash')
const {
  fetchResultsBySubmittedSinceQuery,
  getFollowUpsByResultIds,
  getAcknowledgementsByResultIds,
  getFlagsByResultIds,
  getUserSiteIds,
} = require('./db')
const { getAllSamplesRegistered } = require('../../sample/common/db')
const { transformSampleResponse } = require('./helpers/transformSampleResponse')
const { transformResultResponse } = require('./helpers/transformResultResponse')
const { getConstraints } = require('../../../../auth/constraints')
const { getUser } = require('../../../../auth/service')
const { addResultDownloadLogQuery } = require('../../../result/common/db')
const { getSitesQuery } = require('../../../../site/service')
const { getResultCustomFieldsResponseByResultIds } = require('../../../../result/customFields/service')

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

async function fetchEntriesServiceHandler(request) {
  const { query, auth } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const clinics = await getSitesQuery(dataConstraints).select('s.id')
  const clinicIds = clinics.map(c => c.id)
  const samples = await getAllSamplesRegistered(query, clinicIds)
  const results = await fetchResultsBySubmittedSinceQuery(query, dataConstraints)

  let transformedResults = []
  if (!_.isEmpty(results)) {
    const acknowledgements = await getAcknowledgementsByResultIds(results)
    const flags = await getFlagsByResultIds(results)
    const userSiteIds = await getUserSiteIds(dataConstraints)
    const resultIdsToBeRegistered = _.uniq(results.map(result => result.id))
    const user = await getUser(auth.credentials.name)
    await addResultDownloadLog(resultIdsToBeRegistered, user.id)

    const followUps = await getFollowUpsByResultIds(results)
    transformedResults = transformResultResponse(results, followUps, acknowledgements, flags, userSiteIds)
  }

  const mergedResultData = transformedResults.reduce((mergedResults, result) => {
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

  const transformedSamples = transformSampleResponse(query, samples, mergedResultData)

  const resultCustomFieldsByResultId = await getResultCustomFieldsResponseByResultIds(
    mergedResultData.map(result => result.id)
  )

  const entries = _.concat(_.uniqBy(mergedResultData, 'id'), _.uniqBy(transformedSamples, 'id')).filter(_.identity)

  const awaitingTreatment = _.countBy(entries, 'requiresFollowUp')

  return {
    ok: !!entries,
    total: _.size(entries),
    awaitingTreatment: awaitingTreatment.true || 0,
    data: entries.map(entry => ({
      ...entry,
      customFields: resultCustomFieldsByResultId[entry.id],
    })),
  }
}

module.exports = { fetchEntriesServiceHandler }
