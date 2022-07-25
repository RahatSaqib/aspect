module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')

async function seed(knex) {
  // assign all notifications we created for Cepheid to the SystemOne job function
  const { id: jobFunctionSystemOneId } = await knex('JobFunction').where('externalId', 'systemOne').first('id')

  const issueTypeIds = _.map(
    await knex('IssueType')
      .whereIn('externalId', [
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
      ])
      .select('id'),
    i => i.id
  )

  await knex('NotificationType').update('jobFunctionId', jobFunctionSystemOneId).whereIn('issueTypeId', issueTypeIds)
}
