module.exports = require('../../src/db').seed(seed)

const _ = require('lodash')
const config = require('../../src/config')
const bcrypt = require('bcrypt')
const { randomToken } = require('../../src/deviceApi/apiKey')
const {
  rowsAsObject,
  getPermissionModules,
  seedIssueEventTriggersForPartner,
} = require('../utils')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User')
    .where({ name: 'gates_rdt' })
    .first('id')
  if (existingAdminUser) {
    return
  }

  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = await knex('User').insert({
    name: 'gates_rdt',
    password: bcrypt.hashSync('gates2018', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // Reuse previously seeded "static" data
  const [
    partnerTypes,
    deviceTypes,
    resultSources,
    assayTypes,
    modules,
    features,
    fileContentTypes,
    issueTypes,
    messageSeverities,
  ] = await Promise.all([
    rowsAsObject(knex, 'PartnerType', 'name'),
    rowsAsObject(knex, 'DeviceType', 'externalId'),
    rowsAsObject(knex, 'ResultSource', 'externalId'),
    rowsAsObject(knex, 'AssayType', 'name'),
    getPermissionModules(knex),
    rowsAsObject(knex, 'Feature', 'module'),
    rowsAsObject(knex, 'FileContentType', 'externalId'),
    rowsAsObject(knex, 'IssueType', 'externalId'),
    rowsAsObject(knex, 'MessageSeverity', 'externalId'),
  ])

  const [partnerId] = await knex('Partner').insert({
    name: 'GatesRDT',
    partnerTypeId: partnerTypes.Operating.id,
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
  })

  await knex('Assay').insert({
    name: 'CommCare Gates RDT',
    i18nKey: 'assayCommCareGatesRDT',
    externalId: 'CommCareGatesRDT',
    assayTypeId: assayTypes['HIV Qual'].id,
    deviceTypeId: deviceTypes.CommCareApp.id,
    resultSourceId: resultSources.DiagnosticDevice.id,
    resultCategory1Label: 'Status',
    resultDataSchema: JSON.stringify({
      resultText: { list: true, order: 1, type: 'string', title: 'Result' },
      hcwResult: { list: true, order: 2, type: 'string', title: 'HCW Result' },
      hcwConfirmatoryResult: {
        list: false,
        order: 3,
        type: 'string',
        title: 'HCW Confirmatory Result',
      },
      hcwTiebreakerResult: {
        list: false,
        order: 4,
        type: 'string',
        title: 'HCW Tiebreaker Result',
      },
    }),
    patientDataSchema: JSON.stringify({
      id: { type: 'string', order: 0, title: 'Patient ID' },
      age: { type: 'int', order: 1, title: 'Age' },
      gender: { type: 'string', order: 2, title: 'Gender' },
      phone: { type: 'string', order: 3, title: 'Phone Number' },
      educationLevel: { type: 'string', order: 4, title: 'Education Level' },
      previousTesting: { type: 'string', order: 5, title: 'Previous Testing' },
    }),
  })

  const [usCountry] = await knex('Country as c')
    .where({ 'c.a3': 'USA' })
    .select('c.id', 'c.culture', 'c.timezone')
  const { culture, timezone, id: countryId } = usCountry
  const { id: geographyId } = await knex('Geography')
    .where({ countryId })
    .whereNull('stateId')
    .whereNull('lgaId')
    .first()

  // Assign all features and admin permissions to Admin user
  const [adminPersonId] = await knex('Person').insert(
    Object.assign(
      {
        userId: adminId,
        name: 'Gates RDT Admin',
        lastPartnerId: partnerId,
        lastCountryId: countryId,
        geographyId,
        culture,
        timezone,
      },
      auditFields
    )
  )

  const [jobFunctionIdAdmin] = await knex('JobFunction').insert({
    name: 'Admin',
    partnerId,
  })
  await knex('JobFunctionPermission').insert([
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.browse.view },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.result.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.device.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.site.admin },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.deviceApiKey.admin,
    },
  ])
  await knex('JobFunctionFeature').insert([
    { jobFunctionId: jobFunctionIdAdmin, featureId: features.device.id },
    { jobFunctionId: jobFunctionIdAdmin, featureId: features.result.id },
    { jobFunctionId: jobFunctionIdAdmin, featureId: features.site.id },
    { jobFunctionId: jobFunctionIdAdmin, featureId: features.deviceApiKey.id },
  ])

  const [jobIdAdmin] = await knex('Job').insert([
    { personId: adminPersonId, jobFunctionId: jobFunctionIdAdmin },
  ])
  await knex('JobContext').insert({ jobId: jobIdAdmin, geographyId })

  // Create initial DeviceAPI Key for CommCare which requires site.
  const commcareSiteId = await knex('Site').insert(
    Object.assign({}, auditFields, {
      name: 'CommCare Site',
      shortName: 'CommCare Site',
      externalId: 'commcare',
      partnerId,
      geographyId,
    })
  )
  await knex('DeviceApiKey').insert(
    Object.assign(
      {
        token: randomToken(),
        revoked: 0,
        partnerId,
        geographyId,
        siteId: commcareSiteId,
      },
      auditFields
    )
  )

  // Create WebhookTemplate for downloading images
  const commcareApiKey = _.get(config, 'plugin.commcare.apiKey', '')
  const [webhookTemplateId] = await knex('WebhookTemplate').insert(
    Object.assign(
      {
        externalId: 'commcareDownloadImage',
        method: 'GET',
        url: '{{ result.data.resultImageUrl }}',
        fileName: '{{ result.data.resultImageFileName }}',
        fileContentTypeId: fileContentTypes.imageJpg.id,
        headers: JSON.stringify({
          Authorization: `ApiKey ${commcareApiKey}`,
        }),
      },
      auditFields
    )
  )

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
    webhookTemplateId,
  })

  const [resultPositiveMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert.id,
    smsTemplateId: resultPositiveSmsTemplateId,
  })

  const [resultNegativeMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert.id,
    smsTemplateId: resultNegativeSmsTemplateId,
  })

  // Notifications
  await knex('NotificationType').insert([
    Object.assign(
      {
        name: 'Result Received',
        partnerId,
        issueTypeId: issueTypes.ResultReceived.id,
        jobFunctionId: jobFunctionIdAdmin,
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
        issueTypeId: issueTypes.ResultReceived.id,
        jobFunctionId: jobFunctionIdAdmin,
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
        issueTypeId: issueTypes.ResultReceived.id,
        jobFunctionId: jobFunctionIdAdmin,
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
      issueTypeId: issueTypes.ResultReceived.id,
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
      issueTypeId: issueTypes.ResultReceived.id,
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

  await seedIssueEventTriggersForPartner(knex, partnerId)
}
