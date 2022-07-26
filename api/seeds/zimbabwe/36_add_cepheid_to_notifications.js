const Promise = require('bluebird')
const omit = require('lodash/omit')

module.exports = require('../utils').seed(async knex => {
  const { id: deviceMakerId } = await knex('JobFunction').where('externalId', 'deviceMaker').first()

  // The issue types excluded are NewResultsAvailable, ResultReceived and ResultReceived
  const issueTypes = [
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

  const issueTypesIds = await knex('IssueType').whereIn('externalId', issueTypes).pluck('id')
  await Promise.each(issueTypesIds, async issueTypeId => {
    const notification = await knex('NotificationType').where({ issueTypeId }).first()
    await knex('NotificationType').insert({
      ...omit(notification, 'id'),
      jobFunctionId: deviceMakerId,
    })
  })
}, __filename)
