module.exports = require('../utils').seed(seed, __filename)

const {
  getPartnerByExternalId,
  seedIssueEventTriggersForPartner,
  seedIssueEscalationTriggersForPartner,
} = require('../utils')

const { addIssueTypes } = require('../relativeObjectsSeeds')

const {
  partner: { externalId: partnerExternalId },
  adminUserName,
} = require('./fixtures/partnerData')

async function seed(knex) {
  const { id: partnerId } = await getPartnerByExternalId(knex, partnerExternalId)

  const { id: adminId } = await knex('User').where('name', adminUserName).first('id')

  const issueTypeExternalId = 'ResultReceived'

  // seed the issue type itself
  await addIssueTypes(knex, partnerId, adminId, [issueTypeExternalId])

  // seed issue event trigger
  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: [issueTypeExternalId],
  })

  // use escalation triggers to notify about new MTB+ Rif+ and MTB+ Rif+ results:
  await seedIssueEscalationTriggersForPartner(knex, partnerId, ['ResultCategory1DetectedResultCategory2Detected'])

  // set up the notifications that should go out
  const now = new Date()

  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const { id: messageSeverityId } = await knex('MessageSeverity').where('externalId', 'Alert').first('id')

  const { id: issueTypeId } = await knex('IssueType').where('externalId', issueTypeExternalId).first('id')

  const { id: jobFunctionId } = await knex('JobFunction').where('externalId', 'regionalOfficer').first('id')

  // Notify via email
  const resultRifPositiveMessage =
    'Це повідомлення про ризик МРТБ, оброблене {{formatDate result.endedOn}} в {{ device.name }}'
  const [result1PositiveEmailTemplateId] = await knex('EmailTemplate').insert({
    subject: 'Ризик МРТБ {{ device.name }}',
    body: resultRifPositiveMessage,
    htmlBody: resultRifPositiveMessage.replace('\n', '<br/>'),
    ...auditFields,
  })

  const [resultRifPositiveMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId,
    emailTemplateId: result1PositiveEmailTemplateId,
  })

  await knex('NotificationType').insert({
    partnerId,
    issueTypeId,
    jobFunctionId,
    level: 3,
    canAcknowledge: 0,
    messageTypeId: resultRifPositiveMessageTypeId,
    name: 'Ризик МРТБ',
    ...auditFields,
    sendToContactsWithMatchingTags: 0,
  })
}
