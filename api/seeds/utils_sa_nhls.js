const _ = require('lodash')

const config = require('../src/config')
const {
  fileContentTypeToId,
  messageSeverityToId,
  issueCategoryToId,
  issueEventStatusToId,
} = require('../src/shared/dictionary')

async function seedNotifications(knex, { partnerId }) {
  const redCapUrl = _.get(config, 'webhook.redcap.url')
  const redCapAuthToken = _.get(config, 'webhook.redcap.authToken')
  if (!redCapUrl || !redCapAuthToken) {
    // eslint-disable-next-line no-console
    console.error(
      'Missing RedCAP webhook environment variables. Ensure that webhook.redcap.url and webhook.redcap.authToken are set in .env'
    )
    process.exit(1)
  }
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
        message: 'New Result Uploaded {{result.sample.id}}',
      },
      auditFields
    )
  )

  const [newResultSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message:
          'New Result Uploaded {{result.sample.id}} from {{device.name}}. Awaiting additional details to be entered in Aspect?',
      },
      auditFields
    )
  )

  const redCapDateTimeFormat = 'YYYY-MM-DD HH:mm'
  const [redCapAlereQWebHookTemplateId] = await knex('WebhookTemplate').insert(
    Object.assign(
      {
        externalId: 'redCapAlereQHiv12Detect',
        method: 'POST',
        url: redCapUrl,
        payload:
          `token=${redCapAuthToken}&content=record&format=json&type=flat&overwriteBehavior=normal&` +
          `forceAutoNumber=true&data=%5B%7B%22record_id%22%3A%221%22%2C%20` +
          `%22redcap_data_access_group%22%3A{{urlEncode (enclose (toLowerCase (defaultTo site.id '')) with='"')}}%2C%20` +
          `%22first_name%22%3A{{urlEncode (enclose (defaultTo result.formData.nameOfPatient '') with='"')}}%2C%20` +
          `%22surname%22%3A{{urlEncode (enclose (defaultTo result.formData.surnameOfPatient '') with='"')}}%2C%20` +
          `%22hospital_number%22%3A{{urlEncode (enclose (defaultTo result.formData.hospitalNumber '') with='"')}}%2C%20` +
          `%22site_code%22%3A{{urlEncode (enclose (defaultTo (mapValue site.id '{"DNAH":"D","kalafong":"K","CMJAH":"J","RMMCH":"R","CHBAH":"B"}') '') with='"')}}%2C%20` +
          `%22ward_cubicle%22%3A{{urlEncode (enclose (defaultTo result.formData.ward '') with='"')}}%2C%20` +
          `%22sample_category%22%3A{{urlEncode (enclose (defaultTo result.formData.sampleType '') with='"')}}%2C%20` +
          `%22instrument_ca%22%3A{{urlEncode (enclose (defaultTo (mapValue device.deviceType '{"CepheidGeneXpert":"1","AlereQ":"2"}') '') with='"')}}%2C%20` +
          `%22assayhiv%22%3A{{urlEncode (enclose (defaultTo (mapValue result.assay.id '{"assayAlereQHiv12VLPlasma":"1","assayAlereQHiv12Detect":"2","GxHiv1Vl":"1","GxHiv1Qual":"2"}') '') with='"')}}%2C%20` +
          `%22sample_barcode%22%3A{{urlEncode (enclose (defaultTo result.sample.id '') with='"')}}%2C%20` +
          `%22sample_taken%22%3A{{urlEncode (enclose (defaultTo (formatDate result.formData.timeSampleTaken '${redCapDateTimeFormat}') '') with='"')}}%2C%20` +
          `%22point_of_care_instrument_r%22%3A{{urlEncode (enclose (defaultTo (mapValue (tryMergeResultCategories result.category1.id result.category2.id) '{"Detected":"1","MoreThan1000":"1","LessThan1000":"1","Trace Detected":"1","NotDetected":"2","NoResult":"3","Discordant":"3","Indeterminate":"3","Invalid":"3","Success":"3","CollectNewSample":"3","Rejected":"3","Missing":"3","Unknown":"3","Error":"4"}') '') with='"')}}%2C%20` +
          `%22error_code1%22%3A{{urlEncode (enclose (defaultTo result.errorCode '') with='"')}}%2C%20` +
          `%22poc_viral_load%22%3A` +
          `{{#if (eq result.assay.id 'assayAlereQHiv12VLPlasma')}}` +
          `{{#if (or (eq (tryMergeResultCategories result.category1.id result.category2.id) 'Error') ` +
          `(eq (tryMergeResultCategories result.category1.id result.category2.id) 'NoResult'))}}` +
          `{{urlEncode (enclose (tryMergeResultCategories result.category1.id result.category2.id) with='"')}}` +
          `{{else if (or (isRegexMatch result.data.hiv1MNResult '([\\d|\\s|\\.]+) cp\\/mL') ` +
          `(isRegexMatch result.data.hiv1OResult '([\\d|\\s|\\.]+) cp\\/mL') ` +
          `(isRegexMatch result.data.hiv2Result '([\\d|\\s|\\.]+) cp\\/mL'))}}` +
          `{{#if (or (gt (toInt (extractValueFromRegexCaptureGroup result.data.hiv1MNResult '([\\d|\\s|\\.]+) cp\\/mL')) 10000000) ` +
          `(gt (toInt (extractValueFromRegexCaptureGroup result.data.hiv1OResult '([\\d|\\s|\\.]+) cp\\/mL')) 10000000) ` +
          `(gt (toInt (extractValueFromRegexCaptureGroup result.data.hiv2Result '([\\d|\\s|\\.]+) cp\\/mL')) 10000000))}}` +
          `%22%3E%2010%20000%20000%20copies%2Fml%22` +
          `{{else}}` +
          `%22{{urlEncode (defaultTo (maxViralLoadValue result.data.hiv1MNResult result.data.hiv1OResult result.data.hiv2Result) '0')}}%20copies%2Fml%22` +
          `{{/if}}` +
          `{{else}}` +
          `%220%22` +
          `{{/if}}` +
          `{{else if (eq result.assay.id 'GxHiv1Vl')}}` +
          `{{#if (or (eq (tryMergeResultCategories result.category1.id result.category2.id) 'Error') ` +
          `(eq (tryMergeResultCategories result.category1.id result.category2.id) 'NoResult'))}}` +
          `{{urlEncode (enclose (tryMergeResultCategories result.category1.id result.category2.id) with='"')}}` +
          `{{else if (gt (toInt (extractValueFromRegexCaptureGroup result.data.copies '([\\d|\\s|\\.]+)')) 10000000)}}` +
          `%22%3E%2010%20000%20000%20copies%2Fml%22` +
          `{{else}}` +
          `%22{{urlEncode (defaultTo (maxViralLoadValue result.data.copies) '0')}}%20copies%2Fml%22` +
          `{{/if}}` +
          `{{else}}` +
          `%22%22` +
          `{{/if}}` +
          `%2C%20` +
          `%22ct_value%22%3A{{urlEncode (enclose (defaultTo result.data.probes.probeCCt '0') with='"')}}%2C%20` +
          `%22result_instrument%22%3A{{urlEncode (enclose (defaultTo (formatDate result.formData.timeInstrumentResulted '${redCapDateTimeFormat}') '') with='"')}}` +
          `%7D%5D&returnContent=ids&returnFormat=json`,
        fileContentTypeId: await fileContentTypeToId('formUrlEncoded'),
      },
      auditFields
    )
  )

  const [resultDataEnteredSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message:
          `GxAlert. New case HIV > 50 cps from {{site.shortName}}; ` +
          `in Ward: {{result.formData.ward}}; Sample ID: {{result.sample.id}};  ` +
          `Patient ID: {{result.patient.id}} on {{formatDate result.endedOn}}` +
          `{{#if (eq result.assay.id 'assayAlereQHiv12VLPlasma')}}` +
          `{{#if (or (isRegexMatch result.data.hiv1MNResult '([\\d|\\s|\\.]+) cp\\/mL') ` +
          `(isRegexMatch result.data.hiv1OResult '([\\d|\\s|\\.]+) cp\\/mL') ` +
          `(isRegexMatch result.data.hiv2Result '([\\d|\\s|\\.]+) cp\\/mL'))}}` +
          `{{#if (or (gt (toInt (extractValueFromRegexCaptureGroup result.data.hiv1MNResult '([\\d|\\s|\\.]+) cp\\/mL')) 10000000) ` +
          `(gt (toInt (extractValueFromRegexCaptureGroup result.data.hiv1OResult '([\\d|\\s|\\.]+) cp\\/mL')) 10000000) ` +
          `(gt (toInt (extractValueFromRegexCaptureGroup result.data.hiv2Result '([\\d|\\s|\\.]+) cp\\/mL')) 10000000))}}` +
          `; Result: > 10 000 000 cp/ml` +
          `{{else}}` +
          `; Result: {{maxViralLoadValue result.data.hiv1MNResult result.data.hiv1OResult result.data.hiv2Result}} cp/ml` +
          `{{/if}}` +
          `{{/if}}` +
          `{{else if (eq result.assay.id 'GxHiv1Vl')}}` +
          `{{#if (gt (toInt (extractValueFromRegexCaptureGroup result.data.copies '([\\d|\\s|\\.]+)')) 10000000)}}` +
          `; Result: > 10 000 000 cp/ml` +
          `{{else}}` +
          `; Result: {{maxViralLoadValue result.data.copies}} cp/ml` +
          `{{/if}}` +
          `{{else}}` +
          `; Result: {{mapValue (tryMergeResultCategories result.category1.id result.category2.id) '{"Detected":"HIV+","NotDetected":"HIV-"}'}}` +
          `{{/if}}`,
      },
      auditFields
    )
  )

  const messageSeverityAlertId = await messageSeverityToId('Alert')

  const [resultUploadedMessageTypeId] = await knex('MessageType').insert([
    {
      messageSeverityId: messageSeverityAlertId,
      alertTemplateId: newResultAlertTemplateId,
      smsTemplateId: newResultSmsTemplateId,
    },
  ])
  const [resultDataEnteredMessageTypeId] = await knex('MessageType').insert([
    {
      messageSeverityId: messageSeverityAlertId,
      webhookTemplateId: redCapAlereQWebHookTemplateId,
    },
  ])
  const [positiveResultDataEnteredMessageTypeId] = await knex(
    'MessageType'
  ).insert([
    {
      messageSeverityId: messageSeverityAlertId,
      smsTemplateId: resultDataEnteredSmsTemplateId,
    },
  ])

  const issueCategoryDataHealthId = await issueCategoryToId('DataHealth')

  const [issueTypeResultUploadedId] = await knex('IssueType').insert({
    name: 'Result Uploaded',
    externalId: 'ResultUploaded',
    i18nKey: 'issueTypeResultUploaded',
    issueCategoryId: issueCategoryDataHealthId,
  })
  const [issueTypeResultDataEnteredId] = await knex('IssueType').insert({
    name: 'Result Data Entered',
    externalId: 'ResultDataEntered',
    i18nKey: 'issueTypeResultDataEntered',
    issueCategoryId: issueCategoryDataHealthId,
  })

  const { id: adminJobFunctionId } = await knex('JobFunction')
    .where({ name: 'Admin', partnerId })
    .first('id')
  const { id: regionalOfficerJobFunctionId } = await knex('JobFunction')
    .where({ name: 'Regional Officer', partnerId })
    .first('id')
  const { id: labUserJobFunctionId } = await knex('JobFunction')
    .where({ name: 'Lab User', partnerId })
    .first('id')

  await knex('NotificationType').insert(
    Object.assign(
      {
        name: 'Result Uploaded',
        partnerId,
        issueTypeId: issueTypeResultUploadedId,
        jobFunctionId: labUserJobFunctionId,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: resultUploadedMessageTypeId,
      },
      auditFields
    )
  )
  await knex('NotificationType').insert(
    Object.assign(
      {
        name: 'Result Data Entered',
        partnerId,
        issueTypeId: issueTypeResultDataEnteredId,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: resultDataEnteredMessageTypeId,
      },
      auditFields
    )
  )
  await knex('NotificationType').insert(
    Object.assign(
      {
        name: 'LU Positive Result Data Entered',
        partnerId,
        issueTypeId: issueTypeResultDataEnteredId,
        jobFunctionId: labUserJobFunctionId,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: positiveResultDataEnteredMessageTypeId,
      },
      auditFields
    )
  )
  const [roPositiveResultDataEnteredId] = await knex('NotificationType').insert(
    Object.assign(
      {
        name: 'RO Positive Result Data Entered',
        partnerId,
        issueTypeId: issueTypeResultDataEnteredId,
        jobFunctionId: regionalOfficerJobFunctionId,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: positiveResultDataEnteredMessageTypeId,
        sendToContactsWithMatchingTags: true,
      },
      auditFields
    )
  )
  const [positiveEidTag] = await knex('Tag').insert({
    title: 'EID+',
    partnerId,
  })
  const [positiveVLTag] = await knex('Tag').insert({
    title: 'HIV-VL>50',
    partnerId,
  })
  await knex('NotificationTypeTag').insert([
    {
      notificationTypeId: roPositiveResultDataEnteredId,
      tagId: positiveEidTag,
    },
    {
      notificationTypeId: roPositiveResultDataEnteredId,
      tagId: positiveVLTag,
    },
  ])
  const [adminPositiveResultDataEnteredId] = await knex(
    'NotificationType'
  ).insert(
    Object.assign(
      {
        name: 'Admin Positive Result Data Entered',
        partnerId,
        issueTypeId: issueTypeResultDataEnteredId,
        jobFunctionId: adminJobFunctionId,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: positiveResultDataEnteredMessageTypeId,
        sendToContactsWithMatchingTags: true,
      },
      auditFields
    )
  )
  await knex('NotificationTypeTag').insert([
    {
      notificationTypeId: adminPositiveResultDataEnteredId,
      tagId: positiveEidTag,
    },
    {
      notificationTypeId: adminPositiveResultDataEnteredId,
      tagId: positiveVLTag,
    },
  ])

  await knex('IssueEventTrigger').insert([
    {
      partnerId,
      issueTypeId: issueTypeResultUploadedId,
      issueEventStatusId: await issueEventStatusToId('Triggered'),
      triggerConditions: JSON.stringify({
        action: 'RESULT_LOGGED',
        conditions: {
          evaluationMethod: 'plugin-function',
          evaluationParameter: 'shouldRaiseNewResultAlert',
        },
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      partnerId,
      issueTypeId: issueTypeResultDataEnteredId,
      issueEventStatusId: await issueEventStatusToId('Triggered'),
      triggerConditions: JSON.stringify({
        action: 'RESULT_UPDATED',
        conditions: {
          evaluationMethod: 'plugin-function',
          evaluationParameter: 'shouldSendResultToRedCAP',
        },
      }),
      createdOn: now,
      updatedOn: now,
    },
  ])

  await knex('IssueEscalationTrigger').insert({
    issueTypeId: issueTypeResultDataEnteredId,
    partnerId,
    escalateToLevel: 2,
    escalationConditions: JSON.stringify({
      evaluationMethod: 'plugin-function',
      evaluationParameter: 'shouldSendResultPositiveSms',
    }),
    createdOn: now,
    updatedOn: now,
  })

  await knex('IssueResolutionTrigger').insert([
    {
      issueTypeId: issueTypeResultUploadedId,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'shouldResolveNewResultAlert',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypeResultDataEnteredId,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'shouldResolveResultDataEnteredIssue',
      }),
      createdOn: now,
      updatedOn: now,
    },
  ])
}

module.exports = {
  seedNotifications,
}
