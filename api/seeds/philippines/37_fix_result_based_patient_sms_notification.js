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
  const { patientSmsTemplateId } =
    (await knex('SmsTemplate')
      .where(
        'message',
        'LIKE',
        'Your {{result.assay.name}} result tested last {{formatDate%'
      )
      .first('id as patientSmsTemplateId')) || {}
  if (patientSmsTemplateId) {
    const smsDateFormat = 'dd/MM/yyyy'
    await knex('SmsTemplate')
      .where('id', patientSmsTemplateId)
      .update({
        message: `Your {{result.assay.name}} result tested last {{formatDate (coalesce result.endedOn result.startedOn result.patient.dateReceived) formatString='${smsDateFormat}'}} is already available. Please contact {{result.patient.referringHealthFacility}} to schedule a follow-up consultation`,
        phoneNumber: `{{(formatPhone result.patient.phone result.country.dialingCode)}}`,
        ...auditFields,
      })
  }
}
