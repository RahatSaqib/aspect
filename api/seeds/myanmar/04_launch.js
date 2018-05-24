module.exports = require('../../src/db').seed(seed)
const { rowsAsObject } = require('../utils')

const now = new Date()

async function seed(knex) {
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

  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Myanmar' })
    .first()

  await knex('Partner')
    .where({ id: partnerId })
    .update({ maxDaysDeviceNoResults: 14 })

  // Reuse previously seeded "static" data
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')

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
  ])
}
