module.exports = require('../utils').seed(seed)

const config = require('../../src/config')
const bcrypt = require('bcrypt')

const { rowsAsObject, getPermissionModules } = require('../utils')

const {
  deviceTypeCategoryToId,
  allFeatureToId,
  assayTypeToId,
  partnerTypeToId,
  resultSourceToId,
  unitToId,
  deviceStatusToId,
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

  const deviceTypeCategoryConnector = await deviceTypeCategoryToId('Connector')

  await knex('DeviceType').insert({
    externalId: 'AlereFtpConnector',
    name: 'Alere FTP Connector',
    manufacturer: 'SystemOne',
    plugin: 'alereftpconnector',
    deviceTypeCategoryId: deviceTypeCategoryConnector,
  })

  // Reuse previously seeded "static" data
  const [
    deviceTypes,
    modules,
    features,
    approvedDeviceStatusId,
  ] = await Promise.all([
    rowsAsObject(knex, 'DeviceType', 'externalId'),
    getPermissionModules(knex),
    allFeatureToId(),
    deviceStatusToId('approved'),
  ])

  const [partnerId] = await knex('Partner').insert({
    name: 'South Africa NHLS',
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
  })

  const [southAfricaCountry] = await knex('Country as c')
    .where({ 'c.a3': 'ZAF' })
    .select('c.id', 'c.culture', 'c.timezone')
  const { culture, timezone, id: countryId } = southAfricaCountry
  const { id: southAfricaGeographyId } = await knex('Geography')
    .where({ countryId })
    .whereNull('stateId')
    .whereNull('lgaId')
    .first()

  // create site for Alere FTP Connector device
  const [southAfricaNhlsAlereFtpConnectorSiteId] = await knex('Site').insert(
    Object.assign(
      {
        name: 'SA NHLS Alere FTP Connector Site',
        shortName: 'SA NHLS Alere',
        externalId: 'sa_nhls_alere_ftp',
        partnerId,
        geographyId: southAfricaGeographyId,
      },
      auditFields
    )
  )

  // insert SA NHLS Alere q Connector device
  const [southAfricaNhlsAlereFtpConnectorDeviceId] = await knex(
    'Device'
  ).insert(
    Object.assign(
      {
        name: 'South Africa NHLS Alere FTP Connector',
        deviceTypeId: deviceTypes.AlereFtpConnector.id,
        deviceStatusId: approvedDeviceStatusId,
        partnerId,
        geographyId: southAfricaGeographyId,
        siteId: southAfricaNhlsAlereFtpConnectorSiteId,
      },
      auditFields
    )
  )

  await knex('DeviceApiKey').insert(
    Object.assign(
      {
        token: 'aqcajk92773te5t4dv01',
        revoked: 0,
        partnerId,
        geographyId: southAfricaGeographyId,
        deviceId: southAfricaNhlsAlereFtpConnectorDeviceId,
      },
      auditFields
    )
  )

  const [adminPersonId] = await knex('Person').insert(
    Object.assign(
      {
        userId: adminId,
        name: 'NHLS EID Admin',
        lastPartnerId: partnerId,
        lastCountryId: countryId,
        geographyId: southAfricaGeographyId,
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
  await knex('JobContext').insert({
    jobId: jobIdAdmin,
    geographyId: southAfricaGeographyId,
  })

  const [alereQHiv12DetectAssayId] = await knex('Assay').insert({
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
      hiv1MnResult: {
        list: true,
        order: 6,
        type: 'string',
        title: 'HIV-1 M/N',
      },
      hiv1OResult: { list: true, order: 7, type: 'string', title: 'HIV-1 O' },
      hiv2Result: { list: true, order: 8, type: 'string', title: 'HIV-2' },
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
        type: 'time',
        title: 'Timestamp',
      },
      sampleDetection: {
        list: false,
        order: 12,
        type: 'string',
        title: 'Sample Detection Check',
      },
      deviceCheck: {
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
      analysisCheck: {
        list: false,
        order: 17,
        type: 'string',
        title: 'Analysis Check',
      },
      softwareVersion: {
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
      pickedUpOn: {
        list: false,
        order: 20,
        type: 'time',
        title: 'Picked Up On',
      },
    }),
  })
  const [alereQHiv12VLPlasmaAssayId] = await knex('Assay').insert({
    name: 'Alere q HIV-1/2 VL plasma',
    i18nKey: 'assayAlereQHiv12VLPlasma',
    externalId: 'assayAlereQHiv12VLPlasma',
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
      hiv1MNResult: {
        list: true,
        order: 6,
        type: 'string',
        title: 'HIV-1 M/N cp/mL',
      },
      hiv1OResult: {
        list: true,
        order: 7,
        type: 'string',
        title: 'HIV-1 O cp/mL',
      },
      hiv2Result: {
        list: true,
        order: 8,
        type: 'string',
        title: 'HIV-2 cp/mL',
      },
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
        type: 'time',
        title: 'Timestamp',
      },
      sampleDetection: {
        list: false,
        order: 12,
        type: 'string',
        title: 'Sample Detection Check',
      },
      deviceCheck: {
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
      analysisCheck: {
        list: false,
        order: 17,
        type: 'string',
        title: 'Analysis Check',
      },
      softwareVersion: {
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
      pickedUpOn: {
        list: false,
        order: 22,
        type: 'time',
        title: 'Picked Up On',
      },
    }),
  })

  const piece = await unitToId('Piece')
  const [alereQHiv12DetectCartridgeId] = await knex('Consumable').insert({
    name: 'Alere q HIV-1/2 Detect Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Alere',
  })
  const [alereQHiv12VLPlasmaCartridgeId] = await knex('Consumable').insert({
    name: 'Alere q HIV-1/2 VL Plasma Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Alere',
  })

  await knex('ConsumableAssay').insert([
    {
      assayId: alereQHiv12DetectAssayId,
      consumableId: alereQHiv12DetectCartridgeId,
      quantity: 1,
    },
    {
      assayId: alereQHiv12VLPlasmaAssayId,
      consumableId: alereQHiv12VLPlasmaCartridgeId,
      quantity: 1,
    },
  ])
}
