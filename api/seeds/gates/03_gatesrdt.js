module.exports = require('../../src/db').seed(seed)

const { rowsAsObject, seedIssueEventTriggersForPartner } = require('../utils')

async function seed(knex) {
  // Skip this seed file if we already have an  Issue
  const [
    issueTypes,
    issueCategories,
    messageSeverities,
    webhookTemplates,
  ] = await Promise.all([
    rowsAsObject(knex, 'IssueType', 'externalId'),
    rowsAsObject(knex, 'IssueCategory', 'externalId'),
    rowsAsObject(knex, 'MessageSeverity', 'externalId'),
    rowsAsObject(knex, 'WebhookTemplate', 'externalId'),
  ])
  if (issueTypes.ResultReceived) {
    return
  }

  const now = new Date()
  const { id: adminId } = await knex('User')
    .where({ name: 'gates_rdt' })
    .first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const { id: adminJobFunctionId, partnerId } = await knex('JobContext as jc')
    .innerJoin('Job as j', 'jc.jobId', 'j.id')
    .innerJoin('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
    .innerJoin('Person as ps', 'j.personId', 'ps.id')
    .where({
      'ps.userId': adminId,
    })
    .first('jf.id', 'jf.partnerId')

  const [resultPositiveSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        phoneNumber: '{{ result.patient.phone }}',
        message:
          'Dear participant ID #{{ result.patient.id }}: An HIV self-test is a screening test. Please visit your nearest clinic as your test MUST be confirmed by a healthcare worker as soon as possible',
      },
      auditFields
    )
  )
  const [resultNegativeSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        phoneNumber: '{{ result.patient.phone }}',
        message:
          'Dear participant ID #{{ result.patient.id }}: An HIV self-test is a screening test. Please ensure you re-test in 3 months.',
      },
      auditFields
    )
  )

  const [resultReceivedMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert.id,
    webhookTemplateId: webhookTemplates.commcareDownloadImage.id,
  })

  const [resultPositiveMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert.id,
    smsTemplateId: resultPositiveSmsTemplateId,
  })

  const [resultNegativeMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert.id,
    smsTemplateId: resultNegativeSmsTemplateId,
  })

  const [issueTypeResultReceivedId] = await knex('IssueType').insert({
    name: 'Result Received',
    externalId: 'ResultReceived',
    i18nKey: 'issueTypeResultReceived',
    issueCategoryId: issueCategories.DataHealth.id,
    defaultMessageTypeId: resultReceivedMessageTypeId,
  })

  // Notifications
  await knex('NotificationType').insert([
    Object.assign(
      {
        name: 'Result Received',
        partnerId,
        issueTypeId: issueTypeResultReceivedId,
        jobFunctionId: adminJobFunctionId,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: resultReceivedMessageTypeId,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'Result Negative',
        partnerId,
        issueTypeId: issueTypeResultReceivedId,
        jobFunctionId: adminJobFunctionId,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: resultNegativeMessageTypeId,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'Result Positive',
        partnerId,
        issueTypeId: issueTypeResultReceivedId,
        jobFunctionId: adminJobFunctionId,
        level: 3,
        canAcknowledge: 0,
        messageTypeId: resultPositiveMessageTypeId,
      },
      auditFields
    ),
  ])

  // Issue Escalation Triggers
  await knex('IssueEscalationTrigger').insert([
    {
      issueTypeId: issueTypeResultReceivedId,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'result-category',
        evaluationParameter: { index: 2, externalId: 'NotDetected' },
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypeResultReceivedId,
      partnerId,
      escalateToLevel: 3,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'result-category',
        evaluationParameter: { index: 2, externalId: 'Detected' },
      }),
      createdOn: now,
      updatedOn: now,
    },
  ])

  // show patient ID in expanded view:
  await knex('Assay')
    .where('externalId', 'CommCareGatesRDT')
    .update(
      'patientDataSchema',
      JSON.stringify({
        id: { type: 'string', order: 0, title: 'Patient ID' },
        age: { type: 'int', order: 1, title: 'Age' },
        gender: { type: 'string', order: 2, title: 'Gender' },
        phone: { type: 'string', order: 3, title: 'Phone Number' },
        educationLevel: { type: 'string', order: 4, title: 'Education Level' },
        previousTesting: {
          type: 'string',
          order: 5,
          title: 'Previous Testing',
        },
      })
    )

  await seedIssueEventTriggersForPartner(knex, partnerId)
}
