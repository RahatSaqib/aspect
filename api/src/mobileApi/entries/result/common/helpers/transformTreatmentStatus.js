const _ = require('lodash')
const { differenceInDays } = require('date-fns')
const { generateTransferStatus } = require('./generateTransferStatus')
const { generateSeverity } = require('./generateSeverity')

function transformTreatmentStatus(data, followUps, userSiteIds) {
  const treatmentStatus = {
    daysInCurrentStatus: differenceInDays(new Date(), new Date(data?.resultTreatmentStatusChangedOn ?? new Date())),
    visible: true,
  }
  if (!_.isEmpty(data)) {
    const { canBeTransferred } = generateTransferStatus(data, userSiteIds)
    treatmentStatus.changedOn = data.resultTreatmentStatusChangedOn
    treatmentStatus.resultId = data.id
    treatmentStatus.name = data.resultTreatmentStatusName
    treatmentStatus.externalId = data.resultTreatmentStatusExternalId
    treatmentStatus.i18nKey = data.resultTreatmentStatusI18nKey
    treatmentStatus.visible =
      canBeTransferred && (data.resultCategoryAssay1RequiresTreatment || data.resultCategoryAssay2RequiresTreatment)
    treatmentStatus.severity = generateSeverity(data, followUps)
  }
  return treatmentStatus
}

module.exports = { transformTreatmentStatus }
