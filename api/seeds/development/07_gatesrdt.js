module.exports = require('../utils').seed(seed)

const _ = require('lodash')
const config = require('../../src/config')
const bcrypt = require('bcrypt')
const { randomToken } = require('../../src/deviceApi/apiKey')
const { rowsAsObject, getPermissionModules } = require('../utils')
const {
  allFeatureToId,
  assayTypeToId,
  partnerTypeToId,
  resultSourceToId,
  fileContentTypeToId,
} = require('../../src/shared/dictionary')

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
  const [deviceTypes, modules, features] = await Promise.all([
    rowsAsObject(knex, 'DeviceType', 'externalId'),
    getPermissionModules(knex),
    allFeatureToId(),
  ])

  const [partnerId] = await knex('Partner').insert({
    name: 'GatesRDT',
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
  })

  await knex('Assay').insert({
    name: 'CommCare Gates RDT',
    i18nKey: 'assayCommCareGatesRDT',
    externalId: 'CommCareGatesRDT',
    assayTypeId: await assayTypeToId('HIV Qual'),
    deviceTypeId: deviceTypes.CommCareApp.id,
    resultSourceId: await resultSourceToId('DiagnosticDevice'),
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
    { jobFunctionId: jobFunctionIdAdmin, featureId: features.device },
    { jobFunctionId: jobFunctionIdAdmin, featureId: features.result },
    { jobFunctionId: jobFunctionIdAdmin, featureId: features.site },
    { jobFunctionId: jobFunctionIdAdmin, featureId: features.deviceApiKey },
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
  await knex('WebhookTemplate').insert(
    Object.assign(
      {
        externalId: 'commcareDownloadImage',
        method: 'GET',
        url: '{{ result.data.resultImageUrl }}',
        fileName: '{{ result.data.resultImageFileName }}',
        fileContentTypeId: await fileContentTypeToId('imageJpg'),
        headers: JSON.stringify({
          Authorization: `ApiKey ${commcareApiKey}`,
        }),
      },
      auditFields
    )
  )
}
