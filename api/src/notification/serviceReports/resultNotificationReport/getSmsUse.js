const { knex } = require('../../../db')
const getMessagesBaseQuery = require('./getMessagesBaseQuery')

async function getSmsUse(dataConstraints, params) {
  return getMessagesBaseQuery(dataConstraints, params)
    .join('SmsMessage as m', 'n.smsMessageId', 'm.id')
    .join('MessageStatus as ms', 'm.messageStatusId', 'ms.id')
    .whereNotNull('m.phoneNumber')
    .select(
      'nt.name as notification',
      'p.name as recipient',
      'm.phoneNumber as mobilePhone',
      'p.email',
      'm.message',
      'm.updatedOn as sentOn',
      'd.name as device',
      knex.raw(`r.patientData -> '$.id' as patientId`),
      's.externalId as sampleId',
      'r.endedOn',
      knex.raw(`r.resultData -> '$.resultText' as resultText`)
    )
}

module.exports = getSmsUse
