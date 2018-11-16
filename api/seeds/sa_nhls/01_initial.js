module.exports = require('../utils').seed(seed)

const _ = require('lodash')
const bcrypt = require('bcrypt')
const config = require('../../src/config')
const { getPermissionModules } = require('../utils')
const geography = require('./fixtures/geography.json')

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
    password: bcrypt.hashSync('fvxye6JjPU', saltRounds),
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
  const deviceTypeCategoryLab = await deviceTypeCategoryToId('Lab')

  const [deviceTypeAlereFtpConnectorId] = await knex('DeviceType').insert({
    externalId: 'AlereFtpConnector',
    name: 'Alere FTP Connector',
    manufacturer: 'SystemOne',
    plugin: 'alereftpconnector',
    deviceTypeCategoryId: deviceTypeCategoryConnector,
  })

  const [deviceTypeAlereAlereQId] = await knex('DeviceType').insert({
    externalId: 'AlereQ',
    name: 'Alere q',
    manufacturer: 'Abbott',
    deviceTypeCategoryId: deviceTypeCategoryLab,
  })

  // Reuse previously seeded "static" data
  const [modules, features, approvedDeviceStatusId] = await Promise.all([
    getPermissionModules(knex),
    allFeatureToId(),
    deviceStatusToId('approved'),
  ])

  const [partnerId] = await knex('Partner').insert({
    name: 'South Africa NHLS',
    partnerTypeId: await partnerTypeToId('Operating'),
    plugin: 'sa_nhls',
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
  })

  // Create geographic hierarchy
  const countries = {}
  const geographies = []
  await Promise.all(
    _.map(geography.countries, async country => {
      const countryData = _.pick(country, [
        'abbreviation',
        'name',
        'a3',
        'culture',
        'countryCode',
        'stateLabel',
        'lgaLabel',
        'timezone',
        'portNumber',
        'exportColumns',
        'inventoryDaysThreshold',
        'monthStartsOnDay',
      ])
      const [countryId] = await knex('Country').insert(countryData)
      countryData.id = countryId
      countries[country.abbreviation] = countryData
      countryData.states = {}

      const [countryGeographyId] = await knex('Geography').insert({
        countryId,
      })
      countryData.geographyId = countryGeographyId

      await Promise.all(
        _.map(country.states || [], async state => {
          const stateData = _.pick(state, ['abbreviation', 'name'])
          const [stateId] = await knex('State').insert(stateData)
          stateData.id = stateId
          const stateKey = state.abbreviation || state.name
          countryData.states[stateKey] = stateData
          stateData.lgas = {}

          const [stateGeographyId] = await knex('Geography').insert({
            countryId,
            stateId,
          })
          stateData.geographyId = stateGeographyId

          await Promise.all(
            _.map(state.lgas || [], async lga => {
              const lgaData = _.pick(lga, ['name'])

              const [lgaId] = await knex('Lga').insert(lgaData)
              lgaData.id = lgaId
              stateData.lgas[lga.name] = lgaData
              lgaData.sites = {}

              const geoData = { countryId, stateId, lgaId }
              const [geographyId] = await knex('Geography').insert(geoData)
              lgaData.geographyId = geographyId
              geographies.push(Object.assign({ id: geographyId }, geoData))
            })
          )
        })
      )
    })
  )
  const { culture, timezone, id: countryId, geographyId } = countries.ZA

  // create site for Alere FTP Connector device
  const [southAfricaNhlsAlereFtpConnectorSiteId] = await knex('Site').insert(
    Object.assign(
      {
        name: 'SA NHLS Alere FTP Connector Site',
        shortName: 'SA NHLS Alere',
        externalId: 'sa_nhls_alere_ftp',
        partnerId,
        geographyId,
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
        deviceTypeId: deviceTypeAlereFtpConnectorId,
        deviceStatusId: approvedDeviceStatusId,
        partnerId,
        geographyId,
        siteId: southAfricaNhlsAlereFtpConnectorSiteId,
      },
      auditFields
    )
  )

  await knex('DeviceApiKey').insert(
    Object.assign(
      {
        token: '0dmqueurr7yw8rfr03zg',
        revoked: 0,
        partnerId,
        geographyId,
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
  await knex('JobContext').insert({
    jobId: jobIdAdmin,
    geographyId,
  })

  const patientDataSchema = JSON.stringify({
    id: {
      title: 'Patient ID',
      type: 'string',
      order: 0,
    },
    firstName: {
      title: 'First Name',
      type: 'string',
      order: 1,
    },
    surname: {
      title: 'Surname',
      type: 'string',
      order: 2,
    },
    ward: {
      title: 'Ward',
      type: 'string',
      order: 3,
    },
    hospitalNumber: {
      title: 'Hospital Number',
      type: 'string',
      order: 4,
    },
  })

  const [alereQHiv12DetectAssayId] = await knex('Assay').insert({
    name: 'Alere q HIV-1/2 Detect',
    i18nKey: 'assayAlereQHiv12Detect',
    externalId: 'assayAlereQHiv12Detect',
    assayTypeId: await assayTypeToId('HIV Qual'),
    deviceTypeId: deviceTypeAlereAlereQId,
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
    patientDataSchema,
  })

  const [alereQHiv12VLPlasmaAssayId] = await knex('Assay').insert({
    name: 'Alere q HIV-1/2 VL plasma',
    i18nKey: 'assayAlereQHiv12VLPlasma',
    externalId: 'assayAlereQHiv12VLPlasma',
    assayTypeId: await assayTypeToId('HIV VL'),
    deviceTypeId: deviceTypeAlereAlereQId,
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
    patientDataSchema,
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

  const assayAlereQHiv12FormSchema = {
    fields: {
      patientId: {
        i18nLabel: 'patientId',
        control: {
          type: 'TextBox',
        },
        order: 1,
      },
      hospitalNumber: {
        i18nLabel: 'hospitalNumber',
        control: {
          type: 'TextBox',
        },
        order: 2,
      },
      studyID: {
        i18nLabel: 'studyID',
        control: {
          type: 'TextBox',
        },
        order: 3,
      },
      nameOfPatient: {
        i18nLabel: 'nameOfPatient',
        control: {
          type: 'TextBox',
        },
        order: 4,
      },
      surnameOfPatient: {
        i18nLabel: 'surnameOfPatient',
        control: {
          type: 'TextBox',
        },
        order: 5,
      },
      ward: {
        i18nLabel: 'ward',
        control: {
          type: 'TextBox',
        },
        order: 6,
      },
      timeSampleTaken: {
        i18nLabel: 'timeSampleTaken',
        control: {
          type: 'DateTime',
        },
        order: 7,
      },
      sampleType: {
        i18nLabel: 'sampleType',
        control: {
          type: 'DropDown',
          options: [
            {
              i18nText: 'studyOfSampleType',
              value: 'study',
            },
            {
              i18nText: 'EQAOfSampleType',
              value: 'EQA',
            },
            {
              i18nText: 'miscOfSampleType',
              value: 'misc',
            },
          ],
        },
        order: 8,
      },
      timeInstrumentResulted: {
        i18nLabel: 'timeInstrumentResulted',
        control: {
          type: 'DateTime',
        },
        order: 9,
      },
    },
    sendChangesOn: 'submit',
  }

  await knex('ResultForm').insert([
    {
      partnerId,
      assayId: alereQHiv12VLPlasmaAssayId,
      formSchema: JSON.stringify(assayAlereQHiv12FormSchema),
    },
    {
      partnerId,
      assayId: alereQHiv12DetectAssayId,
      formSchema: JSON.stringify(assayAlereQHiv12FormSchema),
    },
  ])
}
