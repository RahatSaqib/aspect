const _ = require('lodash')
const { differenceInDays } = require('date-fns')
const { generateTransferStatus } = require('./generateTransferStatus')
const { generateSeverity } = require('./generateSeverity')

function transformTreatmentStatus(data, followUps) {
  if (_.isEmpty(data)) return {}
  const isNotTransferred = _.isEmpty(generateTransferStatus(data))
  const daysInCurrentStatus = differenceInDays(new Date(), new Date(data?.resultTreatmentStatusChangedOn ?? new Date()))
  const changedOn = data.resultTreatmentStatusChangedOn
  if (_.isNil(changedOn) && daysInCurrentStatus === 0) return {}
  return {
    changedOn,
    name: data.resultTreatmentStatusName,
    externalId: data.resultTreatmentStatusExternalId,
    i18nKey: data.resultTreatmentStatusI18nKey,
    visible:
      isNotTransferred && (data.resultCategoryAssay1RequiresTreatment || data.resultCategoryAssay2RequiresTreatment),
    severity: generateSeverity(data, followUps),
    daysInCurrentStatus,
  }
}

module.exports = { transformTreatmentStatus }
