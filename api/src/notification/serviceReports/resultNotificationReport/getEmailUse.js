const { knex } = require('../../../db')
const getMessagesBaseQuery = require('./getMessagesBaseQuery')

async function getEmailUse(dataConstraints, params) {
  return getMessagesBaseQuery(dataConstraints, params)
    .join('EmailMessage as m', 'n.emailMessageId', 'm.id')
    .join('MessageStatus as ms', 'm.messageStatusId', 'ms.id')
    .whereNotNull('m.to')
    .select(
      'nt.name as notification',
      'p.name as recipient',
      'p.cell as mobilePhone',
      'p.email',
      'm.subject',
      'm.body',
      'm.updatedOn as sentOn',
      'd.name as device',
      knex.raw(`r.patientData -> '$.id' as patientId`),
      's.externalId as sampleId',
      'r.endedOn',
      knex.raw(`r.resultData -> '$.resultText' as resultText`)
    )
}

module.exports = getEmailUse
