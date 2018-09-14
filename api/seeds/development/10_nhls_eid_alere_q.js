module.exports = require('../utils').seed(seed)

const config = require('../../src/config')
const bcrypt = require('bcrypt')

const { rowsAsObject, getPermissionModules } = require('../utils')

const {
  allFeatureToId,
  assayTypeToId,
  partnerTypeToId,
  resultSourceToId,
  unitToId,
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

  const [alereQHiv12DetectAssayId, alereQHiv12VLPlasmaAssayId] = await knex(
    'Assay'
  ).insert([
    {
      name: 'Alere q HIV-1/2 Detect',
      i18nKey: 'assayAlereQHiv12Detect',
      externalId: 'assayAlereQHiv12Detect',
      assayTypeId: await assayTypeToId('HIV Qual'),
      deviceTypeId: deviceTypes.AlereQ.id,
      resultSourceId: await resultSourceToId('DiagnosticDevice'),
      resultCategory1Label: 'Result',
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
        errorCode: {
          list: true,
          order: 9,
          type: 'string',
          title: 'Error Code',
        },
        operator: { list: true, order: 10, type: 'string', title: 'Operator' },
        timeStamp: {
          list: true,
          order: 11,
          type: 'string',
          title: 'Timestamp',
        },
        sampleDetection: {
          list: false,
          order: 12,
          type: 'string',
          title: 'Sample Detection Check',
        },
        device: {
          list: false,
          order: 13,
          type: 'string',
          title: 'Device Check',
        },
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
        sourceFile: {
          list: false,
          order: 19,
          type: 'string',
          title: 'Source File',
        },
      }),
    },
    {
      name: 'Alere q HIV-1/2 VL plasma',
      i18nKey: 'assayAlereQHiv1212VLPlasma',
      externalId: 'assayAlereQHiv1212VLPlasma',
      assayTypeId: await assayTypeToId('HIV VL'),
      deviceTypeId: deviceTypes.AlereQ.id,
      resultSourceId: await resultSourceToId('DiagnosticDevice'),
      resultCategory1Label: 'Result',
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
        hiv1Mn: {
          list: true,
          order: 6,
          type: 'string',
          title: 'HIV-1 M/N cp/mL',
        },
        hiv1O: { list: true, order: 7, type: 'string', title: 'HIV-1 O cp/mL' },
        hiv2: { list: true, order: 8, type: 'string', title: 'HIV-2 cp/mL' },
        errorCode: {
          list: true,
          order: 9,
          type: 'string',
          title: 'Error Code',
        },
        operator: { list: true, order: 10, type: 'string', title: 'Operator' },
        timeStamp: {
          list: true,
          order: 11,
          type: 'string',
          title: 'Timestamp',
        },
        sampleDetection: {
          list: false,
          order: 12,
          type: 'string',
          title: 'Sample Detection Check',
        },
        device: {
          list: false,
          order: 13,
          type: 'string',
          title: 'Device Check',
        },
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
        deviceMode: {
          list: false,
          order: 19,
          type: 'string',
          title: 'Device Mode',
        },
        status: {
          list: false,
          order: 20,
          type: 'string',
          title: 'Status',
        },
        sourceFile: {
          list: false,
          order: 21,
          type: 'string',
          title: 'Source File',
        },
      }),
    },
  ])

  const piece = await unitToId('Piece')
  const [
    alereQHiv12DetectCartridgeId,
    alereQHiv12VLPlasmaCartridgeId,
  ] = await knex('Consumable').insert([
    {
      name: 'Alere q HIV-1/2 Detect Cartridge',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Alere',
    },
    {
      name: 'Alere q HIV-1/2 VL Plasma Cartridge',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Alere',
    },
  ])

  await knex('ConsumableAssay').insert([
    {
      assayId: alereQHiv12DetectAssayId,
      consumableId: alereQHiv12DetectCartridgeId,
    },
    {
      assayId: alereQHiv12VLPlasmaAssayId,
      consumableId: alereQHiv12VLPlasmaCartridgeId,
    },
  ])

  await knex('FileSystemWatcher').insert({
    pathMatchRegex: '/nhls\\/alereQ\\/.*\\.csv.*/g',
    partnerId,
    deviceTypeId: deviceTypes.AlereQ.id,
  })
}
