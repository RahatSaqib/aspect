const _ = require('lodash')
const { extractFromDataById } = require('./extractFromDataById')

/**
 * A function that builds a history timeline for a given data object and list of follow-ups.
 * @param {object} data - The entries data object to build the timeline for.
 * @param {array} followUps - The array of follow-up data objects.
 * @returns {array} - An array of objects containing the history timeline, sorted by update date in descending order.
 */

function buildHistoryTimeline(data, followUps) {
  const output = []
  const resultFollowUps = extractFromDataById(followUps, 'resultId', data.id)
  output.push({
    id: data.resultSampleId,
    event: 'sampleCollected',
    name: data.sampleTypeExternalId,
    siteName: data.sampleSiteName,
    updatedOn: data.sampleCollectedOn,
  })
  _.map(resultFollowUps, followUp =>
    output.push({
      id: followUp.id,
      event: 'followUpCreated',
      name: followUp.followUpName,
      siteName: null,
      updatedOn: followUp.updatedOn,
    })
  )

  return _.sortBy(output, ['updatedOn']).reverse()
}

module.exports = { buildHistoryTimeline }
