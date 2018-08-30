module.exports = require('../utils').seed(seed)
const { rowsAsObject } = require('../utils')
const {
  featureToId,
  issueCategoryToId,
  messageSeverityToId,
} = require('../../src/shared/dictionary')

const now = new Date()

async function seed(knex) {
  const issueTypeDeviceMaintenance = await knex('IssueType')
    .where({ externalId: 'DeviceMaintenance' })
    .first('id')
  if (issueTypeDeviceMaintenance != null) {
    return
  }

  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Myanmar' })
    .first()

  const { id: adminId } = await knex('User as u')
    .where({ 'u.name': 'myanmar_admin' })
    .first('u.id')

  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // Reuse previously seeded "static" data
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')

  // change issue/notification types from "Generic" to "Procedural"
  await knex('NotificationType').update({
    name: knex.raw("replace(name, 'Generic', 'Procedural')"),
  })

  await knex('IssueType').update({
    name: knex.raw("replace(name, 'Generic', 'Procedural')"),
    i18nKey: knex.raw("replace(i18nKey, 'Generic', 'Procedural')"),
    externalId: knex.raw("replace(externalId, 'Generic', 'Procedural')"),
  })

  await knex('AlertTemplate').update({
    message: knex.raw("replace(message, 'Generic', 'Procedural')"),
  })

  await knex('AlertMessage').update({
    message: knex.raw("replace(message, 'Generic', 'Procedural')"),
  })

  await knex('EmailTemplate').update({
    subject: knex.raw("replace(subject, 'Generic', 'Procedural')"),
    body: knex.raw("replace(body, 'Generic', 'Procedural')"),
    htmlBody: knex.raw("replace(htmlBody, 'Generic', 'Procedural')"),
  })

  await knex('EmailMessage').update({
    subject: knex.raw("replace(subject, 'Generic', 'Procedural')"),
    body: knex.raw("replace(body, 'Generic', 'Procedural')"),
    htmlBody: knex.raw("replace(htmlBody, 'Generic', 'Procedural')"),
  })

  await knex('SmsTemplate').update({
    message: knex.raw("replace(message, 'Generic', 'Procedural')"),
  })

  await knex('SmsMessage').update({
    message: knex.raw("replace(message, 'Generic', 'Procedural')"),
  })

  await knex('Partner')
    .where({ id: partnerId })
    .update({ maxDaysDeviceNoResults: 14 })

  // Issue Escalation Triggers
  await knex('IssueEscalationTrigger').insert([
    {
      issueTypeId: issueTypes.DeviceNoResults.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 7 },
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.DeviceNoResults.id,
      partnerId,
      escalateToLevel: 3,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'sql-script',
        evaluationParameter:
          './sqlScripts/Myanmar/issues/escalations/deviceNoResultsLevel3ROEscalatedNoResults.sql',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.ModulePowerError.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 30 },
      }),
      createdOn: now,
      updatedOn: now,
    },
  ])

  // Add Device Maintenance issue (no notifications for Myanmar, only issue generation)
  const [deviceMaintenanceAlertTemplateId] = await knex('AlertTemplate').insert(
    Object.assign(
      {
        message: 'Device Maintenance',
      },
      auditFields
    )
  )

  const [deviceMaintenanceSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message: '{{site.name}} maintenance',
      },
      auditFields
    )
  )

  const [deviceMaintenanceEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject: '{{site.name}} Maintenance',
        body: '{{site.name}} maintenance',
        htmlBody: '{{site.name}} maintenance',
      },
      auditFields
    )
  )

  const [deviceMaintenanceMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId: await messageSeverityToId('Recommendation'),
    alertTemplateId: deviceMaintenanceAlertTemplateId,
    smsTemplateId: deviceMaintenanceSmsTemplateId,
    emailTemplateId: deviceMaintenanceEmailTemplateId,
  })

  await knex('IssueType').insert({
    name: 'Device Maintenance',
    externalId: 'DeviceMaintenance',
    i18nKey: 'issueTypeDeviceMaintenance',
    issueCategoryId: await issueCategoryToId('DeviceHealth'),
    defaultMessageTypeId: deviceMaintenanceMessageTypeId,
  })

  const { id: jobFunctionIdLabUser } = await knex('JobFunction')
    .where({ name: 'Lab User', partnerId })
    .first('id')

  await knex('JobFunctionFeature').insert({
    jobFunctionId: jobFunctionIdLabUser,
    featureId: await featureToId('siteFilterDashboard'),
  })
}
