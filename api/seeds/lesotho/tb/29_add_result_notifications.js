module.exports = require('../../utils').seed(seed, __filename)

const Promise = require('bluebird')

const { upsertJobFunctionFixture } = require('../../common')

const {
  getPartnerByName,
  seedIssueEventTriggersForPartner,
  seedIssueEscalationTriggersForPartner,
} = require('../../utils')

const { addIssueTypes } = require('../../relativeObjectsSeeds')

const { partnerName, adminUserName } = require('./fixtures/partnerData')

const fixture = require('../shared/fixtures/jobFunctions')

const cellsToNotify = ['+26663212251', '+266 58434642', '+266 62949666']

async function seed(knex) {
  const { id: partnerId } = await getPartnerByName(knex, partnerName)

  await upsertJobFunctionFixture(knex, fixture, partnerId)

  const persons = await knex('Person').whereIn('cell', cellsToNotify).select('id')

  const { id: jobFunctionId } = await knex('JobFunction').where({ externalId: 'dataViewer', partnerId }).first()

  const { id: geographyId } = await knex('Geography').whereNull('stateId').whereNull('lgaId').first()

  await Promise.each(persons, async person => {
    const [jobId] = await knex('Job').insert({
      personId: person.id,
      jobFunctionId,
    })
    await knex('JobContext').insert({
      jobId,
      geographyId,
    })
  })

  const { id: adminId } = await knex('User').where('name', adminUserName).first('id')

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

  const { id: messageSeverityId } = await knex('MessageSeverity').where('externalId', 'Alert').first('id')

  const { id: issueTypeId } = await knex('IssueType').where('externalId', issueTypeExternalId).first('id')

  // Result 1 positive.
  const result1PositiveMessage =
    'Dear {{person.name}}, this is a MTB+ notification for {{ result.patient.id }} processed on {{ formatDate result.endedOn }} at {{ device.name }}, {{ site.state }}'
  const [result1PositiveSmsTemplateId] = await knex('SmsTemplate').insert({
    message: result1PositiveMessage,
    ...auditFields,
  })

  const [resul1PositiveMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId,
    smsTemplateId: result1PositiveSmsTemplateId,
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

  // Result 2 positive
  const result2PositiveMessage =
    'Dear {{person.name}}, this is a MTB+RIF+ notification for {{ result.patient.id }} processed on {{ formatDate result.endedOn }} at {{ device.name }} {{ site.state }}'

  const [result2PositiveSmsTemplateId] = await knex('SmsTemplate').insert({
    message: result2PositiveMessage,
    ...auditFields,
  })

  const [resul2PositiveMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId,
    smsTemplateId: result2PositiveSmsTemplateId,
  })

  await knex('NotificationType').insert({
    partnerId,
    issueTypeId,
    jobFunctionId,
    level: 3,
    canAcknowledge: 0,
    messageTypeId: resul2PositiveMessageTypeId,
    name: 'MTB+ RIF+ Result',
    ...auditFields,
    sendToContactsWithMatchingTags: 0,
  })
}
