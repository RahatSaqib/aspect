const _ = require('lodash')
const { resultWorkflowStatusToId } = require('../../../../shared/dictionary')
const {
  countAllAwaitingTreatment,
  fetchResultsByUpdatedOnQuery,
  getCommentsOfResultById,
  getFollowUpsByResultIds,
} = require('./db')
const { getAllSamplesRegistered } = require('../../sample/common/db')
const { transformSampleResponse } = require('./helpers/transformSampleResponse')
const { transFormResultResponse } = require('./helpers/transFormResultResponse')
const { getConstraints } = require('../../../../auth/constraints')

async function fetchEntriesServiceHandler(request) {
  const { query, auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const samples = await getAllSamplesRegistered(query, dataConstraints)
  const results = await fetchResultsByUpdatedOnQuery(query, dataConstraints)
  const followUps = await getFollowUpsByResultIds(results)
  const comments = await getCommentsOfResultById(results)
  const awaitingTreatment = await countAllAwaitingTreatment(dataConstraints)
  const acknowledgedId = await resultWorkflowStatusToId('Acknowledged')
  const transformedResults = transFormResultResponse(results, followUps, comments, acknowledgedId)
  const transformedSamples = transformSampleResponse(query, samples, transformedResults)
  const entries = _.orderBy(_.uniqBy(_.concat(transformedResults, transformedSamples), 'id'), ['updatedOn'], ['desc'])

  return {
    ok: !!entries,
    total: _.size(entries),
    awaitingTreatment: awaitingTreatment.count,
    data: entries,
  }
}

module.exports = { fetchEntriesServiceHandler }
