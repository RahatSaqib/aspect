module.exports = require('../utils').seed(seed)

const config = require('../../src/config')
const _ = require('lodash')
const bcrypt = require('bcrypt')
const geography = require('./fixtures/geography.json')
const {
  allAssayTypeToId,
  allDeviceTypeCategoryToId,
  allResultCategoryToId,
  allMessageSeverityToId,
  allIssueCategoryToId,
  resultSourceToId,
  unitToId,
} = require('../../src/shared/dictionary')

const now = new Date()

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User')
    .where({ name: 'admin' })
    .first('id')
  if (existingAdminUser) {
    return
  }

  // Create admin user and audit fields
  const [adminId] = await knex('User').insert({
    name: 'admin',
    password: bcrypt.hashSync('0-I-E_pRCE', saltRounds),
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

  // Categories of devices (lab, connectivity...)
  const {
    Lab: deviceTypeCategoryLab,
    Router: deviceTypeCategoryConnectivity,
    'Information System': deviceTypeCategoryInformationSystem,
  } = await allDeviceTypeCategoryToId()

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
  // Device Types
  const [deviceTypeGeneXpertId] = await knex('DeviceType').insert({
    externalId: 'CepheidGeneXpert',
    name: 'GeneXpert',
    manufacturer: 'Cepheid',
    plugin: 'gxconnect',
    deviceTypeCategoryId: deviceTypeCategoryLab,
    configurationDataSchema: geneXpertConfigurationDataSchema,
    deviceOperationSchema,
  })

  await knex('DeviceType').insert({
    externalId: 'MetacomRouter',
    name: 'Metacom Router',
    manufacturer: 'Metacom',
    deviceTypeCategoryId: deviceTypeCategoryConnectivity,
  })

  await knex('DeviceType').insert({
    externalId: 'GxAlert',
    name: 'GxAlert',
    manufacturer: 'SystemOne',
    plugin: 'gxalert',
    deviceTypeCategoryId: deviceTypeCategoryInformationSystem,
  })

  // Result source
  const resultSourceDiagnosticId = await resultSourceToId('DiagnosticDevice')

  // Assays and AssayTypes
  const {
    'MTB/Rif': assayTypeMTBRifId,
    Ebola: assayTypeEbolaId,
    'HIV VL': assayTypeHivVlId,
    'HIV Qual': assayTypeHivQualId,
    HCV: assayTypeHcvId,
    Unknown: assayTypeUnknownId,
  } = await allAssayTypeToId()

  // define resultData object
  const geneXpertResultDataSchema = JSON.stringify({
    resultText: {
      title: 'Result Text',
      type: 'string',
    },
    probes: {
      title: 'Probes',
      type: 'object',
      i18nKey: 'Probes',
      properties: {
        probeA: {
          title: 'Probe A',
          type: 'string',
        },
        probeB: {
          title: 'Probe B',
          type: 'string',
        },
        probeC: {
          title: 'Probe C',
          type: 'string',
        },
        probeD: {
          title: 'Probe D',
          type: 'string',
        },
        probeE: {
          title: 'Probe E',
          type: 'string',
        },
        probeSpc: {
          title: 'Probe Spc',
          type: 'string',
        },
        qc1: {
          title: 'QC1',
          type: 'string',
        },
        qc2: {
          title: 'QC2',
          type: 'string',
        },
        probeACt: {
          title: 'Probe A Ct',
          type: 'number',
        },
        probeBCt: {
          title: 'Probe B Ct',
          type: 'number',
        },
        probeCCt: {
          title: 'Probe C Ct',
          type: 'number',
        },
        probeDCt: {
          title: 'Probe D Ct',
          type: 'number',
        },
        probeECt: {
          title: 'Probe E Ct',
          type: 'number',
        },
        probeSpcCt: {
          title: 'Probe Spc Ct',
          type: 'number',
        },
        qc1Ct: {
          title: 'QC1 Ct',
          type: 'number',
        },
        qc2Ct: {
          title: 'QC2 Ct',
          type: 'number',
        },
        probeAEndpt: {
          title: 'Probe A Endpt',
          type: 'number',
        },
        probeBEndpt: {
          title: 'Probe B Endpt',
          type: 'number',
        },
        probeCEndpt: {
          title: 'Probe C Endpt',
          type: 'number',
        },
        probeDEndpt: {
          title: 'Probe D Endpt',
          type: 'number',
        },
        probeEEndpt: {
          title: 'Probe E Endpt',
          type: 'number',
        },
        probeSpcEndpt: {
          title: 'Probe Spc Endpt',
          type: 'number',
        },
        qc1Endpt: {
          title: 'QC1 Endpt',
          type: 'number',
        },
        qc2Endpt: {
          title: 'QC2 Endpt',
          type: 'number',
        },
      },
    },
  })

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

  const geneXpertResultDataSchemaHcv = JSON.stringify({
    resultText: {
      title: 'Result Text',
      type: 'string',
      i18nKey: 'resultText',
    },
    count: {
      title: 'HCV Count',
      type: 'number',
      list: true,
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

  const [assayGeneXpertMtbRifId] = await knex('Assay').insert({
    name: 'GeneXpert MTB/Rif',
    i18nKey: 'assayGeneXpertMtbRif',
    externalId: 'GxMtbRif',
    assayTypeId: assayTypeMTBRifId,
    deviceTypeId: deviceTypeGeneXpertId,
    resultSourceId: resultSourceDiagnosticId,
    resultCategory1Label: 'MTB',
    resultCategory1i18nKey: 'resultCategoryMtb',
    resultCategory2Label: 'Rif',
    resultCategory2i18nKey: 'resultCategoryRif',
    resultDataSchema: geneXpertResultDataSchema,
    patientDataSchema: geneXpertPatientDataSchema,
  })

  const [assayGeneXpertMtbRifUltraId] = await knex('Assay').insert({
    name: 'GeneXpert MTB/Rif Ultra',
    i18nKey: 'assayGeneXpertMtbRifUltra',
    externalId: 'GxMtbRifUltra',
    assayTypeId: assayTypeMTBRifId,
    deviceTypeId: deviceTypeGeneXpertId,
    resultSourceId: resultSourceDiagnosticId,
    resultCategory1Label: 'MTB',
    resultCategory1i18nKey: 'resultCategoryMtb',
    resultCategory2Label: 'Rif',
    resultCategory2i18nKey: 'resultCategoryRif',
    resultDataSchema: geneXpertResultDataSchema,
    patientDataSchema: geneXpertPatientDataSchema,
  })

  const [assayGeneXpertHiv1VlId] = await knex('Assay').insert({
    name: 'GeneXpert HIV-1 VL',
    i18nKey: 'assayGeneXpertHiv1Vl',
    externalId: 'GxHiv1Vl',
    assayTypeId: assayTypeHivVlId,
    deviceTypeId: deviceTypeGeneXpertId,
    resultSourceId: resultSourceDiagnosticId,
    resultCategory1Label: 'HIV',
    resultCategory1i18nKey: 'resultCategoryHiv',
    resultCategory2Label: null,
    resultCategory2i18nKey: null,
    resultDataSchema: geneXpertResultDataSchemaHiv,
    patientDataSchema: geneXpertPatientDataSchema,
  })

  const [assayGeneXpertHiv1QualId] = await knex('Assay').insert({
    name: 'GeneXpert HIV-1 Qual',
    i18nKey: 'assayGeneXpertHiv1Qual',
    externalId: 'GxHiv1Qual',
    assayTypeId: assayTypeHivQualId,
    deviceTypeId: deviceTypeGeneXpertId,
    resultSourceId: resultSourceDiagnosticId,
    resultCategory1Label: 'HIV',
    resultCategory1i18nKey: 'resultCategoryHiv',
    resultCategory2Label: null,
    resultCategory2i18nKey: null,
    resultDataSchema: geneXpertResultDataSchemaHiv,
    patientDataSchema: geneXpertPatientDataSchema,
  })

  const [assayGeneXpertEbolaId] = await knex('Assay').insert({
    name: 'GeneXpert Ebola',
    i18nKey: 'assayGeneXpertEbola',
    externalId: 'GxEbola',
    assayTypeId: assayTypeEbolaId,
    deviceTypeId: deviceTypeGeneXpertId,
    resultSourceId: resultSourceDiagnosticId,
    resultCategory1Label: 'GP',
    resultCategory1i18nKey: 'resultCategoryEbolaGp',
    resultCategory2Label: 'NP',
    resultCategory2i18nKey: 'resultCategoryEbolaNp',
    resultDataSchema: geneXpertResultDataSchema,
    patientDataSchema: geneXpertPatientDataSchema,
  })

  await knex('Assay').insert({
    name: 'GeneXpert Unknown',
    i18nKey: 'assayGeneXpertUnknown',
    externalId: 'GxUnknown',
    assayTypeId: assayTypeUnknownId,
    deviceTypeId: deviceTypeGeneXpertId,
    resultSourceId: resultSourceDiagnosticId,
    patientDataSchema: geneXpertPatientDataSchema,
  })

  const [assayGeneXpertHcvId] = await knex('Assay').insert({
    name: 'GeneXpert HCV',
    i18nKey: 'assayGeneXpertHcv',
    externalId: 'GeneXpertHcv',
    assayTypeId: assayTypeHcvId,
    deviceTypeId: deviceTypeGeneXpertId,
    resultSourceId: resultSourceDiagnosticId,
    resultCategory1Label: 'HCV',
    resultCategory1i18nKey: 'resultCategoryHcv',
    resultCategory2Label: null,
    resultCategory2i18nKey: null,
    resultDataSchema: geneXpertResultDataSchemaHcv,
    patientDataSchema: geneXpertPatientDataSchema,
  })

  // result categories
  const {
    Detected: resultCategoryDetectedId,
    'Trace Detected': resultCategoryTraceDetectedId,
    NotDetected: resultCategoryNotDetectedId,
    Indeterminate: resultCategoryIndeterminateId,
    Invalid: resultCategoryInvalidId,
    NoResult: resultCategoryNoResultId,
    Error: resultCategoryErrorId,
  } = await allResultCategoryToId()

  // assign categories to Assays
  // GeneXpert MTB/Rif
  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayGeneXpertMtbRifId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNotDetectedId,
    assayId: assayGeneXpertMtbRifId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryIndeterminateId,
    assayId: assayGeneXpertMtbRifId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryInvalidId,
    assayId: assayGeneXpertMtbRifId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNoResultId,
    assayId: assayGeneXpertMtbRifId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayGeneXpertMtbRifId,
  })

  // GeneXpert MTB/Rif Ultra
  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayGeneXpertMtbRifUltraId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryTraceDetectedId,
    assayId: assayGeneXpertMtbRifUltraId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNotDetectedId,
    assayId: assayGeneXpertMtbRifUltraId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryIndeterminateId,
    assayId: assayGeneXpertMtbRifUltraId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryInvalidId,
    assayId: assayGeneXpertMtbRifUltraId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNoResultId,
    assayId: assayGeneXpertMtbRifUltraId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayGeneXpertMtbRifUltraId,
  })

  // GeneXpert HIV-1 Viral Load
  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayGeneXpertHiv1VlId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNotDetectedId,
    assayId: assayGeneXpertHiv1VlId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryInvalidId,
    assayId: assayGeneXpertHiv1VlId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNoResultId,
    assayId: assayGeneXpertHiv1VlId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayGeneXpertHiv1VlId,
  })

  // GeneXpert HIV-1 Qual
  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayGeneXpertHiv1QualId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNotDetectedId,
    assayId: assayGeneXpertHiv1QualId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryInvalidId,
    assayId: assayGeneXpertHiv1QualId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNoResultId,
    assayId: assayGeneXpertHiv1QualId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayGeneXpertHiv1QualId,
  })

  // GeneXpert Ebola
  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayGeneXpertEbolaId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNotDetectedId,
    assayId: assayGeneXpertEbolaId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryInvalidId,
    assayId: assayGeneXpertEbolaId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNoResultId,
    assayId: assayGeneXpertEbolaId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayGeneXpertEbolaId,
  })

  // GeneXpert HCV
  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayGeneXpertHcvId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryInvalidId,
    assayId: assayGeneXpertHcvId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNoResultId,
    assayId: assayGeneXpertHcvId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayGeneXpertHcvId,
  })

  // Units
  const piece = await unitToId('Piece')

  // Consumable types
  const [consumableGxTbCartridgeId] = await knex('Consumable').insert({
    name: 'GeneXpert TB Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Cepheid',
    autoInclude: 0,
  })

  const [consumableGxTbUltraCartridgeId] = await knex('Consumable').insert({
    name: 'GeneXpert TB Ultra Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Cepheid',
    autoInclude: 0,
  })

  const [consumableGxEbolaCartridgeId] = await knex('Consumable').insert({
    name: 'GeneXpert Ebola Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Cepheid',
    autoInclude: 0,
  })

  const [consumableGxHiv1VlCartridgeId] = await knex('Consumable').insert({
    name: 'Xpert HIV-1 Viral Load Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Cepheid',
    autoInclude: 0,
  })

  const [consumableGxHcvVlCartridgeId] = await knex('Consumable').insert({
    name: 'Xpert HCV Viral Load Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Cepheid',
    autoInclude: 0,
  })

  const [consumableGxHiv1QualCartridgeId] = await knex('Consumable').insert({
    name: 'Xpert HIV-1 Qual Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Cepheid',
    autoInclude: 0,
  })

  // Assay Consumables
  await knex('ConsumableAssay').insert({
    consumableId: consumableGxTbCartridgeId,
    assayId: assayGeneXpertMtbRifId,
    quantity: 1,
  })

  await knex('ConsumableAssay').insert({
    consumableId: consumableGxTbUltraCartridgeId,
    assayId: assayGeneXpertMtbRifUltraId,
    quantity: 1,
  })

  await knex('ConsumableAssay').insert({
    consumableId: consumableGxEbolaCartridgeId,
    assayId: assayGeneXpertEbolaId,
    quantity: 1,
  })

  await knex('ConsumableAssay').insert({
    consumableId: consumableGxHcvVlCartridgeId,
    assayId: assayGeneXpertHcvId,
    quantity: 1,
  })

  await knex('ConsumableAssay').insert({
    consumableId: consumableGxHiv1VlCartridgeId,
    assayId: assayGeneXpertHiv1VlId,
    quantity: 1,
  })

  await knex('ConsumableAssay').insert({
    consumableId: consumableGxHiv1QualCartridgeId,
    assayId: assayGeneXpertHiv1QualId,
    quantity: 1,
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

      const [countryGeographyId] = await knex('Geography').insert({ countryId })
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

  // Users
  const userIds = {}
  const personIds = {}
  const adminName = 'Admin'
  userIds[adminName] = adminId
  const [personId] = await knex('Person').insert(
    Object.assign(
      {
        userId: adminId,
        name: adminName,
        timezone: countries.MM.timezone,
        culture: countries.MM.culture,
        geographyId: countries.MM.geographyId,
      },
      auditFields
    )
  )
  personIds[adminName.toLowerCase()] = personId

  // Messages
  const [deviceOfflineAlertTemplateId] = await knex('AlertTemplate').insert(
    Object.assign(
      {
        message: 'Cannot reach network for {{numberOfDays}} days',
      },
      auditFields
    )
  )

  const [deviceOfflineSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message: '{{site.name}} cannot reach network for {{numberOfDays}} days',
      },
      auditFields
    )
  )

  const [deviceOfflineEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject: '{{site.name}} cannot reach network for {{numberOfDays}} days',
        body: '{{site.name}} cannot reach network for {{numberOfDays}} days',
        htmlBody:
          '<em>{{site.name}}</em> cannot reach network for {{numberOfDays}} days',
      },
      auditFields
    )
  )
  // Module temperature messages
  const [moduleTemperatureErrorAlertTemplateId] = await knex(
    'AlertTemplate'
  ).insert(
    Object.assign(
      {
        message:
          'Temperature errors on Module {{result.moduleName}}; notify RO',
      },
      auditFields
    )
  )

  const [moduleTemperatureErrorSmsTemplateId] = await knex(
    'SmsTemplate'
  ).insert(
    Object.assign(
      {
        message:
          '{{device.name}} has Temperature errors on Module {{result.moduleName}}; notify RO.',
      },
      auditFields
    )
  )

  const [moduleTemperatureErrorEmailTemplateId] = await knex(
    'EmailTemplate'
  ).insert(
    Object.assign(
      {
        subject:
          '{{device.name}} has Temperature errors on Module {{result.moduleName}}; notify RO.',
        body:
          '{{device.name}} has Temperature errors on Module {{result.moduleName}}; notify RO.',
        htmlBody:
          '<em>{{device.name}}</em> has Temperature errors on Module {{result.moduleName}}; notify RO.',
      },
      auditFields
    )
  )

  // Module power error messages
  const [modulePowerErrorAlertTemplateId] = await knex('AlertTemplate').insert(
    Object.assign(
      {
        message: 'Power errors on Module {{result.moduleName}}; notify RO',
      },
      auditFields
    )
  )

  const [modulePowerErrorSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message: 'Power errors on Module {{result.moduleName}}; notify RO',
      },
      auditFields
    )
  )

  const [modulePowerErrorEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject: '{{result.moduleName}} Power Errors',
        body: 'Power errors on Module {{result.moduleName}}; notify RO',
        htmlBody: 'Power errors on <em>{{result.moduleName}}</em> notify RO',
      },
      auditFields
    )
  )

  // Module failure error messages
  const [moduleFailureErrorAlertTemplateId] = await knex(
    'AlertTemplate'
  ).insert(
    Object.assign(
      {
        message: 'Module {{result.moduleName}}: Critical errors; notify R.O.',
      },
      auditFields
    )
  )

  const [moduleFailureErrorSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message: 'Module {{result.moduleName}}: Critical errors; notify R.O.',
      },
      auditFields
    )
  )

  const [moduleFailureErrorEmailTemplateId] = await knex(
    'EmailTemplate'
  ).insert(
    Object.assign(
      {
        subject: 'Module Failure Errors',
        body: 'Module {{result.moduleName}}: Critical errors; notify R.O.',
        htmlBody:
          'Module <em>{{result.moduleName}}</em>: Critical errors; notify R.O.',
      },
      auditFields
    )
  )

  const [deviceNoResultsAlertTemplateId] = await knex('AlertTemplate').insert(
    Object.assign(
      {
        message: 'No testing for {{numberOfDays}} days.',
      },
      auditFields
    )
  )

  const [deviceNoResultsSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message: '{{site.name}} no testing for {{numberOfDays}} days.',
      },
      auditFields
    )
  )

  const [deviceNoResultsEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject: '{{site.name}} No Testing',
        body: '{{site.name}} no testing {{numberOfDays}} days.',
        htmlBody:
          '<em>{{site.name}}</em> no testing for {{numberOfDays}} days.',
      },
      auditFields
    )
  )

  // Machine temperature error messages
  const [machineTemperatureErrorAlertTemplateId] = await knex(
    'AlertTemplate'
  ).insert(
    Object.assign(
      {
        message: 'Temperature errors across machine, conduct troubleshooting.',
      },
      auditFields
    )
  )

  const [machineTemperatureErrorSmsTemplateId] = await knex(
    'SmsTemplate'
  ).insert(
    Object.assign(
      {
        message: 'Temperature errors across machine, conduct troubleshooting.',
      },
      auditFields
    )
  )

  const [machineTemperatureErrorEmailTemplateId] = await knex(
    'EmailTemplate'
  ).insert(
    Object.assign(
      {
        subject: 'Machine Temperature Errors',
        body: 'Temperature errors across machine, conduct troubleshooting.',
        htmlBody: 'Temperature errors across machine, conduct troubleshooting',
      },
      auditFields
    )
  )

  // Module Generic issue messages
  const [moduleGenericErrorAlertTemplateId] = await knex(
    'AlertTemplate'
  ).insert(
    Object.assign(
      {
        message: 'Module {{module.moduleName}} errors, conduct troubleshooting',
      },
      auditFields
    )
  )

  const [moduleGenericErrorSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message: 'Module {{result.moduleName}} errors, conduct troubleshooting',
      },
      auditFields
    )
  )

  const [moduleGenericErrorEmailTemplateId] = await knex(
    'EmailTemplate'
  ).insert(
    Object.assign(
      {
        subject: 'Machine Temperature Errors',
        body: 'Module {{result.moduleName}} errors, conduct troubleshooting',
        htmlBody:
          'Module <em>{{result.moduleName}}</em> errors, conduct troubleshooting',
      },
      auditFields
    )
  )

  // Machine Power issue templates
  const [machinePowerErrorAlertTemplateId] = await knex('AlertTemplate').insert(
    Object.assign(
      {
        message: 'Power error across machine, conduct troubleshooting',
      },
      auditFields
    )
  )

  const [machinePowerErrorSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message: 'Power error across machine, conduct troubleshooting',
      },
      auditFields
    )
  )

  const [machinePowerErrorEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject: 'Power error across machine',
        body: 'Power error across machine, conduct troubleshooting',
        htmlBody: 'Power error across machine, conduct troubleshooting',
      },
      auditFields
    )
  )

  // Machine Generic issue templates
  const [machineGenericErrorAlertTemplateId] = await knex(
    'AlertTemplate'
  ).insert(
    Object.assign(
      {
        message: 'Generic errors across machine, conduct troubleshooting',
      },
      auditFields
    )
  )

  const [machineGenericErrorSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message: 'Generic errors across machine, conduct troubleshooting',
      },
      auditFields
    )
  )

  const [machineGenericErrorEmailTemplateId] = await knex(
    'EmailTemplate'
  ).insert(
    Object.assign(
      {
        subject: 'Generic Errors',
        body: 'Generic errors across machine, conduct troubleshooting',
        htmlBody: 'Generic errors across machine, conduct troubleshooting',
      },
      auditFields
    )
  )

  // Data Category Low issue templates
  const [dataCategoryLowAlertTemplateId] = await knex('AlertTemplate').insert(
    Object.assign(
      {
        message:
          '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
      },
      auditFields
    )
  )

  const [dataCategoryLowSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message:
          '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
      },
      auditFields
    )
  )

  const [dataCategoryLowEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject: 'Low Collection Rate',
        body:
          '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
        htmlBody:
          '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
      },
      auditFields
    )
  )

  // Stock level update issue templates
  const [stockLevelUpdateAlertTemplateId] = await knex('AlertTemplate').insert(
    Object.assign(
      {
        message: 'Update Stock Level',
      },
      auditFields
    )
  )

  const [stockLevelUpdateSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message: '{{site.name}} - Update Stock Level',
      },
      auditFields
    )
  )

  const [stockLevelUpdateEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject: '{{site.name}} - Update Stock Level',
        body: '{{site.name}} - Update Stock Level',
        htmlBody: '{{site.name}} - Update Stock Level',
      },
      auditFields
    )
  )

  // Stock level update issue templates
  const [reagentHealthAlertTemplateId] = await knex('AlertTemplate').insert(
    Object.assign(
      {
        message: 'Cartridge-specific errors exceed 5%',
      },
      auditFields
    )
  )

  const [reagentHealthSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message: '{{site.name}} - Cartridge-specific errors exceed 5%',
      },
      auditFields
    )
  )

  const [reagentHealthEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject: '{{site.name}} - Cartridge-specific errors exceed 5%',
        body: '{{site.name}} - Cartridge-specific errors exceed 5%',
        htmlBody: '{{site.name}} - Cartridge-specific errors exceed 5%',
      },
      auditFields
    )
  )

  const messageSeverities = await allMessageSeverityToId()

  const [deviceOfflineMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: deviceOfflineAlertTemplateId,
    smsTemplateId: deviceOfflineSmsTemplateId,
    emailTemplateId: deviceOfflineEmailTemplateId,
  })

  const [deviceNoResultsMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: deviceNoResultsAlertTemplateId,
    smsTemplateId: deviceNoResultsSmsTemplateId,
    emailTemplateId: deviceNoResultsEmailTemplateId,
  })

  const [moduleFailureErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: moduleFailureErrorAlertTemplateId,
    smsTemplateId: moduleFailureErrorSmsTemplateId,
    emailTemplateId: moduleFailureErrorEmailTemplateId,
  })

  const [moduleTemperatureErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: moduleTemperatureErrorAlertTemplateId,
    smsTemplateId: moduleTemperatureErrorSmsTemplateId,
    emailTemplateId: moduleTemperatureErrorEmailTemplateId,
  })

  const [modulePowerErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: modulePowerErrorAlertTemplateId,
    smsTemplateId: modulePowerErrorSmsTemplateId,
    emailTemplateId: modulePowerErrorEmailTemplateId,
  })

  const [machineTemperatureErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: machineTemperatureErrorAlertTemplateId,
    smsTemplateId: machineTemperatureErrorSmsTemplateId,
    emailTemplateId: machineTemperatureErrorEmailTemplateId,
  })

  const [machinePowerErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: machinePowerErrorAlertTemplateId,
    smsTemplateId: machinePowerErrorSmsTemplateId,
    emailTemplateId: machinePowerErrorEmailTemplateId,
  })

  const [moduleGenericErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: moduleGenericErrorAlertTemplateId,
    smsTemplateId: moduleGenericErrorSmsTemplateId,
    emailTemplateId: moduleGenericErrorEmailTemplateId,
  })

  const [machineGenericErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: machineGenericErrorAlertTemplateId,
    smsTemplateId: machineGenericErrorSmsTemplateId,
    emailTemplateId: machineGenericErrorEmailTemplateId,
  })

  const [dataCategoryLowTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: dataCategoryLowAlertTemplateId,
    smsTemplateId: dataCategoryLowSmsTemplateId,
    emailTemplateId: dataCategoryLowEmailTemplateId,
  })

  const [stockLevelUpdateTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Recommendation,
    alertTemplateId: stockLevelUpdateAlertTemplateId,
    smsTemplateId: stockLevelUpdateSmsTemplateId,
    emailTemplateId: stockLevelUpdateEmailTemplateId,
  })

  const [reagentHealthTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: reagentHealthAlertTemplateId,
    smsTemplateId: reagentHealthSmsTemplateId,
    emailTemplateId: reagentHealthEmailTemplateId,
  })

  // Issues
  const issueCategories = await allIssueCategoryToId()
  await knex('IssueType').insert([
    {
      name: 'Device Offline',
      externalId: 'DeviceOffline',
      i18nKey: 'issueStatusDeviceOffline',
      issueCategoryId: issueCategories.ConnectivityHealth,
      defaultMessageTypeId: deviceOfflineMessageTypeId,
    },
    {
      name: 'Device No Results',
      externalId: 'DeviceNoResults',
      i18nKey: 'issueStatusDeviceNoResults',
      issueCategoryId: issueCategories.ConnectivityHealth,
      defaultMessageTypeId: deviceNoResultsMessageTypeId,
    },
    {
      name: 'Module Failure Error',
      externalId: 'ModuleFailureError',
      i18nKey: 'issueStatusModuleFailureError',
      issueCategoryId: issueCategories.DeviceHealth,
      defaultMessageTypeId: moduleFailureErrorTypeId,
    },
    {
      name: 'Module Temperature Error',
      externalId: 'ModuleTemperatureError',
      i18nKey: 'issueStatusModuleTemperatureError',
      issueCategoryId: issueCategories.DeviceHealth,
      defaultMessageTypeId: moduleTemperatureErrorTypeId,
    },
    {
      name: 'Module Power Error',
      externalId: 'ModulePowerError',
      i18nKey: 'issueStatusModulePowerError',
      issueCategoryId: issueCategories.DeviceHealth,
      defaultMessageTypeId: modulePowerErrorTypeId,
    },
    {
      name: 'Machine Temperature Error',
      externalId: 'MachineTemperatureError',
      i18nKey: 'issueStatusMachineTemperatureError',
      issueCategoryId: issueCategories.DeviceHealth,
      defaultMessageTypeId: machineTemperatureErrorTypeId,
    },
    {
      name: 'Machine Power Error',
      externalId: 'MachinePowerError',
      i18nKey: 'issueStatusMachinePowerError',
      issueCategoryId: issueCategories.DeviceHealth,
      defaultMessageTypeId: machinePowerErrorTypeId,
    },
    {
      name: 'Module Generic Error',
      externalId: 'ModuleGenericError',
      i18nKey: 'issueStatusModuleGenericError',
      issueCategoryId: issueCategories.DeviceHealth,
      defaultMessageTypeId: moduleGenericErrorTypeId,
    },
    {
      name: 'Machine Generic Error',
      externalId: 'MachineGenericError',
      i18nKey: 'issueStatusMachineGenericError',
      issueCategoryId: issueCategories.DeviceHealth,
      defaultMessageTypeId: machineGenericErrorTypeId,
    },
    {
      name: 'Data Category Low Error',
      externalId: 'DataCategoryLowError',
      i18nKey: 'issueStatusMachineGenericError',
      issueCategoryId: issueCategories.DataHealth,
      defaultMessageTypeId: dataCategoryLowTypeId,
    },
    {
      name: 'Stock Level Update',
      externalId: 'StockLevelUpdate',
      i18nKey: 'stockLevelUpdateIssue',
      issueCategoryId: issueCategories.ReagentHealth,
      defaultMessageTypeId: stockLevelUpdateTypeId,
    },
    {
      name: 'Reagent Health Error',
      externalId: 'ReagentHealthError',
      i18nKey: 'reagentHealthError',
      issueCategoryId: issueCategories.ReagentHealth,
      defaultMessageTypeId: reagentHealthTypeId,
    },
  ])
}
