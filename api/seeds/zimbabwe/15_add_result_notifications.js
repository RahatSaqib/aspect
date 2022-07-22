module.exports = require('../utils').seed(seed, __filename)

const { seedIssueEventTriggersForPartner, seedIssueEscalationTriggersForPartner } = require('../utils')

const { messageSeverityToId, issueTypeToId } = require('../../src/shared/dictionary')

const { addIssueTypes } = require('../relativeObjectsSeeds')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where('name', 'Zimbabwe').first('id')

  const { id: adminId } = await knex('User').where('name', 'admin').first('id')

  const issueTypeExternalId = 'ResultReceived'

  // seed the issue type itself
  await addIssueTypes(knex, partnerId, adminId, [issueTypeExternalId])

  // seed issue event trigger
  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: [issueTypeExternalId],
  })

  // use escalation triggers to notify about new MTB+ Rif- and MTB+ Rif+ results:
  await seedIssueEscalationTriggersForPartner(knex, partnerId, [
    'ResultCategory1DetectedResultCategory2NotDetected',
    'ResultCategory1DetectedResultCategory2Detected',
  ])

  // set up the notifications that should go out
  const now = new Date()

  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const messageSeverityId = await messageSeverityToId('Alert')
  const issueTypeId = await issueTypeToId('ResultReceived')
  const { id: jobFunctionId } = await knex('JobFunction').where('externalId', 'regionalOfficer').first('id')

  // Result 1 positive only via email.
  const result1PositiveMessage =
    'Dear {{person.name}},\nThis is a Positive GeneXpert MTB detected notification for {{ result.patient.id }} processed on {{ result.endedOn }} at {{ device.name }}'
  const [result1PositiveEmailTemplateId] = await knex('EmailTemplate').insert({
    subject: 'MTB+ Result',
    body: result1PositiveMessage,
    htmlBody: result1PositiveMessage.replace('\n', '<br/>'),
    ...auditFields,
  })

  const [resul1PositiveMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId,
    emailTemplateId: result1PositiveEmailTemplateId,
  })

  await knex('NotificationType').insert({
    partnerId,
    issueTypeId,
    jobFunctionId,
    level: 2,
    canAcknowledge: 0,
    messageTypeId: resul1PositiveMessageTypeId,
    name: 'MTB+ Result',
    ...auditFields,
    sendToContactsWithMatchingTags: 0,
  })

  // If 1 and 2 positive, email and sms
  const result2PositiveMessage =
    'Dear {{person.name}},\nThis is a Positive GeneXpert MTB detected, RIF Resistance Detected notification for {{ result.patient.id }} processed on {{ result.endedOn }} at {{ device.name }}'
  const [result2PositiveEmailTemplateId] = await knex('EmailTemplate').insert({
    subject: 'MTB+ RIF+ Result',
    body: result2PositiveMessage,
    htmlBody: result2PositiveMessage.replace('\n', '<br/>'),
    ...auditFields,
  })
  const [result2PositiveSmsTemplateId] = await knex('SmsTemplate').insert({
    message: result2PositiveMessage,
    ...auditFields,
  })

  const [resul2PositiveMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId,
    emailTemplateId: result2PositiveEmailTemplateId,
    smsTemplateId: result2PositiveSmsTemplateId,
  })

  await knex('NotificationType').insert({
    partnerId,
    issueTypeId,
    jobFunctionId,
    level: 3,
    canAcknowledge: 0,
    messageTypeId: resul2PositiveMessageTypeId,
    name: 'MTB+ Rif+ Result',
    ...auditFields,
    sendToContactsWithMatchingTags: 0,
  })
}
