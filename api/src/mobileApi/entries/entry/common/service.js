const _ = require('lodash')
const { resultWorkflowStatusToId } = require('../../../../shared/dictionary')
const {
  countAllAwaitingTreatment,
  fetchEntriesByUpdatedOnQuery,
  getCommentsOfResultById,
  getFollowUpsOfResultById,
} = require('./db')
const { getAllSamplesRegistered } = require('../../sample/common/db')
const { transformSampleResponse } = require('./helpers/transformSampleResponse')
const { transFormResultResponse } = require('./helpers/transFormResultResponse')

async function fetchEntriesServiceHandler(request) {
  const { query, auth } = request
  const samples = await getAllSamplesRegistered(query, auth)
  const results = await fetchEntriesByUpdatedOnQuery(query, auth)
  const followUps = await getFollowUpsOfResultById(results)
  const comments = await getCommentsOfResultById(results)
  const awaitingTreatment = await countAllAwaitingTreatment(auth)
  const acknowledgedId = await resultWorkflowStatusToId('Acknowledged')
  const transformedResults = transFormResultResponse(results, followUps, comments, acknowledgedId)
  const transformedSamples = transformSampleResponse(query, samples, transformedResults)

  const entries = _.orderBy(_.concat(transformedResults, transformedSamples), ['updatedOn'], ['desc'])

  return {
    ok: !!entries,
    total: _.size(entries),
    awaitingTreatment: awaitingTreatment.count,
    data: entries,
  }
}

module.exports = { fetchEntriesServiceHandler }
