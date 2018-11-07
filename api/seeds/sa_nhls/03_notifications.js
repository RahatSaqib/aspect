module.exports = require('../utils').seed(seed)

const config = require('../../src/config')
const {
  fileContentTypeToId,
  messageSeverityToId,
  issueCategoryToId,
  issueEventStatusToId,
} = require('../../src/shared/dictionary')

async function seed(knex) {
  const now = new Date()
  const { id: adminId } = await knex('User')
    .where({ name: 'nhls_eid' })
    .first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // TODO: Allow user to navigate to result from action dashboard
  const [newResultAlertTemplateId] = await knex('AlertTemplate').insert(
    Object.assign(
      {
        message: 'New Result Uploaded {{sample.externalId}}',
      },
      auditFields
    )
  )

  const [redCapAlereQHiv12DetectWebHookTemplateId] = await knex(
    'WebhookTemplate'
  ).insert(
    Object.assign(
      {
        externalId: 'redCapAlereQHiv12Detect',
        method: 'POST',
        url: config.webhook.redcap.url,
        payload: `token=${config.webhook.redcap.authToken}&content=record&format=json&type=flat&overwriteBehavior=normal&forceAutoNumber=true&data=%5B%7B%22record_id%22%3A%221%22%2C+%22redcap_data_access_group%22%3A[DeploymentHostId|filters:{"Rahima Moosa Mother and Child Hospital":"rmmch","CHBAH Maternity POCT":"chbah","CHBAH":"chbah","CMJAH":"cmjah","Kalafong KPTH":"kalafong","Dora Nginza Hospital":""}>double_quote>url_encode|default:%22%22]%2C+%22first_name%22%3A[Name|filters:double_quote>url_encode|default:%22%22]%2C+%22surname%22%3A[Surname|filters:double_quote>url_encode|default:%22%22]%2C+%22hospital_number%22%3A[Hospital Number|filters:double_quote>url_encode|default:%22%22]%2C+%22site_code%22%3A[DeploymentHostId|filters:{"Rahima Moosa Mother and Child Hospital":"R","CHBAH Maternity POCT":"B","CHBAH":"B","CMJAH":"J","Kalafong KPTH":"K","Dora Nginza Hospital":"D"}>double_quote>url_encode|default:%22%22]%2C+%22ward_cubicle%22%3A[Ward|filters:double_quote>url_encode|default:%22%22]%2C+%22sample_category%22%3A[Sample Type|filters:double_quote>url_encode|default:%22%22]%2C+%22instrument_ca%22%3A%221%22%2C+%22assayhiv%22%3A%222%22%2C+%22sample_barcode%22%3A[SampleId|filters:double_quote>url_encode|default:%22%22]%2C+%22sample_taken%22%3A[TestStartedOn|filters:yyyy-MM-dd HH:mm>double_quote>url_encode|default:%22%22]%2C+%22point_of_care_instrument_r%22%3A[Result1|filters:{"Positive":"1","Negative":"2","No Result":"3","Invalid":"3","Error":"4"}>double_quote>url_encode|default:%22%22]%2C+%22error_code1%22%3A[ErrorCode|filters:double_quote>url_encode|default:%22%22]%2C+%22poc_viral_load%22%3A%22%22%2C+%22ct_value%22%3A[ProbeCCt|filters:double_quote>url_encode|default:%220%22]%2C+%22result_instrument%22%3A[TestEndedOn|filters:yyyy-MM-dd HH:mm>double_quote>url_encode|default:%22%22]%7D%5D&returnContent=ids&returnFormat=json`,
        fileContentTypeId: await fileContentTypeToId('formUrlEncoded'),
      },
      auditFields
    )
  )

  const messageSeverityAlertId = await messageSeverityToId('Alert')

  const [resultUploadedMessageTypeId] = await knex('MessageType').insert([
    {
      messageSeverityId: messageSeverityAlertId,
      alertTemplateId: newResultAlertTemplateId,
    },
  ])
  const [resultDataEnteredMessageTypeId] = await knex('MessageType').insert([
    {
      messageSeverityId: messageSeverityAlertId,
      webhookTemplateId: redCapAlereQHiv12DetectWebHookTemplateId,
    },
  ])

  const issueCategoryDataHealthId = await issueCategoryToId('DataHealth')

  const [issueTypeResultUploadedId] = await knex('IssueType').insert([
    {
      name: 'Result Uploaded',
      externalId: 'ResultUploaded',
      i18nKey: 'issueTypeResultUploaded',
      issueCategoryId: issueCategoryDataHealthId,
      defaultMessageTypeId: resultUploadedMessageTypeId,
    },
  ])
  const [issueTypeResultDataEnteredId] = await knex('IssueType').insert([
    {
      name: 'Result Data Entered',
      externalId: 'ResultDataEntered',
      i18nKey: 'issueTypeResultDataEntered',
      issueCategoryId: issueCategoryDataHealthId,
      defaultMessageTypeId: resultDataEnteredMessageTypeId,
    },
  ])

  const { id: partnerId } = await knex('Partner')
    .where('name', 'South Africa NHLS')
    .first()

  const { id: adminJobFunctionId } = await knex('JobFunction')
    .where({ name: 'Admin', partnerId })
    .first('id')

  await knex('NotificationType').insert([
    Object.assign(
      {
        name: 'Result Uploaded',
        partnerId,
        issueTypeId: issueTypeResultUploadedId,
        jobFunctionId: adminJobFunctionId,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: resultUploadedMessageTypeId,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'Result Data Entered',
        partnerId,
        issueTypeId: issueTypeResultDataEnteredId,
        jobFunctionId: adminJobFunctionId,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: resultDataEnteredMessageTypeId,
      },
      auditFields
    ),
  ])

  await knex('IssueEventTrigger').insert([
    {
      partnerId,
      issueTypeId: issueTypeResultUploadedId,
      issueEventStatusId: await issueEventStatusToId('Triggered'),
      triggerConditions: '{ "action": "RESULT_LOGGED" }',
      createdOn: now,
      updatedOn: now,
    },
    {
      partnerId,
      issueTypeId: issueTypeResultDataEnteredId,
      issueEventStatusId: await issueEventStatusToId('Triggered'),
      triggerConditions: '{ "action": "RESULT_UPDATED" }',
      createdOn: now,
      updatedOn: now,
    },
  ])
}
