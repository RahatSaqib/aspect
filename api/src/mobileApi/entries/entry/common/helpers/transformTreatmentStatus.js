const _ = require('lodash')
const { differenceInDays } = require('date-fns')
const { generateTransferStatus } = require('./generateTransferStatus')
const { generateSeverity } = require('./generateSeverity')

function transformTreatmentStatus(data, followUps) {
  const isNotTransferred = _.isNil(generateTransferStatus(data))
  return {
    changedOn: data.resultTreatmentStatusChangedOn,
    name: data.resultTreatmentStatusName,
    externalId: data.resultTreatmentStatusExternalId,
    i18nKey: data.resultTreatmentStatusI18nKey,
    visible: isNotTransferred && data.resultRequiresTreatment === 1,
    severity: generateSeverity(data, followUps),
    daysInCurrentStatus: differenceInDays(new Date(), new Date(data?.resultTreatmentStatusChangedOn ?? new Date())),
  }
}

module.exports = { transformTreatmentStatus }
