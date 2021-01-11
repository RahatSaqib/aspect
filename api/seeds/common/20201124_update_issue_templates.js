module.exports = require('../utils').seed(seed, __filename)

const {
  deleteIssueTypes,
  updateIssueNotificationTemplates,
} = require('../utils')

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
      'ProbeCheckTooLow',
      'ProbeCheckTooHigh',
      'TooManyInvalidResults',
      'ProbeCheckFailed',
      'SignalLossDetectedInAmplificationCurve',
      'FailedToVerifyValidBackgroundErrorForAnalyte',
      'CartridgeIntegrityTestFailure',
      'SyringePressureTooHigh',
      'SyringeStallError',
      'UltrasonicHornFailure',
      'UltrasonicHornTuningError',
      'UltrasonicHornCurrentOutOfRange',
      'AssaySpecificTerminationError1',
      'AssaySpecificTerminationError2',
    ],
    {
      userName: 'admin',
    }
  )
}
module.exports = seed
