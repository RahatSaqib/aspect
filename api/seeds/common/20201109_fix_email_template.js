module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const emailTemplatesId = await knex('IssueType as it')
    .whereIn('it.externalId', [
      'ProbeCheckTooHigh',
      'TooManyInvalidResults',
      'ProbeCheckFailed',
      'SignalLossDetectedInAmplificationCurve',
      'FailedToVerifyValidBackgroundErrorForAnalyte',
    ])
    .join('NotificationType as nt', 'nt.issueTypeId', 'it.id')
    .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .join('EmailTemplate as et', 'mt.emailTemplateId', 'et.id')
    .select('et.id')
    .pluck('et.id')

  await knex('EmailTemplate')
    .update({
      body: knex.raw("REPLACE(body,'Module Slot:','Module Name or Serial:')"),
      htmlBody: knex.raw(
        "REPLACE(htmlBody,'Module Slot:','Module Name or Serial:')"
      ),
    })
    .whereIn('id', emailTemplatesId)
}

module.exports = seed
