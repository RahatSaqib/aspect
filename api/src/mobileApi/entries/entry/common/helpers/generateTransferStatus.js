const _ = require('lodash')
const { TRANSFERRED } = require('../consts')

/**
 * Determines transfer status and other related data based on given data.
 * @param {Object} data - The data object.
 * @returns {Object} - An object containing transfer status and other related data.
 */

function generateTransferStatus(data) {
  let transferStatus
  let canBeTransferred = true
  if (_.isNil(data.transferStatusLogData)) return { canBeTransferred }
  const transferStatusLogData = JSON.parse(data.transferStatusLogData)
  const { siteId, reportableSiteId, previousReportableSiteId } = transferStatusLogData
  switch (true) {
    case !_.isEqual(siteId, reportableSiteId) && _.isEqual(siteId, previousReportableSiteId):
      transferStatus = TRANSFERRED.AWAY
      canBeTransferred = false
      break
    case _.isEqual(siteId, reportableSiteId) && !_.isEqual(siteId, previousReportableSiteId):
      transferStatus = TRANSFERRED.HERE
      break

    default:
      transferStatus = null
  }

  return {
    canBeTransferred,
    previousReportableSiteId,
    reportableSiteId,
    resultId: data.id,
    siteId,
    siteName: data.reportableSiteName,
    transferStatus,
    transferredBy: data.transferredBy,
    transferredOn: data.transferredOn,
  }
}

module.exports = { generateTransferStatus }
