module.exports = require('../utils').seed(seed, __filename)

const { getPartnerByName } = require('../utils')
const {
  messageSeverityToId,
  issueCategoryToId,
  issueEventStatusToId,
} = require('../../src/shared/dictionary')

async function seed(knex) {
  const { id: partnerId } = await getPartnerByName(knex, 'Philippines')
  await knex('Partner').where('id', partnerId).update('plugin', 'philippines')
  const now = new Date()
  const { id: adminId } = await knex('User')
    .where({ name: 'admin' })
    .first('id')

  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  const smsDateFormat = 'dd/MM/yyyy'
  const [patientSmsTemplateId] = await knex('SmsTemplate').insert({
    externalId: 'patientAdvisorySms',
    message: `Your {{result.assay.name}} result tested last {{formatDate result.patient.dateReceived formatString='${smsDateFormat}}} is already available. Please contact {{result.patient.referringHealthFacility}} to schedule a follow-up consultation`,
    phoneNumber: `{{result.patient.phone}}`,
    ...auditFields,
  })
  const [referrerSmsTemplateId] = await knex('SmsTemplate').insert({
    externalId: 'patientAdvisorySms',
    message: `Your {{result.assay.name}} result tested last {{formatDate result.patient.dateReceived formatString='${smsDateFormat}}} is already available. Please contact {{result.patient.referringHealthFacility}} to schedule a follow-up consultation`,
    phoneNumber: `{{result.patient.phone}}`,
    ...auditFields,
  })

  const messageSeverityAlertId = await messageSeverityToId('Alert')

  const [patientAdvisoryMessageTypeId] = await knex('MessageType').insert([
    {
      messageSeverityId: messageSeverityAlertId,
      smsTemplateId: patientSmsTemplateId,
    },
  ])

  const [refererAdvisoryMessageTypeId] = await knex('MessageType').insert([
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
    name: 'Result Updated',
    partnerId,
    issueTypeId: issueTypePatientSmsResultUpdatedId,
    level: 1,
    canAcknowledge: 0,
    messageTypeId: patientAdvisoryMessageTypeId,
    ...auditFields,
  })

  await knex('IssueEventTrigger').insert({
    partnerId,
    issueTypeId: issueTypePatientSmsResultUpdatedId,
    issueEventStatusId: await issueEventStatusToId('Triggered'),
    triggerConditions: JSON.stringify({
      action: 'RESULT_UPDATED',
      conditions: {
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'shouldSendResultToPatientAsSms',
      },
    }),
    createdOn: auditFields.createdOn,
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
