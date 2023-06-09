module.exports = require('../utils').seed(seed, __filename)

const { getPartnerByExternalId } = require('../utils')
const { messageSeverityToId, issueCategoryToId, issueEventStatusToId } = require('../../src/shared/dictionary')

async function seed(knex) {
  const { id: partnerId } = await getPartnerByExternalId(knex, 'Philippines')
  await knex('Partner').where('id', partnerId).update('plugin', 'philippines')
  const now = new Date()
  const { id: adminId } = await knex('User').where({ name: 'admin' }).first('id')

  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  const smsDateFormat = 'dd/MM/yyyy'
  const [patientSmsTemplateId] = await knex('SmsTemplate').insert({
    message: `Your {{result.assay.name}} result tested last {{formatDate (coalesce result.endedOn result.startedOn result.patient.dateReceived) formatString='${smsDateFormat}'}} is already available. Please contact {{defaultTo (coalesce result.patient.referringHealthFacility result.reportableSiteName) 'your health facility'}} to schedule a follow-up consultation`,
    phoneNumber: `{{(formatPhone result.patient.phone result.country.dialingCode)}}`,
    ...auditFields,
  })
  const messageSeverityAlertId = await messageSeverityToId('Alert')

  const [patientAdvisoryMessageTypeId] = await knex('MessageType').insert([
    {
      messageSeverityId: messageSeverityAlertId,
      smsTemplateId: patientSmsTemplateId,
    },
  ])

  const issueCategoryDataHealthId = await issueCategoryToId('DataHealth')

  const [issueTypePatientSmsResultUpdatedId] = await knex('IssueType').insert({
    name: 'Result With Patient Phone Updated',
    externalId: 'ResultUpdatedPatientSms',
    i18nKey: 'issueTypeResultUpdatedPatientSms',
    issueCategoryId: issueCategoryDataHealthId,
  })

  await knex('NotificationType').insert({
    name: 'Result Patient SMS',
    partnerId,
    issueTypeId: issueTypePatientSmsResultUpdatedId,
    level: 1,
    canAcknowledge: 0,
    messageTypeId: patientAdvisoryMessageTypeId,
    ...auditFields,
  })

  const triggeredIssueEventStatusId = await issueEventStatusToId('Triggered')

  await knex('IssueEventTrigger').insert({
    partnerId,
    issueTypeId: issueTypePatientSmsResultUpdatedId,
    issueEventStatusId: triggeredIssueEventStatusId,
    triggerConditions: JSON.stringify({
      action: 'RESULT_LOGGED',
      conditions: {
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'shouldSendResultToPatientAsSms',
      },
    }),
    createdOn: auditFields.createdOn,
    updatedOn: auditFields.updatedOn,
  })

  const { id: issueTypeResultUpdatedId } = await knex('IssueType').where('externalId', 'ResultUpdated').first('id')

  const { id: resultUpdatedIssueEventTriggerId } = await knex('IssueEventTrigger')
    .where('issueTypeId', issueTypeResultUpdatedId)
    .andWhere('issueEventStatusId', triggeredIssueEventStatusId)
    .andWhere('partnerId', partnerId)
    .first('id')
  await knex('IssueEventTrigger')
    .where('id', resultUpdatedIssueEventTriggerId)
    .update({
      triggerConditions: JSON.stringify({
        action: 'RESULT_LOGGED',
        conditions: {
          evaluationMethod: 'plugin-function',
          evaluationParameter: 'shouldSendResultToItis',
        },
      }),
      updatedOn: auditFields.updatedOn,
    })

  await knex('IssueResolutionTrigger').insert({
    issueTypeId: issueTypePatientSmsResultUpdatedId,
    partnerId,
    resolutionConditions: JSON.stringify({
      evaluationMethod: 'plugin-function',
      evaluationParameter: 'shouldResolveResultUpdatedPatientSmsIssue',
    }),
    createdOn: auditFields.createdOn,
    updatedOn: auditFields.updatedOn,
  })
}
