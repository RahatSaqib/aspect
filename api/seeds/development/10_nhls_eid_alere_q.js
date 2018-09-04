module.exports = require('../utils').seed(seed)

const config = require('../../src/config')
const bcrypt = require('bcrypt')

const { rowsAsObject, getPermissionModules } = require('../utils')

const {
  allFeatureToId,
  assayTypeToId,
  partnerTypeToId,
  resultSourceToId,
} = require('../../src/shared/dictionary')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User')
    .where({ name: 'nhls_eid' })
    .first('id')
  if (existingAdminUser) {
    return
  }

  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = await knex('User').insert({
    name: 'nhls_eid',
    password: bcrypt.hashSync('nhlsEid2018', saltRounds),
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
    rowsAsObject(knex, 'IssueType', 'externalId'),
  ])

  const [partnerId] = await knex('Partner').insert({
    name: 'South Africa NHLS',
    plugin: 'south_africa_nhls',
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
  })

  const [zaCountry] = await knex('Country as c')
    .where({ 'c.a3': 'ZAF' })
    .select('c.id', 'c.culture', 'c.timezone')
  const { culture, timezone, id: countryId } = zaCountry
  const { id: geographyId } = await knex('Geography')
    .where({ countryId })
    .whereNull('stateId')
    .whereNull('lgaId')
    .first()

  const [adminPersonId] = await knex('Person').insert(
    Object.assign(
      {
        userId: adminId,
        name: 'NHLS EID Admin',
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
  ])
  await knex('JobFunctionFeature').insert([
    { jobFunctionId: jobFunctionIdAdmin, featureId: features.device },
    { jobFunctionId: jobFunctionIdAdmin, featureId: features.result },
    { jobFunctionId: jobFunctionIdAdmin, featureId: features.site },
  ])

  const [jobIdAdmin] = await knex('Job').insert([
    { personId: adminPersonId, jobFunctionId: jobFunctionIdAdmin },
  ])
  await knex('JobContext').insert({ jobId: jobIdAdmin, geographyId })

  await knex('Assay').insert({
    name: 'Alere Q HIV Qual',
    i18nKey: 'assayAlereQHivQual',
    externalId: 'assayAlereQHivQual',
    assayTypeId: await assayTypeToId('HIV Qual'),
    deviceTypeId: deviceTypes.AlereQ.id,
    resultSourceId: await resultSourceToId('DiagnosticDevice'),
    resultCategory1Label: 'Status',
    resultDataSchema: JSON.stringify({
      resultNo: { list: false, order: 1, type: 'string', title: 'Result No' },
      deviceSerial: {
        list: true,
        order: 2,
        type: 'string',
        title: 'Device Serial',
      },
      testName: { list: true, order: 3, type: 'string', title: 'Test Name' },
      cartridgeId: {
        list: true,
        order: 4,
        type: 'string',
        title: 'Cartridge ID',
      },
      sampleId: { list: true, order: 5, type: 'string', title: 'Sample ID' },
      hiv1Mn: { list: true, order: 6, type: 'string', title: 'HIV-1 M/N' },
      hiv1O: { list: true, order: 7, type: 'string', title: 'HIV-1 O' },
      hiv2: { list: true, order: 8, type: 'string', title: 'HIV-2' },
      errorCode: { list: true, order: 9, type: 'string', title: 'Error Code' },
      operator: { list: true, order: 10, type: 'string', title: 'Operator' },
      timeStamp: { list: true, order: 11, type: 'string', title: 'Timestamp' },
      sampleDetection: {
        list: false,
        order: 12,
        type: 'string',
        title: 'Sample Detection Check',
      },
      device: { list: false, order: 13, type: 'string', title: 'Device Check' },
      hiv1PositiveControl: {
        list: false,
        order: 14,
        type: 'string',
        title: 'HIV-1 Positive Control',
      },
      hiv2PositiveControl: {
        list: false,
        order: 15,
        type: 'string',
        title: 'HIV-2 Positive Control',
      },
      negativeControl: {
        list: false,
        order: 16,
        type: 'string',
        title: 'Negative Control',
      },
      analysis: {
        list: false,
        order: 17,
        type: 'string',
        title: 'Analysis Check',
      },
      deviceSoftware: {
        list: false,
        order: 18,
        type: 'string',
        title: 'Device Software Version',
      },
    }),
  })

  await knex('FileSystemWatcher').insert({
    pathMatchRegex: '/nhls\\/alereQ\\/.*\\.csv.*/g',
    partnerId,
    deviceTypeId: deviceTypes.AlereQ.id,
  })
}
