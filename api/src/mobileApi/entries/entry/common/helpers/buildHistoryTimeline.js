const _ = require('lodash')
const { extractFromDataById } = require('./extractFromDataById')
const { generateTransferStatus } = require('./generateTransferStatus')

/**
 * A function that builds a history timeline for a given data object and list of follow-ups.
 * @param {object} data - The entries data object to build the timeline for.
 * @param {array} followUps - The array of follow-up data objects.
 * @returns {array} - An array of objects containing the history timeline, sorted by update date in descending order.
 */

function buildHistoryTimeline(data, followUps) {
  const output = []
  const resultFollowUps = extractFromDataById(followUps, 'resultId', data.id)
  const transferStatus = generateTransferStatus(data)

  output.push({
    id: data.resultSampleId,
    resultId: data.id,
    event: 'sampleCollected',
    name: data.sampleTypeExternalId,
    siteName: data?.reportableSiteName,
    updatedOn: data.sampleCollectedOn,
  })

  if (!_.isEmpty(transferStatus)) {
    output.push({
      id: data.id,
      resultId: data.id,
      event: 'transferEvent',
      name: transferStatus.transferStatus,
      siteName: data?.reportableSiteName,
      updatedOn: transferStatus.transferredOn,
    })
  }

  _.map(resultFollowUps, followUp =>
    output.push({
      id: followUp.id,
      resultId: data.id,
      event: 'followUpCreated',
      name: followUp.followUpName,
      siteName: data?.reportableSiteName,
      updatedOn: followUp.updatedOn,
    })
  )

  return _.sortBy(output, ['updatedOn']).reverse()
}

module.exports = { buildHistoryTimeline }
