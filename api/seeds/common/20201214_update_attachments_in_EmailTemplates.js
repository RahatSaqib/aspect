module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const cepheidIssueTypes = [
    'ProbeCheckTooLowModule',
    'ProbeCheckTooLowLot',
    'ProbeCheckTooHighModule',
    'ProbeCheckTooHighLot',
    'TooManyInvalidResultsModule',
    'TooManyInvalidResultsLot',
    'ProbeCheckFailedModule',
    'ProbeCheckFailedLot',
    'SignalLossDetectedInAmplificationCurveModule',
    'SignalLossDetectedInAmplificationCurveLot',
    'FailedToVerifyValidBackgroundErrorForAnalyteModule',
    'FailedToVerifyValidBackgroundErrorForAnalyteLot',
    'CartridgeIntegrityTestFailureLot',
    'SyringePressureTooHighLot',
    'SyringeStallErrorLot',
    'UltrasonicHornFailureModule',
    'UltrasonicHornTuningErrorModule',
    'UltrasonicHornCurrentOutOfRangeModule',
    'AssaySpecificTerminationError1Module',
    'AssaySpecificTerminationError1Lot',
    'AssaySpecificTerminationError2Module',
    'AssaySpecificTerminationError2Lot',
  ]
  const emailTemplateIds = await knex('IssueType as it')
    .innerJoin('MessageType as mt', 'it.defaultMessageTypeId', 'mt.id')
    .innerJoin('EmailTemplate as et', 'mt.emailTemplateId', 'et.id')
    .whereIn('it.externalId', cepheidIssueTypes)
    .pluck('et.id')
    .distinct()

  await knex('EmailTemplate')
    .update({
      attachments: JSON.stringify([
        {
          type: 'error-history',
          period: 'last-30-days',
        },
      ]),
    })
    .whereIn('id', emailTemplateIds)
}
module.exports = seed
