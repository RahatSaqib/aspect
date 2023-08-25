const _ = require('lodash')
const format = require('date-fns/format')
const { extractFromDataById } = require('./extractFromDataById')
const { generateTransferStatus } = require('./generateTransferStatus')

/**
 * A function that builds a history timeline for a given data object and list of follow-ups.
 * @param {object} data - The entries data object to build the timeline for.
 * @param {array} followUps - The array of follow-up data objects.
 * @param {Array} userSiteIds - The array of IDs that the user is able to record follow-ups for.
 * @returns {array} - An array of objects containing the history timeline, sorted by update date in descending order.
 */

function buildHistoryTimeline(data, followUps, resultFlags, userSiteIds) {
  const output = []
  const resultFollowUps = extractFromDataById(followUps, 'resultId', data.id)
  const transferStatus = generateTransferStatus(data, userSiteIds)

  if (data.sampleCollectedOn || data.sampleSiteName) {
    output.push({
      id: data.resultSampleId,
      resultId: data.id,
      event: 'sampleCollected',
      name: data.sampleTypeExternalId,
      siteName: data?.sampleSiteName,
      updatedOn: data.sampleCollectedOn,
    })
  }

  if (!_.isNil(data.testDate)) {
    output.push({
      id: data.resultSampleId,
      resultId: data.id,
      event: 'sampleTested',
      name: data.sampleTypeExternalId,
      siteName: data?.laboratorySiteName,
      updatedOn: data.testDate,
    })
  }

  if (!_.isNil(transferStatus?.transferStatus)) {
    const { transferredBy, transferStatusLogData } = data

    let statusLogData
    let comment
    if (transferStatusLogData) {
      statusLogData = JSON.parse(transferStatusLogData)
      comment = statusLogData?.comment
    }
    output.push({
      id: data.id,
      resultId: data.id,
      event: 'transferEvent',
      name: transferStatus.transferStatus,
      siteName: data?.reportableSiteName,
      updatedOn: transferStatus.transferredOn,
      comment,
      transferredBy,
    })
  }

  _.map(resultFollowUps, followUp => {
    const followUpHistoryItem = {
      id: followUp.id,
      resultId: data.id,
      event: 'followUpCreated',
      name: followUp.followUpName,
      siteName: data?.reportableSiteName,
      updatedOn: followUp.updatedOn,
    }
    const matchingFlag = resultFlags?.find(
      rf => format(rf.flaggedOn, 'yyyyLLddHHmmss') === format(followUp.date, 'yyyyLLddHHmmss')
    )
    if (matchingFlag?.reason) {
      followUpHistoryItem.reason = matchingFlag.reason
    }
    output.push(followUpHistoryItem)
  })

  return _.sortBy(output, ['updatedOn']).reverse()
}

module.exports = { buildHistoryTimeline }
