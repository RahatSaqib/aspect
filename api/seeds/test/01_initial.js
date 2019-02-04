module.exports = require('../utils').seed(seed)

const config = require('../../src/config')
const {
  getPermissionModules,
  assignAllFeaturesToJobFunctionIds,
} = require('../utils')
const {
  allAssayTypeToId,
  allDeviceTypeCategoryToId,
  allIssueCategoryToId,
  allMessageSeverityToId,
  allPartnerTypeToId,
  allResultCategoryToId,
  allResultSourceToId,
  deviceStatusToId,
  sampleTypeToId,
  resultTypeToId,
  resultWorkflowStatusToId,
  unitToId,
} = require('../../src/shared/dictionary')
const _ = require('lodash')
const bcrypt = require('bcrypt')
const Promise = require('bluebird')
const { randomToken } = require('../../src/deviceApi/apiKey')
const geography = require('./fixtures/geography.json')
const patients = require('./fixtures/patients.json')
const dashboardWidget = require('./fixtures/dashboardWidget.json')
const { errorCodes } = require('./fixtures/errorCodes.js')
const {
  addMilliseconds,
  addMinutes,

  subDays,
} = require('date-fns')

const millisInHour = 1000 * 60 * 60
const millisInMinute = 1000 * 60
const millisInNormalYear = 1000 * 60 * 60 * 24 * 365
const resultTimeFrameInDays = 365

const resultMultiplier = process.env['seeds.resultMultiplier'] || 100
const resultHcvNumber = 0.5 * resultMultiplier
const now = new Date()
const patientNumber = patients.length - 1

const saltRounds = parseInt(config.passwordSaltRounds, 10)

