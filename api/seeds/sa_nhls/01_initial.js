module.exports = require('../utils').seed(seed)

const _ = require('lodash')
const bcrypt = require('bcrypt')
const config = require('../../src/config')
const { getPermissionModules } = require('../utils')
const { randomToken } = require('../../src/deviceApi/apiKey')
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
    password: bcrypt.hashSync('mNv~P6&4U', saltRounds),
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

  // define resultData object
  const geneXpertResultDataSchemaHiv = JSON.stringify({
    resultText: {
      title: 'Result Text',
      type: 'string',
      i18nKey: 'resultText',
    },
    copies: {
      title: 'Copies/mL',
      type: 'number',
      list: true,
    },
    log: {
      title: 'log',
      type: 'number',
    },
    probes: {
      title: 'Probes',
      type: 'object',
      i18nKey: 'probes',
      properties: {
        gpCt: {
          title: 'GP Ct',
          type: 'number',
        },
        gpEndPt: {
          title: 'GP Endpt',
          type: 'number',
        },
        cicCt: {
          title: 'CIC Ct',
          type: 'number',
        },
        cicEndPt: {
          title: 'CIC EndPt',
          type: 'number',
        },
        sacCt: {
          title: 'SAC Ct',
          type: 'number',
        },
        sacEndPt: {
          title: 'SAC EndPt',
          type: 'number',
        },
        npCt: {
          title: 'NP Ct',
          type: 'number',
        },
        npEndPt: {
          title: 'NP EndPt',
          type: 'number',
        },
        qc1Ct: {
          title: 'QC1 Ct',
          type: 'number',
        },
        qc1Endpt: {
          title: 'QC1 EndPt',
          type: 'number',
        },
        qc2Ct: {
          title: 'QC2 Ct',
          type: 'number',
        },
        qc2Endpt: {
          title: 'Qc2Endpt',
          type: 'number',
        },
      },
    },
  })

  // define patientData object
  const geneXpertPatientDataSchema = JSON.stringify({
    id: {
      title: 'Patient ID',
      type: 'string',
      order: 0,
    },
    name: {
      title: 'Name',
      type: 'string',
      order: 1,
    },
    street: {
      title: 'Street',
      type: 'string',
      order: 2,
    },
    city: {
      title: 'City',
      type: 'string',
      order: 3,
    },
    state: {
      title: 'State',
      type: 'string',
      order: 4,
    },
    zip: {
      title: 'Zip',
      type: 'string',
      order: 5,
    },
    phone: {
      title: 'Phone',
      type: 'string',
      order: 6,
    },
    hivStatus: {
      title: 'HIV Status',
      type: 'string',
      order: 7,
    },
    age: {
      title: 'Age (in years)',
      type: 'number',
      order: 8,
    },
    gender: {
      title: 'Gender',
      type: 'string',
      order: 9,
    },
    microscopyResult: {
      title: 'Microscopy Result',
      type: 'string',
      order: 10,
    },
  })

  // define configurationData object
  const geneXpertConfigurationDataSchema = JSON.stringify({
    requirePrinter: {
      title: 'Require printer',
      type: 'string',
    },
    adminPassword: {
      title: 'Admin password',
      type: 'string',
    },
    firmwareUpdateRequired: {
      title: 'Firmware update required',
      type: 'string',
    },
    modules: {
      title: 'Modules',
      type: 'object',
      i18nKey: 'Modules',
      properties: {
        module1: {
          title: 'Module 1',
          type: 'string',
        },
        module2: {
          title: 'Module 2',
          type: 'string',
        },
        module3: {
          title: 'Module 3',
          type: 'string',
        },
        module4: {
          title: 'Module 4',
          type: 'string',
        },
      },
    },
  })

  // define deviceOperation object
  const deviceOperationSchema = JSON.stringify({
    voltage: {
      title: 'Voltage',
      type: 'number',
      prefix: '',
      suffix: 'V',
      decimals: 2,
    },
    temperature: {
      title: 'Temperature',
      type: 'number',
      prefix: '',
      suffix: 'F',
      decimals: 1,
    },
  })

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
    name: 'Q',
    manufacturer: 'Alere',
    deviceTypeCategoryId: deviceTypeCategoryLab,
  })

  const [deviceTypeGeneXpertId] = await knex('DeviceType').insert({
    externalId: 'CepheidGeneXpert',
    name: 'GeneXpert',
    manufacturer: 'Cepheid',
    plugin: 'gxconnect',
    deviceTypeCategoryId: deviceTypeCategoryLab,
    configurationDataSchema: geneXpertConfigurationDataSchema,
    deviceOperationSchema,
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
        token: randomToken(),
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
  })

  const [geneXpertHiv1VlAssayId] = await knex('Assay').insert({
    name: 'GeneXpert HIV-1 VL',
    i18nKey: 'assayGeneXpertHiv1Vl',
    externalId: 'GxHiv1Vl',
    assayTypeId: await assayTypeToId('HIV VL'),
    deviceTypeId: deviceTypeGeneXpertId,
    resultSourceId: await resultSourceToId('DiagnosticDevice'),
    resultCategory1Label: 'HIV',
    resultCategory1i18nKey: 'resultCategoryHiv',
    resultCategory2Label: null,
    resultCategory2i18nKey: null,
    resultDataSchema: geneXpertResultDataSchemaHiv,
    patientDataSchema: geneXpertPatientDataSchema,
  })

  const [geneXpertHiv1QualAssayId] = await knex('Assay').insert({
    name: 'GeneXpert HIV-1 Qual',
    i18nKey: 'assayGeneXpertHiv1Qual',
    externalId: 'GxHiv1Qual',
    assayTypeId: await assayTypeToId('HIV Qual'),
    deviceTypeId: deviceTypeGeneXpertId,
    resultSourceId: await resultSourceToId('DiagnosticDevice'),
    resultCategory1Label: 'HIV',
    resultCategory1i18nKey: 'resultCategoryHiv',
    resultCategory2Label: null,
    resultCategory2i18nKey: null,
    resultDataSchema: geneXpertResultDataSchemaHiv,
    patientDataSchema: geneXpertPatientDataSchema,
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
  const [gxHiv1VlCartridgeId] = await knex('Consumable').insert({
    name: 'Xpert HIV-1 Viral Load Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Cepheid',
  })
  const [gxHiv1QualCartridgeId] = await knex('Consumable').insert({
    name: 'Xpert HIV-1 Qual Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Cepheid',
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
    {
      assayId: geneXpertHiv1VlAssayId,
      consumableId: gxHiv1VlCartridgeId,
      quantity: 1,
    },
    {
      assayId: geneXpertHiv1QualAssayId,
      consumableId: gxHiv1QualCartridgeId,
      quantity: 1,
    },
  ])

  const geneXpertHiv1VlFormSchema = {
    hospitalNumber: {
      i18nLabel: 'hospitalNumber',
      control: {
        type: 'TextBox',
      },
      order: 1,
    },
    studyID: {
      i18nLabel: 'studyID',
      control: {
        type: 'TextBox',
      },
      order: 2,
    },
    nameOfPatient: {
      i18nLabel: 'nameOfPatient',
      control: {
        type: 'TextBox',
      },
      order: 3,
    },
    surnameOfPatient: {
      i18nLabel: 'surnameOfPatient',
      control: {
        type: 'TextBox',
      },
      order: 4,
    },
    ward: {
      i18nLabel: 'ward',
      control: {
        type: 'TextBox',
      },
      order: 5,
    },
    timeSampleTaken: {
      i18nLabel: 'timeSampleTaken',
      control: {
        type: 'DateTime',
      },
      order: 6,
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
      order: 7,
    },
  }

  const assayAlereQHiv12FormSchema = Object.assign(
    {},
    geneXpertHiv1VlFormSchema,
    {
      timeInstrumentResulted: {
        i18nLabel: 'timeInstrumentResulted',
        control: {
          type: 'DateTime',
        },
        order: 8,
      },
    }
  )

  await knex('ResultForm').insert([
    {
      partnerId,
      assayId: geneXpertHiv1VlAssayId,
      formSchema: JSON.stringify(geneXpertHiv1VlFormSchema),
    },
    {
      partnerId,
      assayId: geneXpertHiv1QualAssayId,
      formSchema: JSON.stringify(geneXpertHiv1VlFormSchema),
    },
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
