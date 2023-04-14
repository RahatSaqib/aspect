const _ = require('lodash')
const { TRANSFERRED } = require('../consts')

function generateTransferStatus(data) {
  let transferStatus
  const transferStatusLogData = JSON.parse(data.transferStatusLogData)
  if (_.isNil(transferStatusLogData)) return {}
  const { siteId, reportableSiteId, previousReportableSiteId } = transferStatusLogData
  switch (true) {
    case !_.isEqual(siteId, reportableSiteId) && _.isEqual(siteId, previousReportableSiteId):
      transferStatus = TRANSFERRED.AWAY
      break
    case _.isEqual(siteId, reportableSiteId) && !_.isEqual(siteId, previousReportableSiteId):
      transferStatus = TRANSFERRED.HERE
      break

    default:
      transferStatus = null
  }
  return {
    transferStatus,
    transferredOn: data.transferredOn,
    transferredBy: data.transferredBy,
    siteId,
    reportableSiteId,
    previousReportableSiteId,
  }
}

module.exports = { generateTransferStatus }
