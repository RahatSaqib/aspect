const Promise = require('bluebird')
const { getBaseIssues } = require('../relatedObjects/issues.js')
module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const issues = getBaseIssues({})
  const emailTemplatesId = await knex('IssueType as it')
    .whereIn('it.externalId', [
      'ProbeCheckTooHighModule',
      'TooManyInvalidResultsModule',
      'ProbeCheckFailedModule',
      'SignalLossDetectedInAmplificationCurveModule',
      'FailedToVerifyValidBackgroundErrorForAnalyteModule',
      'ProbeCheckTooHighLot',
      'TooManyInvalidResultsLot',
      'ProbeCheckFailedLot',
      'SignalLossDetectedInAmplificationCurveLot',
      'FailedToVerifyValidBackgroundErrorForAnalyteLot',
    ])
    .join('NotificationType as nt', 'nt.issueTypeId', 'it.id')
    .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .join('EmailTemplate as et', 'mt.emailTemplateId', 'et.id')
    .select('et.id as emailTemplateId, it.externalId')
  await Promise.each(emailTemplatesId, et => {
    if (issues[et.externalId])
      return knex('EmailTemplate').update(issues[et.externalId].EmailTemplate).where('id', et.emailTemplateId)
  })
}

module.exports = seed
