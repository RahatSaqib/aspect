module.exports = require('../utils').seed(seed, __filename)

const { deleteIssueTypes, updateIssueNotificationTemplates } = require('../utils')

async function seed(knex) {
  // delete issue types we no longer need
  await deleteIssueTypes(knex, [
    'CartridgeIntegrityTestFailureModule',
    'SyringePressureTooHighModule',
    'SyringeStallErrorModule',
    'UltrasonicHornFailureLot',
    'UltrasonicHornTuningErrorLot',
    'UltrasonicHornCurrentOutOfRangeLot',
  ])

  // update templates
  await updateIssueNotificationTemplates(
    knex,
    [
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
      'CartridgeIntegrityTestFailureModule',
      'CartridgeIntegrityTestFailureLot',
      'SyringePressureTooHighModule',
      'SyringePressureTooHighLot',
      'SyringeStallErrorModule',
      'SyringeStallErrorLot',
      'UltrasonicHornFailureModule',
      'UltrasonicHornFailureLot',
      'UltrasonicHornTuningErrorModule',
      'UltrasonicHornTuningErrorLot',
      'UltrasonicHornCurrentOutOfRangeModule',
      'UltrasonicHornCurrentOutOfRangeLot',
      'AssaySpecificTerminationError1Module',
      'AssaySpecificTerminationError1Lot',
      'AssaySpecificTerminationError2Module',
      'AssaySpecificTerminationError2Lot',
    ],
    {
      userName: 'admin',
    }
  )
}
module.exports = seed