function calculateDateForResult(
  currentResult,
  totalResults,
  randomMillisToAdd
) {
  const daysToSubtract =
    resultTimeFrameInDays -
    Math.ceil(currentResult / totalResults * resultTimeFrameInDays)

  return addMilliseconds(
    subDays(now, daysToSubtract),
    _.random(randomMillisToAdd)
  )
}

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
    password: bcrypt.hashSync('test07', saltRounds),
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

  // Create partner types
  const {
    Funding: partnerTypeFundingId,
    Implementing: partnerTypeImplementingId,
  } = await allPartnerTypeToId()

  // Create partners
  const [partnerOneId] = await knex('Partner').insert({
    name: 'Partner One',
    partnerTypeId: partnerTypeFundingId,
    deviceLogHistoryDays: 14,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
  })

  const [partnerTwoId] = await knex('Partner').insert({
    name: 'Partner Two',
    partnerTypeId: partnerTypeImplementingId,
    deviceLogHistoryDays: 14,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
  })

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

  const m2000ConfigurationDataSchema = JSON.stringify({
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
    firmwareVersions: {
      title: 'Firmware versions',
      type: 'object',
      i18nKey: 'Firmware versions',
      properties: {
        versionAlpha: {
          title: 'Alpha',
          type: 'string',
        },
        versionBeta: {
          title: 'Beta',
          type: 'string',
        },
        versionRC: {
          title: 'RC',
          type: 'string',
        },
        versionGold: {
          title: 'Gold',
          type: 'string',
        },
      },
    },
  })

  const daktariConfigurationDataSchema = JSON.stringify({
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
  })

  const commCareConfigurationDataSchema = JSON.stringify({
    requirePrinter: {
      title: 'Require printer',
      type: 'string',
    },
    firmwareUpdateRequired: {
      title: 'Firmware update required',
      type: 'string',
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

  const commCareDeviceOperationSchema = JSON.stringify({
    longitude: {
      title: 'Longitude',
      type: 'number',
      prefix: '',
      suffix: '',
      decimals: 10,
    },
    latitude: {
      title: 'Latitude',
      type: 'number',
      prefix: '',
      suffix: '',
      decimals: 10,
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

  const [deviceTypeAfinionId] = await knex('DeviceType').insert({
    externalId: 'AlereAfinion',
    name: 'Afinion',
    manufacturer: 'Alere',
    deviceTypeCategoryId: deviceTypeCategoryLab,
  })

  const [deviceTypeQId] = await knex('DeviceType').insert({
    externalId: 'AlereQ',
    name: 'Q',
    manufacturer: 'Alere',
    deviceTypeCategoryId: deviceTypeCategoryLab,
  })

  const [deviceTypeM2000Id] = await knex('DeviceType').insert({
    externalId: 'AbbottM2000',
    name: 'm2000',
    manufacturer: 'Abbott',
    deviceTypeCategoryId: deviceTypeCategoryLab,
    configurationDataSchema: m2000ConfigurationDataSchema,
    deviceOperationSchema,
  })

  const [deviceTypeChaiId] = await knex('DeviceType').insert({
    externalId: 'CHAILIMS',
    name: 'CHAI',
    manufacturer: 'CHAI',
    deviceTypeCategoryId: deviceTypeCategoryLab,
    configurationDataSchema: '{}',
    deviceOperationSchema: '{}',
  })

  const [deviceTypeDaktariVirologyId] = await knex('DeviceType').insert({
    externalId: 'DaktariVirology',
    name: 'Daktari Virology',
    manufacturer: 'Daktari',
    deviceTypeCategoryId: deviceTypeCategoryLab,
    configurationDataSchema: daktariConfigurationDataSchema,
    deviceOperationSchema,
  })

  const [deviceTypeDaktariInSightId] = await knex('DeviceType').insert({
    externalId: 'DaktariInSight',
    name: 'Daktari InSight',
    manufacturer: 'Daktari',
    deviceTypeCategoryId: deviceTypeCategoryLab,
    configurationDataSchema: daktariConfigurationDataSchema,
    deviceOperationSchema,
  })

  const [deviceTypeIdRouter] = await knex('DeviceType').insert({
    externalId: 'MetacomRouter',
    name: 'Metacom Router',
    manufacturer: 'Metacom',
    deviceTypeCategoryId: deviceTypeCategoryConnectivity,
  })

  const [deviceTypeCommCare] = await knex('DeviceType').insert({
    externalId: 'CommCareApp',
    name: 'CommCare App',
    manufacturer: 'CommCare',
    plugin: 'commcare',
    deviceTypeCategoryId: deviceTypeCategoryLab,
    configurationDataSchema: commCareConfigurationDataSchema,
    deviceOperationSchema: commCareDeviceOperationSchema,
  })

  await knex('DeviceType').insert({
    externalId: 'GxAlert',
    name: 'GxAlert',
    manufacturer: 'SystemOne',
    plugin: 'gxalert',
    deviceTypeCategoryId: deviceTypeCategoryInformationSystem,
  })

  // Result source
  const {
    DiagnosticDevice: resultSourceDiagnosticId,
    LIMS: resultSourceLIMSId,
  } = await allResultSourceToId()

  // Assays and AssayTypes
  const {
    'MTB/Rif': assayTypeMTBRifId,
    Ebola: assayTypeEbolaId,
    'HIV VL': assayTypeHivVlId,
    'HIV Qual': assayTypeHivQualId,
    'CD4 Count': assayTypeCD4Id,
    EID: assayTypeEid,
    HCV: assayTypeHcvId,
    'Lipid Panel': assayTypeLipidPanelId,
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

  const commCareResultDataSchemaHiv = JSON.stringify({
    result: {
      title: 'Result',
      type: 'string',
      i18nKey: 'result',
    },
    qaResult: {
      title: 'QA Result',
      type: 'string',
      i18nKey: 'qaResult',
    },
    urlPicture: {
      title: 'Picture URL',
      type: 'string',
      i18nKey: 'urlPicture',
    },
  })

  const commCarePatientDataSchema = JSON.stringify({
    id: {
      title: 'Patient ID',
      type: 'string',
      order: 0,
    },
    name: {
      title: 'First Name',
      type: 'string',
      order: 1,
    },
    surName: {
      title: 'Last Name',
      type: 'string',
      order: 2,
    },
    motherName: {
      title: 'Mother First Name',
      type: 'string',
      order: 3,
    },
    fatherName: {
      title: 'Father First Name',
      type: 'string',
      order: 4,
    },
    studyId: {
      title: 'Study ID',
      type: 'string',
      order: 5,
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
    externalId: 'GxHcv',
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

  const [assayDaktariHcvId] = await knex('Assay').insert({
    name: 'Daktari HCV',
    i18nKey: 'assayDaktariHcv',
    externalId: 'DaktariHcv',
    assayTypeId: assayTypeHcvId,
    deviceTypeId: deviceTypeDaktariVirologyId,
    resultSourceId: resultSourceDiagnosticId,
    resultCategory1Label: 'HCV',
    resultCategory1i18nKey: 'resultCategoryHcv',
    resultCategory2Label: null,
    resultCategory2i18nKey: null,
    resultDataSchema: geneXpertResultDataSchemaHcv,
    patientDataSchema: geneXpertPatientDataSchema,
  })

  const [assayDaktariHivVlId] = await knex('Assay').insert({
    name: 'Daktari HIV-VL',
    i18nKey: 'assayDaktariHivVl',
    externalId: 'DaktariHivVl',
    assayTypeId: assayTypeHivVlId,
    deviceTypeId: deviceTypeDaktariVirologyId,
    resultSourceId: resultSourceDiagnosticId,
    resultCategory1Label: 'HIV',
    resultCategory1i18nKey: 'resultCategoryHiv',
    resultCategory2Label: null,
    resultCategory2i18nKey: null,
    resultDataSchema: geneXpertResultDataSchemaHiv,
    patientDataSchema: geneXpertPatientDataSchema,
  })

  const [assayDaktariCD4Id] = await knex('Assay').insert({
    name: 'Daktari CD4',
    i18nKey: 'assayDaktariCD4',
    externalId: 'DaktariCD4',
    assayTypeId: assayTypeCD4Id,
    deviceTypeId: deviceTypeDaktariInSightId,
    resultSourceId: resultSourceDiagnosticId,
    resultCategory1Label: 'HIV',
    resultCategory1i18nKey: 'resultCategoryHiv',
    resultCategory2Label: null,
    resultCategory2i18nKey: null,
    resultDataSchema: geneXpertResultDataSchemaHiv,
    patientDataSchema: geneXpertPatientDataSchema,
  })

  await knex('Assay').insert({
    name: 'Afinion HIV VL',
    i18nKey: 'assayAfinionHivVl',
    externalId: 'AfinionHivVl',
    assayTypeId: assayTypeHivVlId,
    deviceTypeId: deviceTypeAfinionId,
    resultSourceId: resultSourceDiagnosticId,
    resultDataSchema: JSON.stringify({
      copies: {
        title: 'copies/mL',
        type: 'number',
        list: true,
      },
      log: {
        title: 'log',
        type: 'number',
      },
    }),
  })

  await knex('Assay').insert({
    name: 'Afinion Lipid Panel',
    i18nKey: 'assayAfinionLipidPanel',
    externalId: 'LipidPanel',
    assayTypeId: assayTypeLipidPanelId,
    deviceTypeId: deviceTypeAfinionId,
    resultSourceId: resultSourceDiagnosticId,
    resultDataSchema: JSON.stringify({
      chol: {
        title: 'Chol (mmol/L)',
        type: 'number',
        unit: 'mmol/L',
        list: true,
      },
      trig: {
        title: 'Trig (mmol/L)',
        type: 'number',
        unit: 'mmol/L',
        list: true,
      },
      hdl: {
        title: 'HDL (mmol/L)',
        type: 'number',
        unit: 'mmol/L',
      },
    }),
  })

  await knex('Assay').insert({
    name: 'Q HIV VL',
    i18nKey: 'assayQHivVl',
    externalId: 'HivVl',
    assayTypeId: assayTypeHivVlId,
    deviceTypeId: deviceTypeQId,
    resultSourceId: resultSourceDiagnosticId,
    resultCategory1Label: 'HIV',
    resultCategory1i18nKey: 'resultCategoryHivVl',
  })

  await knex('Assay').insert({
    name: 'Abbott m2000 HIV VL',
    i18nKey: 'AssayAbbottM2000HivVl',
    externalId: 'HivVl',
    assayTypeId: assayTypeHivVlId,
    deviceTypeId: deviceTypeM2000Id,
    resultSourceId: resultSourceDiagnosticId,
    resultCategory1Label: 'HIV',
    resultCategory1i18nKey: 'resultCategoryHivVl',
    resultDataSchema: JSON.stringify({
      resultText: {
        list: true,
        title: 'Result',
        type: 'string',
      },
    }),
    patientDataSchema: JSON.stringify({
      provider: {
        title: 'Provider ID',
        type: 'string',
      },
      name: {
        title: 'Client Name',
        type: 'string',
        order: 1,
      },
      surname: {
        title: 'Client Surname',
        type: 'string',
        order: 2,
      },
      addressPhone: {
        title: 'Address/Phone',
        type: 'string',
        order: 3,
      },
      artNumber: {
        title: 'ART #',
        type: 'string',
        order: 4,
      },
      gender: {
        title: 'Gender',
        type: 'string',
        order: 5,
      },
    }),
  })

  await knex('Assay').insert({
    name: 'Abbott m2000 EID',
    i18nKey: 'AssayAbbottM2000Eid',
    externalId: 'EID',
    assayTypeId: assayTypeEid,
    deviceTypeId: deviceTypeM2000Id,
    resultSourceId: resultSourceDiagnosticId,
    resultCategory1Label: 'EID',
    resultCategory1i18nKey: 'resultCategoryEid',
    resultDataSchema: JSON.stringify({
      resultText: {
        list: true,
        title: 'Result',
        type: 'string',
      },
    }),
    patientDataSchema: JSON.stringify({
      provider: {
        title: 'Provider ID',
        type: 'string',
        order: 0,
      },
      name: {
        title: 'Client Name',
        type: 'string',
        order: 1,
      },
      surname: {
        title: 'Client Surname',
        type: 'string',
        order: 2,
      },
      addressPhone: {
        title: 'Address/Phone',
        type: 'string',
        order: 3,
      },
      motherName: {
        title: "Mother's Name",
        type: 'string',
        order: 4,
      },
      hccNumber: {
        list: true,
        title: 'HCC #',
        type: 'string',
        order: 5,
      },
      gender: {
        title: 'Gender',
        type: 'string',
        order: 6,
      },
    }),
  })

  await knex('Assay').insert({
    name: 'CHAI HIV VL',
    i18nKey: 'AssayChaiHivVl',
    externalId: 'HivVl',
    assayTypeId: assayTypeHivVlId,
    deviceTypeId: deviceTypeChaiId,
    resultSourceId: resultSourceLIMSId,
    resultCategory1Label: 'HIV',
    resultCategory1i18nKey: 'resultCategoryHivVl',
    resultDataSchema: JSON.stringify({
      resultText: {
        list: true,
        title: 'Result',
        type: 'string',
      },
      interpretation: {
        title: 'Interpretation',
        type: 'string',
      },
    }),
    patientDataSchema: JSON.stringify({
      name: {
        title: 'Client Name',
        type: 'string',
        order: 1,
      },
      surname: {
        title: 'Client Surname',
        type: 'string',
        order: 2,
      },
      artNumber: {
        title: 'ART #',
        type: 'string',
        order: 4,
      },
      age: {
        title: 'Age (months)',
        type: 'string',
        order: 3,
      },
      dateOfBirth: {
        title: 'Date of Birth',
        type: 'string',
        order: 4,
      },
      gender: {
        title: 'Gender',
        type: 'string',
        order: 5,
      },
      provider: {
        title: 'Provider',
        type: 'string',
        order: 7,
      },
      phone: {
        title: 'Phone #',
        type: 'string',
        order: 8,
      },
    }),
  })

  await knex('Assay').insert({
    name: 'CHAI EID',
    i18nKey: 'AssayChaiEid',
    externalId: 'EID',
    assayTypeId: assayTypeEid,
    deviceTypeId: deviceTypeChaiId,
    resultSourceId: resultSourceLIMSId,
    resultCategory1Label: 'EID',
    resultCategory1i18nKey: 'resultCategoryEid',
    resultDataSchema: JSON.stringify({
      resultText: {
        list: true,
        title: 'Result',
        type: 'string',
      },
      interpretation: {
        title: 'Interpretation',
        type: 'string',
      },
    }),
    patientDataSchema: JSON.stringify({
      name: {
        title: 'Client Name',
        type: 'string',
        order: 1,
      },
      surname: {
        title: 'Client Surname',
        type: 'string',
        order: 2,
      },
      age: {
        title: 'Age (months)',
        type: 'string',
        order: 3,
      },
      dateOfBirth: {
        title: 'Date of Birth',
        type: 'string',
        order: 4,
      },
      gender: {
        title: 'Gender',
        type: 'string',
        order: 5,
      },
      hccNumber: {
        title: 'HCC #',
        type: 'string',
        order: 6,
      },
      motherName: {
        title: 'Mother Name',
        type: 'string',
        order: 7,
      },
      motherSurname: {
        title: 'Mother Surname',
        type: 'string',
        order: 8,
      },
      phone: {
        title: 'Phone #',
        type: 'string',
        order: 9,
      },
    }),
  })

  const [assayCommCareHiv] = await knex('Assay').insert({
    name: 'CommCare HIV',
    i18nKey: 'commCareHiv',
    externalId: 'CommCareHiv',
    assayTypeId: assayTypeEid,
    deviceTypeId: deviceTypeCommCare,
    resultSourceId: resultSourceDiagnosticId,
    resultCategory1Label: 'Result',
    resultCategory1i18nKey: 'resultCategoryEid',
    resultDataSchema: commCareResultDataSchemaHiv,
    patientDataSchema: commCarePatientDataSchema,
  })

  // Result types
  const resultTypePatientId = await resultTypeToId('Patient')

  // result categories
  const {
    Detected: resultCategoryDetectedId,
    'Trace Detected': resultCategoryTraceDetectedId,
    NotDetected: resultCategoryNotDetectedId,
    Indeterminate: resultCategoryIndeterminateId,
    Invalid: resultCategoryInvalidId,
    NoResult: resultCategoryNoResultId,
    Error: resultCategoryErrorId,
    LessThan1000: resultCategoryLessThan1000,
    MoreThan1000: resultCategoryMoreThan1000,
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

  // Daktari HIV Viral Load
  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayDaktariHivVlId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryLessThan1000,
    assayId: assayDaktariHivVlId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryMoreThan1000,
    assayId: assayDaktariHivVlId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryInvalidId,
    assayId: assayDaktariHivVlId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNoResultId,
    assayId: assayDaktariHivVlId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayDaktariHivVlId,
  })

  // Daktari HCV
  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayDaktariHcvId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryInvalidId,
    assayId: assayDaktariHcvId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNoResultId,
    assayId: assayDaktariHcvId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayDaktariHcvId,
  })

  // Daktari InSight CD4 Count
  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayDaktariCD4Id,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryInvalidId,
    assayId: assayDaktariCD4Id,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNoResultId,
    assayId: assayDaktariCD4Id,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayDaktariCD4Id,
  })

  // CommCare HIV
  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayCommCareHiv,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNotDetectedId,
    assayId: assayCommCareHiv,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayCommCareHiv,
  })

  // Units
  const piece = await unitToId('Piece')

  // Consumable types
  const [consumableGxTbCartridgeId] = await knex('Consumable').insert({
    name: 'GeneXpert TB Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Cepheid',
  })

  const [consumableGxTbUltraCartridgeId] = await knex('Consumable').insert({
    name: 'GeneXpert TB Ultra Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Cepheid',
  })

  const [consumableGxEbolaCartridgeId] = await knex('Consumable').insert({
    name: 'GeneXpert Ebola Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Cepheid',
  })

  const [consumableGxHiv1VlCartridgeId] = await knex('Consumable').insert({
    name: 'Xpert HIV-1 Viral Load Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Cepheid',
  })

  const [consumableGxHcvVlCartridgeId] = await knex('Consumable').insert({
    name: 'Xpert HCV Viral Load Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Cepheid',
  })

  const [consumableGxHiv1QualCartridgeId] = await knex('Consumable').insert({
    name: 'Xpert HIV-1 Qual Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Cepheid',
  })

  await knex('Consumable').insert({
    name: 'Daktari CD4 Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Daktari',
  })

  const [consumableDaktariHivVlCartridgeId] = await knex('Consumable').insert({
    name: 'Daktari HIV-VL Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Daktari',
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

  await knex('ConsumableAssay').insert({
    consumableId: consumableDaktariHivVlCartridgeId,
    assayId: assayDaktariHivVlId,
    quantity: 1,
  })

  // Result Workflow Status
  const processed = await resultWorkflowStatusToId('Processed')

  // Create geographic hierarchy
  const countries = {}
  const siteDatas = []
  await Promise.each(geography.countries, async country => {
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
      'tagRegexSampleId',
      'tagRegexNotes',
      'tagRegexPatientId',
    ])
    const [countryId] = await knex('Country').insert(countryData)
    countryData.id = countryId
    countries[country.abbreviation] = countryData
    countryData.states = {}

    const [countryGeographyId] = await knex('Geography').insert({ countryId })
    countryData.geographyId = countryGeographyId

    await Promise.each(country.states || [], async state => {
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

      await Promise.each(state.lgas || [], async lga => {
        const lgaData = _.pick(lga, ['name'])

        const [lgaId] = await knex('Lga').insert(lgaData)
        lgaData.id = lgaId
        stateData.lgas[lga.name] = lgaData
        lgaData.sites = {}

        const geoData = { countryId, stateId, lgaId }
        const [geographyId] = await knex('Geography').insert(geoData)
        lgaData.geographyId = geographyId
        if (state.name === 'Ohio') {
          const siteData = Object.assign(
            {
              partnerId: partnerOneId,
              geographyId,
              externalId: `${state.name}_${lga.name}`,
              name: `${lga.name} ${country.lgaLabel} ${state.name}`,
              shortName: `${lga.name}, ${stateKey}`,
              city: `${lga.name} City`,
              street1: `${lgaData.id} Main Street`,
              zip: `12345-${lgaData.id}`,
              latitude: _.has(state, 'lat')
                ? state.lat + _.random(-0.5, 0.5, true)
                : undefined,
              longitude: _.has(state, 'lng')
                ? state.lng + _.random(-0.5, 0.5, true)
                : undefined,
            },
            auditFields
          )
          const [siteId] = await knex('Site').insert(siteData)
          siteData.id = siteId
          siteDatas.push(siteData)
        }
      })
    })
  })

  const { id: geographyId } = await knex('Geography as g')
    .innerJoin('Country as c', 'c.id', 'g.countryId')
    .where({ 'c.a3': 'USA' })
    .first('g.id')

  const [adminPersonId] = await knex('Person').insert(
    Object.assign(
      {
        userId: adminId,
        name: 'Admin',
        lastPartnerId: partnerOneId,
        lastCountryId: countries.US.id,
        timezone: countries.US.timezone,
        culture: countries.US.culture,
        geographyId,
      },
      auditFields
    )
  )

  // set admin's email/sms
  await knex('Person')
    .where('userId', adminId)
    .update({
      email: config.admin.email,
      cell: config.admin.cell,
    })

  const deviceStatusApproved = await deviceStatusToId('approved')

  // insert router with sims
  const site = siteDatas[0]
  const [routerId] = await knex('Device').insert(
    Object.assign({}, auditFields, {
      name: `Router at ${site.shortName}`,
      shortName: `Router ${site.shortName}`,
      deviceTypeId: deviceTypeIdRouter,
      deviceStatusId: deviceStatusApproved,
      partnerId: site.partnerId,
      geographyId: site.geographyId,
      siteId: site.id,
      createdOn: new Date(+now - 3 * _.random(10) * millisInHour),
      updatedOn: new Date(+now - _.random(10) * millisInHour),
      lastPingOn: new Date(+now - _.random(10) * millisInHour / 3),
      lastSeenOn: new Date(+now - _.random(10) * millisInHour / 3),
    })
  )

  await knex('DeviceSim').insert(
    Object.assign({}, auditFields, {
      deviceId: routerId,
      provider: 'Vodafone',
      serial: `SRL-${routerId}`,
      number: `+1 413 123 45${routerId}`,
    })
  )

  // insert Daktari devices
  const devicesDaktari = []
  await Promise.each(siteDatas, async (siteData, i) => {
    const device = Object.assign({}, auditFields, {
      name: `Daktari ${siteData.shortName}`,
      shortName: `Daktari ${siteData.shortName}`,
      deviceTypeId: deviceTypeDaktariVirologyId,
      deviceStatusId: deviceStatusApproved,
      configurationData: JSON.stringify({
        requirePrinter: 'yes',
        adminPassword: 'pwd123',
        firmwareUpdateRequired: 'no',
      }),
      partnerId: siteData.partnerId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      deviceId: i === 0 ? routerId : null,
      createdOn: new Date(+now - 3 * i * millisInHour),
      updatedOn: new Date(+now - i * millisInHour),
      lastPingOn: new Date(+now - i * millisInHour / 3),
      lastSeenOn: new Date(+now - i * millisInHour / 3),
      hostId: _.times(8, () =>
        String.fromCharCode(65 + i + (_.random(1) > 0 ? 32 : 0))
      ).join(''),
      serial: _.times(24, () =>
        String.fromCharCode(65 + i + (_.random(1) > 0 ? 32 : 0))
      ).join(''),
    })

    device.id = await knex('Device').insert(device)
    devicesDaktari.push(device)

    // Create API Keys
    await knex('DeviceApiKey').insert(
      Object.assign(
        {
          token: randomToken(),
          revoked: 0,
          partnerId: siteData.partnerId,
          geographyId: siteData.geographyId,
          siteId: siteData.id,
          deviceId: device.id,
        },
        auditFields
      )
    )
  })

  // Insert Inventory Items
  await Promise.each(siteDatas, async (siteData, i) => {
    // TB Cartridges
    await knex('InventoryItem').insert(
      Object.assign(
        {
          consumableId: consumableGxTbCartridgeId,
          siteId: siteData.id,
          lotNumber: `${(i + 3) * (i + 1)}${['A', 'B'][i % 2]}-${(siteData.id +
            i) *
            consumableGxTbCartridgeId}`,
          expiresOn: new Date(
            new Date(
              now.getTime() + _.random(-millisInNormalYear, millisInNormalYear)
            ).setHours(0, 0, 0, 0)
          ),
          quantityOnHand: _.random(0, 1000),
        },
        auditFields
      )
    )
  })

  // some HCV samples for Daktari
  const samples = []
  await Promise.each(siteDatas, async (siteData, i) => {
    const siteDate = siteDatas[i]
    const sample = Object.assign(
      {},
      {
        externalId: `SMP-HCV-GX-${i}`,
        collectedOn: calculateDateForResult(i, resultHcvNumber, millisInMinute),
        sampleTypeId: await sampleTypeToId('DBS'),
        originSiteId: siteDate.id,
      }
    )
    sample.id = await knex('Sample').insert(sample)
    samples.push(sample)
  })

  // Daktari HIV VL  Results:
  const possibleResults = [
    {
      resultText: 'HIV Detected (log {1})',
      category1: resultCategoryDetectedId,
    },
    { resultText: 'HIV Not Detected', category1: resultCategoryNotDetectedId },
    { resultText: 'No Result', category1: resultCategoryNoResultId },
    { resultText: 'Error', category1: resultCategoryErrorId },
    { resultText: 'Invalid', category1: resultCategoryInvalidId },
  ]

  const resultData = {
    probes: {
      gpCt: 25.4,
      gpEndPt: 558.0,
      cicCt: 23.9,
      cicEndPt: 289.0,
      sacCt: 33.8,
      sacEndPt: 650.0,
      npCt: 12.2,
      npEndPt: null,
      qc1Ct: 0.32,
      qc1Endpt: 0,
      qc2Ct: 11.4,
      qc2Endpt: 0.5,
    },
  }

  const resultDatas = []
  _.map(_.range(devicesDaktari.length * 3), i => {
    const device = devicesDaktari[i % siteDatas.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const randomDate = calculateDateForResult(i, resultHcvNumber, 6000)

    const result = possibleResults[_.random(4)]
    let copies = 3200
    let log = 5
    if (result === possibleResults[0]) {
      copies = Math.floor(Math.random() * 500000)
      log = Math.round(Math.random() * 600) / 100
    } else {
      copies = null
      log = null
    }
    resultData.resultText = result.resultText
      .replace('{0}', copies)
      .replace('{1}', log)

    resultDatas.push(
      Object.assign({}, auditFields, {
        externalId: `UQ-DAK-HIV-${i}`,
        assayId: assayDaktariHivVlId,
        partnerId: partnerOneId,
        geographyId: siteData.geographyId,
        siteId: siteData.id,
        deviceId: device.id,
        resultWorkflowStatusId: processed,
        longitude: -81.581222,
        latitude: 28.419348,
        resultSourceId: resultSourceDiagnosticId,
        resultTypeId: resultTypePatientId,
        sampleId: sample.id,
        sampleRunNumber: `${i % 2 + 1}`,
        sampleGroup: `GRP-HIV-${i % 5}`,
        resultCategory1: result.category1,
        resultData: JSON.stringify(resultData),
        assayVersion: '4',
        startedOn: randomDate,
        endedOn: addMinutes(randomDate, 48),
        consumableSerial: `${i}12`,
        consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
        consumableLot: `Lot ${i % 5}`,
        instrumentSerial: `S-1234-${i % 3}`,
        moduleName: 'Module A',
        moduleSerial: `M-1234-${i % 4}`,
        researchId: `R-ID-${i}`,
        patientData: JSON.stringify(patients[_.random(patientNumber)]),
        senderVersion: '4.4',
        senderOperator: 'Aaron',
        notes: 'This is an HIV test result, 123-12',
        errorCode:
          result.category1 === resultCategoryErrorId
            ? errorCodes[_.random(errorCodes.length)]
            : null,
        errorNotes:
          result.category1 === resultCategoryErrorId
            ? 'Exceeded cycle threshold'
            : null,
      })
    )
  })

  await Promise.each(resultDatas, async resultData => {
    const resultId = await knex('Result').insert(resultData)
    await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: processed,
      operator: 'Aaron',
      changedOn: addMinutes(now, 90),
      createdOn: addMinutes(now, 90),
      createdBy: adminId,
    })
  })

  // Job Functions
  const [jobFunctionIdAdmin] = await knex('JobFunction').insert({
    name: 'Admin',
    partnerId: partnerOneId,
  })

  const [jobFunctionIdManager] = await knex('JobFunction').insert({
    name: 'Manager',
    partnerId: partnerOneId,
  })

  const [jobFunctionIdClinician] = await knex('JobFunction').insert({
    name: 'Clinician',
    partnerId: partnerOneId,
  })

  const [jobFunctionIdPartnerTwo] = await knex('JobFunction').insert({
    name: 'Lab Manager',
    partnerId: partnerTwoId,
  })

  // assign features to JobFeatures
  await assignAllFeaturesToJobFunctionIds(knex, [
    jobFunctionIdAdmin,
    jobFunctionIdManager,
    jobFunctionIdPartnerTwo,
    jobFunctionIdClinician,
  ])

  // assign permissions to job functions
  const modules = await getPermissionModules(knex)
  await knex('JobFunctionPermission').insert([
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.demo.admin },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.deviceApiKey.admin,
    },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.device.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.person.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.result.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.site.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.assay.admin },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.inventory.admin,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.notification.admin,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.issue.admin,
    },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.task.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.report.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.browse.view },

    { jobFunctionId: jobFunctionIdManager, permissionId: modules.site.edit },
    { jobFunctionId: jobFunctionIdManager, permissionId: modules.device.edit },
    { jobFunctionId: jobFunctionIdManager, permissionId: modules.assay.edit },
    {
      jobFunctionId: jobFunctionIdManager,
      permissionId: modules.inventory.edit,
    },

    { jobFunctionId: jobFunctionIdPartnerTwo, permissionId: modules.site.edit },
    {
      jobFunctionId: jobFunctionIdPartnerTwo,
      permissionId: modules.device.edit,
    },

    { jobFunctionId: jobFunctionIdClinician, permissionId: modules.site.view },
    {
      jobFunctionId: jobFunctionIdClinician,
      permissionId: modules.device.view,
    },
    { jobFunctionId: jobFunctionIdClinician, permissionId: modules.assay.view },
    {
      jobFunctionId: jobFunctionIdClinician,
      permissionId: modules.inventory.view,
    },
  ])

  // crate jobs for users
  const jobIdAdmin = await knex('Job').insert({
    personId: adminPersonId,
    jobFunctionId: jobFunctionIdAdmin,
  })

  // Constrain jobs by context
  await knex('JobContext').insert([
    { jobId: jobIdAdmin, geographyId: countries.US.geographyId },
  ])

  // Create DashboardWidget
  const widgetIds = {}
  await Promise.each(dashboardWidget.stat, async widget => {
    const widgetData = _.pick(widget, [
      'title',
      'titleI18nKey',
      'subTitle',
      'subTitleI18nKey',
      'sqlForIndicator',
      'link',
      'sortOrder',
    ])
    const [widgetId] = await knex('DashboardWidget').insert(widgetData)
    const statWidgetData = _.pick(widget, [
      'icon',
      'sqlForStatUnit',
      'statUnit',
      'statUnitI18nKey',
      'statStatus',
      'statStatusI18nKey',
      'sqlForExtra',
      'extraUnit',
      'extraUnitI18nKey',
      'extraLabel',
      'extraLabelI18nKey',
    ])
    await knex('DashboardWidgetStat').insert(
      Object.assign({ dashboardWidgetId: widgetId }, statWidgetData)
    )
    widgetIds[_.toLower(widget.title)] = widgetId
  })

  await knex('JobFunctionDashboardWidget').insert([
    { jobFunctionId: jobFunctionIdAdmin, widgetId: widgetIds.sites },
    { jobFunctionId: jobFunctionIdAdmin, widgetId: widgetIds.devices },
    { jobFunctionId: jobFunctionIdAdmin, widgetId: widgetIds.results },
    { jobFunctionId: jobFunctionIdAdmin, widgetId: widgetIds.contacts },

    { jobFunctionId: jobFunctionIdManager, widgetId: widgetIds.sites },
    { jobFunctionId: jobFunctionIdManager, widgetId: widgetIds.devices },
    { jobFunctionId: jobFunctionIdManager, widgetId: widgetIds.contacts },

    { jobFunctionId: jobFunctionIdPartnerTwo, widgetId: widgetIds.sites },
    { jobFunctionId: jobFunctionIdPartnerTwo, widgetId: widgetIds.devices },
    { jobFunctionId: jobFunctionIdPartnerTwo, widgetId: widgetIds.contacts },

    { jobFunctionId: jobFunctionIdClinician, widgetId: widgetIds.sites },
    { jobFunctionId: jobFunctionIdClinician, widgetId: widgetIds.devices },
    { jobFunctionId: jobFunctionIdClinician, widgetId: widgetIds.contacts },
  ])

  // Messages
  const [deviceOfflineAlertTemplateId] = await knex('AlertTemplate').insert(
    Object.assign(
      {
        message: 'Cannot reach network for {{numberOfDays device.lastPingOn}}',
      },
      auditFields
    )
  )

  const [deviceOfflineSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message:
          '{{site.name}} cannot reach network for {{numberOfDays device.lastPingOn}}',
      },
      auditFields
    )
  )

  const [deviceOfflineEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject:
          '{{site.name}} cannot reach network for {{numberOfDays device.lastPingOn}}',
        body:
          '{{site.name}} cannot reach network for {{numberOfDays device.lastPingOn}}',
        htmlBody:
          '<em>{{site.name}}</em> cannot reach network for {{numberOfDays device.lastPingOn}}',
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
          'Temperature errors on Module {{issue.data.moduleName}}; notify RO',
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
          '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}; notify RO',
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
          '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}',
        body:
          '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}; notify RO.',
        htmlBody:
          '<em>{{device.name}}</em> has Temperature errors on Module {{issue.data.moduleName}}; notify RO.',
      },
      auditFields
    )
  )

  // Module power error messages
  const [modulePowerErrorAlertTemplateId] = await knex('AlertTemplate').insert(
    Object.assign(
      {
        message: 'Power errors on Module {{issue.data.moduleName}}; notify RO',
      },
      auditFields
    )
  )

  const [modulePowerErrorSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message:
          '{{device.name}} has power errors on Module {{issue.data.moduleName}}; notify RO',
      },
      auditFields
    )
  )

  const [modulePowerErrorEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject:
          '{{device.name}} has power errors on module {{issue.data.moduleName}}',
        body:
          '{{device.name}} has power errors on module {{issue.data.moduleName}}; notify RO',
        htmlBody:
          '{{device.name}} has power errors on module <em>{{issue.data.moduleName}}</em>; notify RO',
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
        message:
          'Module {{issue.data.moduleName}}: Critical errors; notify R.O.',
      },
      auditFields
    )
  )

  const [moduleFailureErrorSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message:
          'Module {{issue.data.moduleName}} in {{device.name}}: Critical errors; notify RO',
      },
      auditFields
    )
  )

  const [moduleFailureErrorEmailTemplateId] = await knex(
    'EmailTemplate'
  ).insert(
    Object.assign(
      {
        subject: '{{device.name}}: Critical Module Errors',
        body:
          'Module {{issue.data.moduleName}} in {{device.name}}: Critical errors; notify RO',
        htmlBody:
          'Module <em>{{issue.data.moduleName}}</em> in {{device.name}}: Critical errors; notify RO',
      },
      auditFields
    )
  )

  const [deviceNoResultsAlertTemplateId] = await knex('AlertTemplate').insert(
    Object.assign(
      {
        message: 'No testing for {{numberOfDays issue.data.lastResultOn}}',
      },
      auditFields
    )
  )

  const [deviceNoResultsSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message:
          '{{device.name}} no testing for {{numberOfDays issue.data.lastResultOn}}',
      },
      auditFields
    )
  )

  const [deviceNoResultsEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject: '{{device.name}}: No Testing',
        body:
          '{{device.name}} no testing {{numberOfDays issue.data.lastResultOn}}',
        htmlBody:
          '<em>{{device.name}}</em> no testing for {{numberOfDays issue.data.lastResultOn}}',
      },
      auditFields
    )
  )

  const [deviceMaintenanceAlertTemplateId] = await knex('AlertTemplate').insert(
    Object.assign(
      {
        message: 'Under Maintenance',
      },
      auditFields
    )
  )

  const [deviceMaintenanceSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message: '{{site.name}} under maintenance.',
      },
      auditFields
    )
  )

  const [deviceMaintenanceEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject: '{{site.name}} Maintenance',
        body: '{{site.name}} under maintenance.',
        htmlBody: '<em>{{site.name}}</em> maintenance',
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
        message:
          '{{device.name}}: Temperature errors across machine, conduct troubleshooting',
      },
      auditFields
    )
  )

  const [machineTemperatureErrorEmailTemplateId] = await knex(
    'EmailTemplate'
  ).insert(
    Object.assign(
      {
        subject: '{{device.name}}: Machine Temperature Errors',
        body:
          '{{device.name}}: Temperature errors across machine, conduct troubleshooting.',
        htmlBody:
          '<em>{{device.name}}</em>: Temperature errors across machine, conduct troubleshooting.',
      },
      auditFields
    )
  )

  // Module Procedural issue messages
  const [moduleProceduralErrorAlertTemplateId] = await knex(
    'AlertTemplate'
  ).insert(
    Object.assign(
      {
        message:
          'Possible module failure on module {{issue.data.moduleName}} contact engineer',
      },
      auditFields
    )
  )

  const [moduleProceduralErrorSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message:
          '{{device.name}}: Possible module failure on module {{issue.data.moduleName}} contact engineer',
      },
      auditFields
    )
  )

  const [moduleProceduralErrorEmailTemplateId] = await knex(
    'EmailTemplate'
  ).insert(
    Object.assign(
      {
        subject: '{{device.name}}: Possible module failure',
        body:
          '{{device.name}}: Possible module failure on module {{issue.data.moduleName}} contact engineer',
        htmlBody:
          '{{device.name}}: Possible module failure on module <em>{{issue.data.moduleName}}</em> contact engineer',
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
        message:
          '{{device.name}}: Power error across machine, conduct troubleshooting.',
      },
      auditFields
    )
  )

  const [machinePowerErrorEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject: '{{device.name}}: Power error across machine',
        body:
          '{{device.name}}: Power error across machine, conduct troubleshooting.',
        htmlBody:
          '<em>{{device.name}}</em>: Power error across machine, conduct troubleshooting.',
      },
      auditFields
    )
  )

  // Machine Procedural issue templates
  const [machineProceduralErrorAlertTemplateId] = await knex(
    'AlertTemplate'
  ).insert(
    Object.assign(
      {
        message: 'Procedural errors across machine, conduct troubleshooting',
      },
      auditFields
    )
  )

  const [machineProceduralErrorSmsTemplateId] = await knex(
    'SmsTemplate'
  ).insert(
    Object.assign(
      {
        message:
          '{{device.name}}: Procedural errors across machine, conduct troubleshooting',
      },
      auditFields
    )
  )

  const [machineProceduralErrorEmailTemplateId] = await knex(
    'EmailTemplate'
  ).insert(
    Object.assign(
      {
        subject: '{{device.name}}: Procedural Errors',
        body:
          '{{device.name}}: Procedural errors across machine, conduct troubleshooting.',
        htmlBody:
          '<em>{{device.name}}</em>: Procedural errors across machine, conduct troubleshooting.',
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
        message: '{{device.name}} - Cartridge-specific errors exceed 5%',
      },
      auditFields
    )
  )

  const [reagentHealthEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject: '{{device.name}} - Cartridge-specific errors exceed 5%',
        body: '{{device.name}} - Cartridge-specific errors exceed 5%',
        htmlBody: '{{device.name}} - Cartridge-specific errors exceed 5%',
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

  const [deviceMaintenanceMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Recommendation,
    alertTemplateId: deviceMaintenanceAlertTemplateId,
    smsTemplateId: deviceMaintenanceSmsTemplateId,
    emailTemplateId: deviceMaintenanceEmailTemplateId,
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

  const [moduleProceduralErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: moduleProceduralErrorAlertTemplateId,
    smsTemplateId: moduleProceduralErrorSmsTemplateId,
    emailTemplateId: moduleProceduralErrorEmailTemplateId,
  })

  const [machineProceduralErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: machineProceduralErrorAlertTemplateId,
    smsTemplateId: machineProceduralErrorSmsTemplateId,
    emailTemplateId: machineProceduralErrorEmailTemplateId,
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
      name: 'Result Received',
      externalId: 'ResultReceived',
      i18nKey: 'issueTypeResultReceived',
      issueCategoryId: issueCategories.DataHealth,
    },
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
      name: 'Device Maintenance',
      externalId: 'DeviceMaintenance',
      i18nKey: 'issueTypeDeviceMaintenance',
      issueCategoryId: issueCategories.DeviceHealth,
      defaultMessageTypeId: deviceMaintenanceMessageTypeId,
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
      name: 'Module Procedural Error',
      externalId: 'ModuleProceduralError',
      i18nKey: 'issueStatusModuleProceduralError',
      issueCategoryId: issueCategories.DeviceHealth,
      defaultMessageTypeId: moduleProceduralErrorTypeId,
    },
    {
      name: 'Machine Procedural Error',
      externalId: 'MachineProceduralError',
      i18nKey: 'issueStatusMachineProceduralError',
      issueCategoryId: issueCategories.DeviceHealth,
      defaultMessageTypeId: machineProceduralErrorTypeId,
    },
    {
      name: 'Data Category Low Error',
      externalId: 'DataCategoryLowError',
      i18nKey: 'issueStatusMachineProceduralError',
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
    {
      name: 'Module Replaced',
      externalId: 'ModuleReplaced',
      i18nKey: 'issueTypeModuleReplaced',
      issueCategoryId: issueCategories.DeviceHealth,
    },
  ])
}
