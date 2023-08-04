const _ = require('lodash')
const { differenceInDays } = require('date-fns')
const { generateTransferStatus } = require('./generateTransferStatus')
const { generateSeverity } = require('./generateSeverity')

function transformTreatmentStatus(data, followUps, userSiteIds) {
  if (_.isEmpty(data)) return {}
  const { canBeTransferred } = generateTransferStatus(data, userSiteIds)
  const daysInCurrentStatus = differenceInDays(new Date(), new Date(data?.resultTreatmentStatusChangedOn ?? new Date()))
  const changedOn = data.resultTreatmentStatusChangedOn
  if (_.isNil(changedOn) && daysInCurrentStatus === 0) return {}
  return {
    changedOn,
    resultId: data.id,
    name: data.resultTreatmentStatusName,
    externalId: data.resultTreatmentStatusExternalId,
    i18nKey: data.resultTreatmentStatusI18nKey,
    visible:
      canBeTransferred && (data.resultCategoryAssay1RequiresTreatment || data.resultCategoryAssay2RequiresTreatment),
    severity: generateSeverity(data, followUps),
    daysInCurrentStatus,
  }
}

module.exports = { transformTreatmentStatus }
