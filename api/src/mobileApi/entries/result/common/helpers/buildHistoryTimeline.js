const _ = require('lodash')
const { extractFromDataById } = require('./extractFromDataById')
const { generateTransferStatus } = require('./generateTransferStatus')

/**
 * A function that builds a history timeline for a given data object and list of follow-ups.
 * @param {object} data - The entries data object to build the timeline for.
 * @param {array} followUps - The array of follow-up data objects.
 * @param {Array} userSiteIds - The array of IDs that the user is able to record follow-ups for.
 * @returns {array} - An array of objects containing the history timeline, sorted by update date in descending order.
 */

function buildHistoryTimeline(data, followUps, userSiteIds) {
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
      clinicianName: data.sampleClinicianName,
      sampleId: data.sampleExternalId,
    })
  }

  if (!_.isNil(data.testDate)) {
    const patientData = data?.patientData
    const parsedPatientData = patientData ? JSON.parse(patientData) : null
    const patientSampleData = data.sampleData ? JSON.parse(data.sampleData) : null
    output.push({
      id: data.resultSampleId,
      resultId: data.id,
      event: 'sampleTested',
      name: data.sampleTypeExternalId,
      siteName: data?.laboratorySiteName,
      updatedOn: data.testDate,
      sampleId: data.sampleExternalId,
      patientId: parsedPatientData?.id || patientSampleData?.patientExternalId || null,
    })
  }

  if (!_.isNil(transferStatus?.transferStatus)) {
    const { transferredBy, transferComment, transferSiteName, transferOriginSiteName } = data

    output.push({
      id: data.id,
      resultId: data.id,
      event: 'transferEvent',
      name: transferStatus.transferStatus,
      siteName: transferSiteName,
      updatedOn: transferStatus.transferredOn,
      comment: transferComment,
      transferredBy,
      originSiteName: transferOriginSiteName,
    })
  }

  _.map(resultFollowUps, followUp => {
    const followUpHistoryItem = {
      id: followUp.id,
      resultId: data.id,
      event: 'followUpCreated',
      name: followUp.followUpName,
      siteName: data?.reportableSiteName,
      updatedOn: followUp.date,
      type: followUp.followUpTypeName,
      clinicianName: followUp.clinicianName,
    }
    output.push(followUpHistoryItem)
  })

  return _.sortBy(output, ['updatedOn']).reverse()
}

module.exports = { buildHistoryTimeline }
