module.exports = require('../../src/db').seed(seed)

const config = require('../../src/config')
const _ = require('lodash')
const bcrypt = require('bcrypt')
const { randomToken } = require('../../src/deviceApi/apiKey')
const permissions = require('./fixtures/permissions.json')
const geography = require('./fixtures/geography.json')
const patients = require('./fixtures/patients.json')
const dashboardWidget = require('./fixtures/dashboardWidget.json')
const features = require('./fixtures/features.json')
const { errorCodes } = require('./fixtures/errorCodes.js')
const { rowsAsObject, seedStaticData } = require('../utils')
const {
  addMilliseconds,
  addMinutes,
  addHours,
  subHours,
  subDays,
} = require('date-fns')

const millisInHour = 1000 * 60 * 60
const millisInMinute = 1000 * 60
const millisInNormalYear = 1000 * 60 * 60 * 24 * 365
const resultTimeFrameInDays = 365
const deviceNumber = 50
const routerNumber = 20
const resultMtbNumber = 1000
const resultEbolaNumber = 500
const resultHivVlNumber = 500
const resultHcvNumber = 500
const now = new Date()

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

  await seedStaticData(knex)
  const [
    partnerTypes,
    deviceTypeCategories,
    deviceStatuses,
    resultSources,
    assayTypes,
    resultTypes,
    resultCategories,
    units,
    resultWorkflowStatuses,
    sampleTypes,
    messageSeverities,
    issueCategories,
  ] = await Promise.all([
    rowsAsObject(knex, 'PartnerType', 'name'),
    rowsAsObject(knex, 'DeviceTypeCategory', 'name'),
    rowsAsObject(knex, 'DeviceStatus', 'token'),
    rowsAsObject(knex, 'ResultSource', 'externalId'),
    rowsAsObject(knex, 'AssayType', 'name'),
    rowsAsObject(knex, 'ResultType', 'externalId'),
    rowsAsObject(knex, 'ResultCategory', 'externalId'),
    rowsAsObject(knex, 'Unit', 'name'),
    rowsAsObject(knex, 'ResultWorkflowStatus', 'externalId'),
    rowsAsObject(knex, 'SampleType', 'externalId'),
    rowsAsObject(knex, 'MessageSeverity', 'externalId'),
    rowsAsObject(knex, 'IssueCategory', 'externalId'),
  ])

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
  const partnerTypeFundingId = partnerTypes.Funding.id
  const partnerTypeImplementingId = partnerTypes.Implementing.id

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
  const deviceTypeCategoryLab = deviceTypeCategories.Lab.id
  const deviceTypeCategoryConnectivity = deviceTypeCategories.Router.id
  const deviceTypeCategoryInformationSystem =
    deviceTypeCategories['Information System'].id

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

  // DeviceStatus
  const deviceStatusAssigned = deviceStatuses.assigned.id
  const deviceStatusApproved = deviceStatuses.approved.id

  // Result source
  const resultSourceDiagnosticId = resultSources.DiagnosticDevice.id
  const resultSourceLIMSId = resultSources.LIMS.id

  // Assays and AssayTypes
  const assayTypeMTBRifId = assayTypes['MTB/Rif'].id
  const assayTypeEbolaId = assayTypes.Ebola.id
  const assayTypeHivVlId = assayTypes['HIV VL'].id
  const assayTypeHivQualId = assayTypes['HIV Qual'].id
  const assayTypeCD4Id = assayTypes['CD4 Count'].id
  const assayTypeEid = assayTypes.EID.id
  const assayTypeHcvId = assayTypes.HCV.id
  const assayTypeLipidPanelId = assayTypes['Lipid Panel'].id
  const assayTypeUnknownId = assayTypes.Unknown.id

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
  const resultTypePatientId = resultTypes.Patient.id

  // result categories
  const resultCategoryDetectedId = resultCategories.Detected.id
  const resultCategoryTraceDetectedId = resultCategories['Trace Detected'].id
  const resultCategoryNotDetectedId = resultCategories.NotDetected.id
  const resultCategoryIndeterminateId = resultCategories.Indeterminate.id
  const resultCategoryInvalidId = resultCategories.Invalid.id
  const resultCategoryNoResultId = resultCategories.NoResult.id
  const resultCategoryErrorId = resultCategories.Error.id
  const resultCategoryLessThan1000 = resultCategories.LessThan1000.id
  const resultCategoryMoreThan1000 = resultCategories.MoreThan1000.id

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
  const piece = units.Piece.id

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

  await knex('Consumable').insert({
    name: 'Daktari CD4 Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Daktari',
    autoInclude: 0,
  })

  const [consumableDaktariHivVlCartridgeId] = await knex('Consumable').insert({
    name: 'Daktari HIV-VL Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Daktari',
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

  await knex('ConsumableAssay').insert({
    consumableId: consumableDaktariHivVlCartridgeId,
    assayId: assayDaktariHivVlId,
    quantity: 1,
  })

  // Result Workflow Status
  const ordered = resultWorkflowStatuses.Ordered.id
  const processed = resultWorkflowStatuses.Processed.id
  const validated = resultWorkflowStatuses.Validated.id
  const deliverable = resultWorkflowStatuses.Deliverable.id
  const acknowledged = resultWorkflowStatuses.Acknowledged.id

  // Create permissions
  const modules = {}

  await Promise.all(
    _.map(permissions.modules, module => {
      const moduleData = {}
      modules[module.name] = moduleData
      _.map(module.activities, async activity => {
        const [permissionId] = await knex('Permission').insert({
          module: module.name,
          activity,
        })
        moduleData[activity] = permissionId
      })
    })
  )

  const featureModules = []
  await Promise.all(
    _.map(features.modules, async feature => {
      const [featureId] = await knex('Feature').insert({ module: feature.name })
      featureModules.push(featureId)
    })
  )

  // Create geographic hierarchy
  const countries = {}
  const geographies = []
  const siteDatas = []
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

              // up to 5 of sites at each LGA
              await Promise.all(
                _.map(_.range(1, 6 - lgaData.id % 5), async siteNumber => {
                  const siteData = Object.assign(
                    {
                      partnerId: partnerOneId,
                      geographyId,
                      externalId: `${state.name}_${siteNumber}`,
                      name: `${lga.name} ${country.lgaLabel} ${
                        state.name
                      } #${siteNumber}`,
                      shortName: `${lga.name}, ${stateKey} #${siteNumber}`,
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
                })
              )
            })
          )
        })
      )
    })
  )

  // Users
  const userIds = {}
  const personIds = {}
  await Promise.all(
    _.map(
      [
        'Admin',
        'Bill',
        'Bob',
        'Frank',
        'Ed',
        'Fred',
        'Jason',
        'Jim',
        'Jon',
        'Ned',
        'Sam',
        'Steve',
      ],
      async name => {
        let userId
        if (name === 'Admin') {
          userId = adminId
        } else {
          ;[userId] = await knex('User').insert({
            name: name.toLowerCase(),
            // User "Bill" was migrated from a GxAlert database.
            // Set pw to something that doesn't look like a bcrypt hash
            // so that Gx API is used to verify pw and set on aspect
            password:
              name === 'Bill'
                ? 'SOMESTRING'
                : bcrypt.hashSync('test07', saltRounds),
            legacyPassword: name === 'Bill' ? 1 : 0,
            approved: 1,
            createdOn: now,
            lockedOut: 0,
            failedPasswordAttempts: 0,
          })
        }
        userIds[name.toLowerCase()] = userId

        const lastPartnerId = _.includes(['Jim', 'Jason'], name)
          ? partnerTwoId
          : partnerOneId
        const lastCountryId = _.includes(['Jim', 'Sam'], name)
          ? countries.NG.id
          : countries.US.id
        const timezone = _.includes(['Jim', 'Sam'], name)
          ? countries.NG.timezone
          : countries.US.timezone
        const culture = _.includes(['Jim', 'Sam'], name)
          ? countries.NG.culture
          : countries.US.culture

        const [personId] = await knex('Person').insert(
          Object.assign(
            {
              userId,
              name,
              lastPartnerId,
              lastCountryId,
              timezone,
              culture,
              geographyId: geographies[geographies.length % userId].id,
            },
            auditFields
          )
        )
        personIds[name.toLowerCase()] = personId
      }
    )
  )

  // set admin's email/sms
  await knex('Person')
    .where('userId', adminId)
    .update({
      email: config.admin.email,
      cell: config.admin.cell,
    })

  // insert some routers with sims:
  const routerIds = []
  await Promise.all(
    _.map(_.range(routerNumber), async i => {
      const siteData = siteDatas[i % siteDatas.length]
      const [routerId] = await knex('Device').insert(
        Object.assign({}, auditFields, {
          name: `Router at ${i} ${siteData.shortName}`,
          shortName: `r${i}`,
          deviceTypeId: deviceTypeIdRouter,
          deviceStatusId: deviceStatusApproved,
          partnerId: siteData.partnerId,
          geographyId: siteData.geographyId,
          siteId: siteData.id,
          createdOn: new Date(+now - 3 * i * millisInHour),
          updatedOn: new Date(+now - i * millisInHour),
          lastPingOn: new Date(+now - i * millisInHour / 3),
          lastSeenOn: new Date(+now - i * millisInHour / 3),
        })
      )
      routerIds.push(routerId)
    })
  )

  // ... and 1-3 sims for some routers
  const sims = _.map(_.range(0, routerNumber, 2), i => {
    const routerId = routerIds[i]
    return Object.assign({}, auditFields, {
      deviceId: routerId,
      provider: i % 3 === 0 ? 'Glo' : 'Vodafone',
      serial: `SRL-${routerId}`,
      number: `+1 413 123 45${routerId}`,
    })
  })
  await knex('DeviceSim').insert(sims)

  // insert GeneXpert devices
  const devicesGeneXpert = []
  await Promise.all(
    _.map(_.range(deviceNumber), async i => {
      const siteData = siteDatas[i % siteDatas.length]
      const routerId = routerIds[i]
      const device = Object.assign({}, auditFields, {
        name: `GeneXpert #${i} ${siteData.shortName}`,
        shortName: `GeneXpert #${i}`,
        deviceTypeId: deviceTypeGeneXpertId,
        deviceStatusId:
          _.random(1) > 0 ? deviceStatusApproved : deviceStatusAssigned,
        configurationData: JSON.stringify({
          requirePrinter: 'no',
          adminPassword: 'pwd123',
          firmwareUpdateRequired: 'yes',
          modules: {
            module1: '18889030',
            module2: '51395910',
            module3: '33550994',
            module4: '73235848',
          },
        }),
        partnerId: siteData.partnerId,
        geographyId: siteData.geographyId,
        siteId: siteData.id,
        // not all sites will have a router - we only added routers to some site
        deviceId: routerId || null,
        createdOn: new Date(+now - 3 * i * millisInHour),
        updatedOn: new Date(+now - i * millisInHour),
        lastPingOn: new Date(+now - i * millisInHour / 3),
        lastSeenOn: new Date(+now - i * millisInHour / 3),
        hostId: _.times(8, () =>
          String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))
        ).join(''),
        serial: _.times(24, () =>
          String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))
        ).join(''),
      })

      device.id = await knex('Device').insert(device)
      devicesGeneXpert.push(device)

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

      // Create Status Log
      await knex('DeviceStatusLog').insert({
        deviceId: device.id,
        deviceStatusId:
          _.random(1) > 0 ? deviceStatusApproved : deviceStatusAssigned,
        changedOn: auditFields.updatedOn,
        createdOn: auditFields.createdOn,
        createdBy: auditFields.createdBy,
      })

      // Create DeviceOperation
      const operationNumber = _.random(3, 11)
      await Promise.all(
        _.map(_.range(operationNumber), async j => {
          await knex('DeviceOperation').insert({
            deviceId: device.id,
            data: JSON.stringify({
              voltage: _.random(1.35, 1.65, true),
              temperature: _.random(30, 70),
            }),
            startedOn: new Date(+now + _.random(j, j + 1, true) * millisInHour),
            createdOn: now,
          })
        })
      )
    })
  )

  // insert Daktari devices
  const devicesDaktari = []
  await Promise.all(
    _.map(_.range(deviceNumber), async i => {
      const siteData = siteDatas[i % siteDatas.length]
      const routerId = routerIds[i]
      const device = Object.assign({}, auditFields, {
        name: `Daktari #${i} ${siteData.shortName}`,
        shortName: `Daktari #${i}`,
        deviceTypeId: deviceTypeDaktariVirologyId,
        deviceStatusId:
          _.random(1) > 0 ? deviceStatusApproved : deviceStatusAssigned,
        configurationData: JSON.stringify({
          requirePrinter: 'yes',
          adminPassword: 'pwd123',
          firmwareUpdateRequired: 'no',
        }),
        partnerId: siteData.partnerId,
        geographyId: siteData.geographyId,
        siteId: siteData.id,
        // not all sites will have a router - we only added routers to some site
        deviceId: routerId || null,
        createdOn: new Date(+now - 3 * i * millisInHour),
        updatedOn: new Date(+now - i * millisInHour),
        lastPingOn: new Date(+now - i * millisInHour / 3),
        lastSeenOn: new Date(+now - i * millisInHour / 3),
        hostId: _.times(8, () =>
          String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))
        ).join(''),
        serial: _.times(24, () =>
          String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))
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

      // Create DeviceOperation
      const operationNumber = _.random(3, 11)
      await Promise.all(
        _.map(_.range(operationNumber), async j => {
          await knex('DeviceOperation').insert({
            deviceId: device.id,
            data: JSON.stringify({
              voltage: _.random(1.35, 1.65, true),
              temperature: _.random(30, 70),
            }),
            startedOn: new Date(+now + _.random(j, j + 1, true) * millisInHour),
            createdOn: now,
          })
        })
      )
    })
  )

  // Insert Inventory Items
  await Promise.all(
    _.map(_.range(siteDatas.length), async i => {
      const siteData = siteDatas[i]
      // TB Cartridges
      await knex('InventoryItem').insert(
        Object.assign(
          {
            consumableId: consumableGxTbCartridgeId,
            siteId: siteData.id,
            lotNumber: `${(i + 3) * (i + 1)}${
              ['A', 'B'][i % 2]
            }-${(siteData.id + i) * consumableGxTbCartridgeId}`,
            expiresOn: new Date(
              new Date(
                now.getTime() +
                  _.random(-millisInNormalYear, millisInNormalYear)
              ).setHours(0, 0, 0, 0)
            ),
            quantityOnHand: _.random(0, 1000),
          },
          auditFields
        )
      )
      if (i % 5 === 0) {
        await knex('InventoryItem').insert(
          Object.assign(
            {
              consumableId: consumableGxEbolaCartridgeId,
              siteId: siteData.id,
              lotNumber: `${(i + 7) * (i + 1)}${
                ['Q', 'P'][i % 2]
              }-${(siteData.id + i) * consumableGxEbolaCartridgeId}`,
              expiresOn: new Date(
                new Date(
                  now.getTime() +
                    _.random(-millisInNormalYear, millisInNormalYear)
                ).setHours(0, 0, 0, 0)
              ),
              quantityOnHand: _.random(0, 1000),
            },
            auditFields
          )
        )
      }
      if (i % 7 === 0) {
        await knex('InventoryItem').insert(
          Object.assign(
            {
              consumableId: consumableGxHiv1VlCartridgeId,
              siteId: siteData.id,
              lotNumber: `${(i + 11) * (i + 1)}${
                ['A', 'V'][i % 2]
              }-${(siteData.id + i) * consumableGxHiv1VlCartridgeId}`,
              expiresOn: new Date(
                new Date(
                  now.getTime() +
                    _.random(-millisInNormalYear, millisInNormalYear)
                ).setHours(0, 0, 0, 0)
              ),
              quantityOnHand: _.random(0, 1000),
            },
            auditFields
          )
        )
      }
    })
  )

  const sampleTypeDBSId = sampleTypes.DBS.id
  const sampleTypePlasmaId = sampleTypes.Plasma.id

  // some TB samples:
  let samples = []
  await Promise.all(
    _.map(_.range(resultMtbNumber / 2), async i => {
      const siteData = siteDatas[i % siteDatas.length]
      const sample = Object.assign(
        {},
        {
          externalId: `SMP-TB-${i}`,
          collectedOn: calculateDateForResult(
            i,
            resultMtbNumber,
            millisInMinute
          ),
          sampleTypeId: sampleTypeDBSId,
          originSiteId: siteData.id,
        }
      )

      sample.id = await knex('Sample').insert(sample)

      samples.push(sample)
    })
  )

  // Results section
  // TB results:
  let possibleResults = [
    {
      resultText: 'MTB Detected, Rif Resistance Not Detected',
      category1: resultCategoryDetectedId,
      category2: resultCategoryNotDetectedId,
      minLikelihood: 0,
      maxLikelihood: 20,
    },
    {
      resultText: 'MTB Detected, Rif Resistance Detected',
      category1: resultCategoryDetectedId,
      category2: resultCategoryDetectedId,
      minLikelihood: 21,
      maxLikelihood: 26,
    },
    {
      resultText: 'MTB Detected, Rif Indeterminate',
      category1: resultCategoryDetectedId,
      category2: resultCategoryIndeterminateId,
      minLikelihood: 27,
      maxLikelihood: 28,
    },
    {
      resultText: 'ERROR',
      category1: resultCategoryErrorId,
      category2: null,
      minLikelihood: 29,
      maxLikelihood: 34,
    },
    {
      resultText: 'Invalid',
      category1: resultCategoryInvalidId,
      category2: null,
      minLikelihood: 35,
      maxLikelihood: 38,
    },
    {
      resultText: 'Not Detected',
      category1: resultCategoryDetectedId,
      category2: null,
      minLikelihood: 39,
      maxLikelihood: 100,
    },
  ]

  let resultData = {
    probes: {
      probeA: 'NEG',
      probeB: 'POS',
      probeC: 'NO RESULT',
      probeD: 'NEG',
      probeE: 'POS',
      probeSpc: 'NO RESULT',
      qc1: 'YES',
      qc2: 'No',
      probeACt: 12.32,
      probeBCt: 11.2,
      probeCCt: 12.5,
      probeDCt: 0.5,
      probeECt: 1.2,
      probeSpcCt: 5.78,
      qc1Ct: 1,
      qc2Ct: 0.007,
      probeAEndpt: 1.6,
      probeBEndpt: 2.33,
      probeCEndpt: 457,
      probeDEndpt: 12.43,
      probeEEndpt: 3.14,
      probeSpcEndpt: 8.9018,
      qc1Endpt: 0.1234,
      qc2Endpt: 1.22,
    },
  }

  _.map(_.range(resultMtbNumber), async i => {
    const device = devicesGeneXpert[i % devicesGeneXpert.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const randomDate = calculateDateForResult(i, resultMtbNumber, 6000)

    const rnd = _.random(0, 100)
    const result = _.find(
      possibleResults,
      r => rnd >= r.minLikelihood && rnd <= r.maxLikelihood
    )
    resultData.resultText = result.resultText
    const resultId = await knex('Result').insert(
      Object.assign({}, auditFields, {
        externalId: `UQTB-${i}`,
        assayId: assayGeneXpertMtbRifId,
        partnerId: partnerOneId,
        geographyId: siteData.geographyId,
        siteId: siteData.id,
        deviceId: device.id,
        resultWorkflowStatusId: ordered,
        longitude: -81.581222,
        latitude: 28.419348,
        resultSourceId: resultSourceDiagnosticId,
        resultTypeId: resultTypePatientId,
        sampleId: sample.id,
        sampleRunNumber: `${i % 2 + 1}`,
        sampleGroup: `GRP-HIV-${i % 5}`,
        resultCategory1: result.category1,
        resultCategory2: result.category2,
        resultData: JSON.stringify(resultData),
        assayVersion: '4',
        startedOn: randomDate,
        endedOn: addMinutes(randomDate, 100),
        consumableSerial: `${i}12`,
        consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
        consumableLot: `Lot ${i % 5}`,
        instrumentSerial: `S-1234-${i % 3}`,
        moduleName: 'Module A',
        moduleSerial: `M-1234-${i % 4}`,
        researchId: `R-ID-${i}`,
        patientData: JSON.stringify(patients[_.random(99)]),
        senderVersion: '4.6b',
        senderOperator: 'Marsha',
        notes: 'This is a test... result',
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

    await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: ordered,
      operator: 'Marsha',
      changedOn: subHours(randomDate, 25),
      createdOn: subHours(randomDate, 26),
      createdBy: adminId,
    })

    await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: acknowledged,
      operator: 'John',
      changedOn: addHours(randomDate, 2),
      createdOn: addHours(randomDate, 1),
      createdBy: adminId,
    })

    await knex('DeviceLog').insert({
      deviceId: device.id,
      createdOn: addHours(randomDate, 1),
      senderIp: '0.0.0.0',
      checkPoint: `rrt_${_.random(20)}`,
      source: 'seed data',
      rawMessage: JSON.stringify({
        type: {
          id: _.sample([
            deviceTypeGeneXpertId.name,
            deviceTypeAfinionId.name,
            deviceTypeQId.name,
            deviceTypeM2000Id.name,
            deviceTypeChaiId.name,
            deviceTypeDaktariVirologyId.name,
            deviceTypeDaktariInSightId.name,
            deviceTypeIdRouter.name,
            deviceTypeCommCare.name,
          ]),
          site: {
            id: siteData.externalId,
          },
          result: {
            data: Object.assign({}, auditFields, {
              externalId: `UQTB-${i}`,
              assayId: assayGeneXpertMtbRifId,
              partnerId: partnerOneId,
              geographyId: siteData.geographyId,
              siteId: siteData.id,
              deviceId: device.id,
              resultWorkflowStatusId: ordered,
              longitude: -81.581222,
              latitude: 28.419348,
              resultSourceId: resultSourceDiagnosticId,
              resultTypeId: resultTypePatientId,
              sampleId: sample.id,
              sampleRunNumber: `${i % 2 + 1}`,
              sampleGroup: `GRP-HIV-${i % 5}`,
              resultCategory1: result.category1,
              resultCategory2: result.category2,
              resultData,
              assayVersion: '4',
              startedOn: randomDate,
              endedOn: addMinutes(randomDate, 100),
              consumableSerial: `${i}12`,
              consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
              consumableLot: `Lot ${i % 5}`,
              instrumentSerial: `S-1234-${i % 3}`,
              moduleName: 'Module A',
              moduleSerial: `M-1234-${i % 4}`,
              researchId: `R-ID-${i}`,
              patientData: patients[_.random(99)],
              senderVersion: '4.6b',
              senderOperator: 'Marsha',
              notes: 'This is a test... result',
              errorCode:
                result.category1 === resultCategoryErrorId
                  ? errorCodes[_.random(errorCodes.length)]
                  : null,
              errorNotes:
                result.category1 === resultCategoryErrorId
                  ? 'Exceeded cycle threshold'
                  : null,
            }),
          },
        },
      }),
      deviceConfigurationUpdated: 0,
      resultId,
    })
  })

  // some Ebola samples:
  samples = []
  await Promise.all(
    _.map(_.range(resultEbolaNumber / 2), async i => {
      const siteData = siteDatas[i % siteDatas.length]
      const sample = Object.assign(
        {},
        {
          externalId: `SMP-EB-${i}`,
          collectedOn: calculateDateForResult(
            i,
            resultEbolaNumber,
            millisInMinute
          ),
          sampleTypeId: sampleTypePlasmaId,
          originSiteId: siteData.id,
        }
      )

      sample.id = await knex('Sample').insert(sample)

      samples.push(sample)
    })
  )

  // Ebola results:
  possibleResults = [
    {
      resultText: 'Ebola GP NON DÉTECTÉ|Ebola NP NON DÉTECTÉ',
      category1: resultCategoryNotDetectedId,
      category2: resultCategoryNotDetectedId,
    },
    {
      resultText: 'Ebola GP DÉTECTÉ|Ebola NP NON DÉTECTÉ',
      category1: resultCategoryDetectedId,
      category2: resultCategoryNotDetectedId,
    },
    {
      resultText: 'Ebola GP Not Detected|Ebola NP Detected',
      category1: resultCategoryNotDetectedId,
      category2: resultCategoryDetectedId,
    },
    {
      resultText: 'No Result',
      category1: resultCategoryNoResultId,
      category2: null,
    },
    { resultText: 'ERROR', category1: resultCategoryErrorId, category2: null },
    {
      resultText: 'Invalid',
      category1: resultCategoryInvalidId,
      category2: null,
    },
  ]

  resultData = {
    probes: {
      probeA: null,
      probeB: null,
      probeC: null,
      probeD: null,
      probeE: null,
      probeSpc: null,
      qc1: null,
      qc2: null,
      probeACt: 0.32,
      probeBCt: 0,
      probeCCt: 11.4,
      probeDCt: 0.5,
      probeECt: 1.2,
      probeSpcCt: null,
      qc1Ct: 1,
      qc2Ct: 0.007,
      probeAEndpt: 1.6,
      probeBEndpt: 2.33,
      probeCEndpt: 457,
      probeDEndpt: 12.43,
      probeEEndpt: 3.14,
      probeSpcEndpt: null,
      qc1Endpt: 0.1234,
      qc2Endpt: 1.22,
    },
  }

  _.map(_.range(resultEbolaNumber), async i => {
    const device = devicesGeneXpert[i % devicesGeneXpert.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const randomDate = calculateDateForResult(i, resultEbolaNumber, 6000)

    let j = 0
    await Promise.all(
      _.map(possibleResults, async result => {
        j += 1
        if (_.random(5) === 0) {
          resultData.resultText = result.resultText
          const resultId = await knex('Result').insert(
            Object.assign({}, auditFields, {
              externalId: `UQEB-${i}-${j}`,
              assayId: assayGeneXpertEbolaId,
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
              resultCategory1: result.category1,
              sampleGroup: `GRP-HIV-${i % 5}`,
              resultCategory2: result.category2,
              resultData: JSON.stringify(resultData),
              assayVersion: '4',
              startedOn: randomDate,
              endedOn: addMinutes(randomDate, 100),
              consumableSerial: `${i}12`,
              consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
              consumableLot: `Lot ${i % 5}`,
              instrumentSerial: `S-1234-${i % 3}`,
              moduleName: 'Module A',
              moduleSerial: `M-1234-${i % 4}`,
              researchId: `R-ID-${i}`,
              patientData: JSON.stringify(patients[_.random(99)]),
              senderVersion: '4.7a',
              senderOperator: 'Marsha',
              notes: 'This is an Ebola test result',
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

          await knex('ResultWorkflowLog').insert({
            resultId,
            resultWorkflowStatusId: ordered,
            operator: 'Bill',
            changedOn: subHours(randomDate, 34),
            createdOn: subHours(randomDate, 35),
            createdBy: adminId,
          })

          await knex('ResultWorkflowLog').insert({
            resultId,
            resultWorkflowStatusId: processed,
            operator: 'Marsha',
            changedOn: subHours(randomDate, 13),
            createdOn: subHours(randomDate, 12),
            createdBy: adminId,
          })

          await knex('ResultWorkflowLog').insert({
            resultId,
            resultWorkflowStatusId: acknowledged,
            operator: 'John',
            changedOn: addHours(randomDate, 41),
            createdOn: addHours(randomDate, 42),
            createdBy: adminId,
          })
        }
      })
    )
  })

  // some HIV VL samples:
  samples = []
  await Promise.all(
    _.map(_.range(resultHivVlNumber / 2), async i => {
      const siteData = siteDatas[i % siteDatas.length]
      const sample = Object.assign(
        {},
        {
          externalId: `SMP-HIV-${i}`,
          collectedOn: calculateDateForResult(
            i,
            resultHivVlNumber,
            millisInMinute
          ),
          sampleTypeId: sampleTypeDBSId,
          originSiteId: siteData.id,
        }
      )

      sample.id = await knex('Sample').insert(sample)

      samples.push(sample)
    })
  )

  // HIV VL Results for the GeneXpert:
  possibleResults = [
    {
      resultText: 'HIV-1 DÉTECTÉ {0} copies/mL (log {1})',
      category1: resultCategoryDetectedId,
    },
    { resultText: 'HIV-1 NON DÉTECTÉ', category1: resultCategoryNotDetectedId },
    { resultText: 'No Result', category1: resultCategoryNoResultId },
    { resultText: 'ERROR', category1: resultCategoryErrorId },
    { resultText: 'Invalid', category1: resultCategoryInvalidId },
  ]

  resultData = {
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

  _.map(_.range(resultHivVlNumber), async i => {
    const device = devicesGeneXpert[i % devicesGeneXpert.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const randomDate = calculateDateForResult(i, resultHivVlNumber, 6000)

    // make sure we have at least one result with these status
    const ensureResultIds = [acknowledged, validated, deliverable]
    let j = 0
    await Promise.all(
      _.map(possibleResults, async result => {
        j += 1
        if (_.random(4) === 0) {
          let copies = 3200
          let log = 5
          if (result === possibleResults[0]) {
            copies = Math.floor(Math.random() * 500000)
            log = Math.round(Math.random() * 600) / 100
          } else {
            copies = null
            log = null
          }

          resultData.copies = copies
          resultData.log = log
          resultData.resultText = result.resultText
            .replace('{0}', copies)
            .replace('{1}', log)

          const resultStatus =
            ensureResultIds.shift() || _.random(1) < 0.3
              ? acknowledged
              : _.random(1) < 0.5 ? validated : deliverable

          const resultId = await knex('Result').insert(
            Object.assign({}, auditFields, {
              externalId: `UQHIV-${i}-${j}`,
              assayId: assayGeneXpertHiv1VlId,
              partnerId: partnerOneId,
              geographyId: siteData.geographyId,
              siteId: siteData.id,
              deviceId: device.id,
              resultWorkflowStatusId: resultStatus,
              longitude: -81.581222,
              latitude: 28.419348,
              resultSourceId: resultSourceDiagnosticId,
              resultTypeId: resultTypePatientId,
              sampleId: sample.id,
              sampleRunNumber: `${i % 2 + 1}`,
              resultCategory1: result.category1,
              resultData: JSON.stringify(resultData),
              assayVersion: '4',
              startedOn: randomDate,
              endedOn: addMinutes(randomDate, 92),
              consumableSerial: `${i}12`,
              consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
              consumableLot: `Lot ${i % 5}`,
              instrumentSerial: `S-1234-${i % 3}`,
              moduleName: 'Module A',
              moduleSerial: `M-1234-${i % 4}`,
              researchId: `R-ID-${i}`,
              patientData: JSON.stringify(patients[_.random(99)]),
              senderVersion: '4.4',
              senderOperator: 'Marsha',
              notes: 'This is an HIV test result',
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

          await knex('ResultWorkflowLog').insert({
            resultId,
            resultWorkflowStatusId: resultStatus,
            operator: 'Marsha',
            changedOn: subHours(randomDate, 2),
            createdOn: subHours(randomDate, 3),
            createdBy: adminId,
          })
        }
      })
    )
  })

  // some HCV samples for GeneXpert
  samples = []
  await Promise.all(
    _.map(_.range(resultHcvNumber / 2), async i => {
      const sample = Object.assign(
        {},
        {
          externalId: `SMP-HCV-GX-${i}`,
          collectedOn: calculateDateForResult(
            i,
            resultHcvNumber,
            millisInMinute
          ),
          sampleTypeId: sampleTypeDBSId,
        }
      )

      sample.id = await knex('Sample').insert(sample)

      samples.push(sample)
    })
  )

  // Daktari HCV Results:
  possibleResults = [
    { resultText: 'HCV Detected - {0}', category1: resultCategoryDetectedId },
    { resultText: 'HCV Not Detected', category1: resultCategoryNotDetectedId },
    { resultText: 'No Result', category1: resultCategoryNoResultId },
    { resultText: 'Error', category1: resultCategoryErrorId },
    { resultText: 'Invalid', category1: resultCategoryInvalidId },
  ]

  resultData = {
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

  _.map(_.range(resultHcvNumber), async i => {
    const device = devicesDaktari[i % devicesDaktari.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const randomDate = calculateDateForResult(i, resultHcvNumber, 6000)

    let j = 0
    await Promise.all(
      _.map(possibleResults, async result => {
        j += 1
        if (_.random(4) === 0) {
          let count = 3200
          if (result === possibleResults[0]) {
            count = Math.floor(Math.random() * 100000000)
          } else {
            count = null
          }

          resultData.count = count
          resultData.resultText = result.resultText.replace('{0}', count)

          const resultId = await knex('Result').insert(
            Object.assign({}, auditFields, {
              externalId: `UQ-GX-HCV-${i}-${j}`,
              assayId: assayGeneXpertHcvId,
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
              assayVersion: '4.7',
              startedOn: randomDate,
              endedOn: addMinutes(randomDate, 80),
              consumableSerial: `${i}12`,
              consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
              consumableLot: `Lot ${i % 5}`,
              instrumentSerial: `S-1234-${i % 3}`,
              moduleName: 'Module A',
              moduleSerial: `M-1234-${i % 4}`,
              researchId: `R-ID-${i}`,
              patientData: JSON.stringify(patients[_.random(99)]),
              senderVersion: '4.7b',
              senderOperator: 'Gene Hackman',
              notes: 'This is an HCV test result',
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

          await knex('ResultWorkflowLog').insert({
            resultId,
            resultWorkflowStatusId: processed,
            operator: 'Gene Hackman',
            changedOn: addMinutes(randomDate, 90),
            createdOn: addMinutes(randomDate, 90),
            createdBy: adminId,
          })
        }
      })
    )
  })

  // some HIV VL samples for Daktari
  samples = []
  await Promise.all(
    _.map(_.range(resultHivVlNumber), async i => {
      const siteData = siteDatas[i % siteDatas.length]
      const sample = Object.assign(
        {},
        {
          externalId: `SMP-HIV-DAK-${i}`,
          collectedOn: calculateDateForResult(
            i,
            resultHivVlNumber,
            millisInMinute
          ),
          sampleTypeId: sampleTypeDBSId,
          originSiteId: siteData.id,
        }
      )

      sample.id = await knex('Sample').insert(sample)

      samples.push(sample)
    })
  )

  // HIV VL Results for the GeneXpert:
  possibleResults = [
    {
      resultText: 'HIV Detected (log {1})',
      category1: resultCategoryDetectedId,
    },
    { resultText: 'HIV Not Detected', category1: resultCategoryNotDetectedId },
    { resultText: 'No Result', category1: resultCategoryNoResultId },
    { resultText: 'Error', category1: resultCategoryErrorId },
    { resultText: 'Invalid', category1: resultCategoryInvalidId },
  ]

  resultData = {
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

  _.map(_.range(resultHivVlNumber), async i => {
    const device = devicesDaktari[i % devicesDaktari.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const randomDate = calculateDateForResult(i, resultHivVlNumber, 6000)

    let j = 0
    await Promise.all(
      _.map(possibleResults, async result => {
        j += 1
        if (_.random(4) === 0) {
          let copies = 3200
          let log = 5
          if (result === possibleResults[0]) {
            copies = Math.floor(Math.random() * 500000)
            log = Math.round(Math.random() * 600) / 100
          } else {
            copies = null
            log = null
          }

          resultData.copies = copies
          resultData.log = log
          resultData.resultText = result.resultText
            .replace('{0}', copies)
            .replace('{1}', log)

          const resultId = await knex('Result').insert(
            Object.assign({}, auditFields, {
              externalId: `UQ-DAK-HIV-${i}-${j}`,
              assayId: assayDaktariHivVlId,
              partnerId: partnerOneId,
              geographyId: siteData.geographyId,
              siteId: siteData.id,
              deviceId: device.id,
              resultWorkflowStatusId: acknowledged,
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
              patientData: JSON.stringify(patients[_.random(99)]),
              senderVersion: '4.4',
              senderOperator: 'Aaron',
              notes: 'This is an HIV test result',
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

          await knex('ResultWorkflowLog').insert({
            resultId,
            resultWorkflowStatusId: acknowledged,
            operator: 'Aaron',
            changedOn: addMinutes(randomDate, 90),
            createdOn: addMinutes(randomDate, 90),
            createdBy: adminId,
          })
        }
      })
    )
  })

  // some HCV samples for Daktari
  samples = []
  await Promise.all(
    _.map(_.range(resultHcvNumber / 2), async i => {
      const siteData = siteDatas[i % siteDatas.length]
      const sample = Object.assign(
        {},
        {
          externalId: `SMP-HCV-DAK-${i}`,
          collectedOn: calculateDateForResult(
            i,
            resultHcvNumber,
            millisInMinute
          ),
          sampleTypeId: sampleTypeDBSId,
          originSiteId: siteData.id,
        }
      )

      sample.id = await knex('Sample').insert(sample)

      samples.push(sample)
    })
  )

  // Daktari HCV Results:
  possibleResults = [
    {
      resultText: 'HCV Detected (log {1})',
      category1: resultCategoryDetectedId,
    },
    { resultText: 'HCV Not Detected', category1: resultCategoryNotDetectedId },
    { resultText: 'No Result', category1: resultCategoryNoResultId },
    { resultText: 'Error', category1: resultCategoryErrorId },
    { resultText: 'Invalid', category1: resultCategoryInvalidId },
  ]

  resultData = {
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

  _.map(_.range(resultHcvNumber), async i => {
    const device = devicesDaktari[i % devicesDaktari.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const randomDate = calculateDateForResult(i, resultHcvNumber, 6000)

    let j = 0
    await Promise.all(
      _.map(possibleResults, async result => {
        j += 1
        if (_.random(4) === 0) {
          let copies = 3200
          let log = 5
          if (result === possibleResults[0]) {
            copies = Math.floor(Math.random() * 500000)
            log = Math.round(Math.random() * 600) / 100
          } else {
            copies = null
            log = null
          }

          resultData.copies = copies
          resultData.log = log
          resultData.resultText = result.resultText
            .replace('{0}', copies)
            .replace('{1}', log)

          const resultId = await knex('Result').insert(
            Object.assign({}, auditFields, {
              externalId: `UQ-DAK-HCV-${i}-${j}`,
              assayId: assayDaktariHcvId,
              partnerId: partnerOneId,
              geographyId: siteData.geographyId,
              siteId: siteData.id,
              deviceId: device.id,
              resultWorkflowStatusId: acknowledged,
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
              endedOn: addMinutes(randomDate, 64),
              consumableSerial: `${i}12`,
              consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
              consumableLot: `Lot ${i % 5}`,
              instrumentSerial: `S-1234-${i % 3}`,
              moduleName: 'Module A',
              moduleSerial: `M-1234-${i % 4}`,
              researchId: `R-ID-${i}`,
              patientData: JSON.stringify(patients[_.random(99)]),
              senderVersion: '4.4',
              senderOperator: 'Aaron',
              notes: 'This is an HCV test result',
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

          await knex('ResultWorkflowLog').insert({
            resultId,
            resultWorkflowStatusId: acknowledged,
            operator: 'Aaron',
            changedOn: addMinutes(randomDate, 120),
            createdOn: addMinutes(randomDate, 120),
            createdBy: adminId,
          })
        }
      })
    )
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
  await Promise.all(
    _.map(featureModules, async featureId => {
      await knex('JobFunctionFeature').insert([
        {
          jobFunctionId: jobFunctionIdAdmin,
          featureId,
        },
        {
          jobFunctionId: jobFunctionIdManager,
          featureId,
        },
        {
          jobFunctionId: jobFunctionIdPartnerTwo,
          featureId,
        },
        {
          jobFunctionId: jobFunctionIdClinician,
          featureId,
        },
      ])
    })
  )

  // assign permissions to job functions
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
    personId: personIds.admin,
    jobFunctionId: jobFunctionIdAdmin,
  })

  const jobIdJason = await knex('Job').insert({
    personId: personIds.jason,
    jobFunctionId: jobFunctionIdPartnerTwo,
  })

  const jobIdSam = await knex('Job').insert({
    personId: personIds.sam,
    jobFunctionId: jobFunctionIdAdmin,
  })

  const jobIdBob = await knex('Job').insert({
    personId: personIds.bob,
    jobFunctionId: jobFunctionIdManager,
  })
  const jobIdFrank = await knex('Job').insert({
    personId: personIds.frank,
    jobFunctionId: jobFunctionIdManager,
  })
  const jobIdNed = await knex('Job').insert({
    personId: personIds.ned,
    jobFunctionId: jobFunctionIdClinician,
  })
  const jobIdFred = await knex('Job').insert({
    personId: personIds.fred,
    jobFunctionId: jobFunctionIdClinician,
  })

  // Constrain jobs by context
  await knex('JobContext').insert([
    { jobId: jobIdAdmin, geographyId: countries.US.geographyId },
    { jobId: jobIdJason, geographyId: countries.US.geographyId },
    { jobId: jobIdSam, geographyId: countries.NG.geographyId },
    { jobId: jobIdBob, geographyId: countries.US.states.OH.geographyId },
    { jobId: jobIdFrank, geographyId: countries.US.states.NE.geographyId },
    {
      jobId: jobIdNed,
      geographyId: countries.US.states.OH.lgas.Wayne.geographyId,
    },
    {
      jobId: jobIdFred,
      geographyId: countries.US.states.OH.lgas.Wayne.geographyId,
    },
    {
      jobId: jobIdFred,
      geographyId: countries.US.states.MA.lgas.Suffolk.geographyId,
    },
  ])

  // Fill device flags with random data
  // TODO: Remove when we implemented the jobs that calculate these flags
  const devices = await knex('Device').select('id')
  await Promise.all(
    _.map(devices, async device => {
      await knex('FactDeviceFlag').insert({
        deviceId: device.id,
        offline: _.random(10) === 0,
        service: _.random(10) === 0,
        calibration: _.random(10) === 0,
        errorRate: _.random(10) === 0,
        qcProblem: _.random(10) === 0,
        lowInventory: _.random(10) === 0,
        outOfInventory: _.random(10) === 0,
        expiringInventory: _.random(10) === 0,
        expiringWarranty: _.random(10) === 0,
        updatedOn: now,
      })
    })
  )

  // Create tag
  const [tagOneId] = await knex('Tag').insert({
    title: 'SCO',
    partnerId: partnerOneId,
  })

  const [tagTwoId] = await knex('Tag').insert({
    title: 'STP',
    partnerId: partnerOneId,
  })

  const [tagThreeId] = await knex('Tag').insert({
    title: 'DBP',
    partnerId: partnerTwoId,
  })

  const tagIds = [tagOneId, tagTwoId, tagThreeId]

  const results = await knex('Result')
    .select('id')
    .limit(20)
  await Promise.all(
    _.map(results, async result => {
      await Promise.all(
        _.map(tagIds, async tagId => {
          if (_.random(2) === 0) {
            await knex('ResultTag').insert({
              resultId: result.id,
              tagId,
            })
          }
        })
      )
    })
  )
  // Create DashboardWidget
  const widgetIds = {}
  await Promise.all(
    _.map(dashboardWidget.stat, async widget => {
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
  )

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
          '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}; notify RO.',
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
          '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}; notify RO.',
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
        message: 'Power errors on Module {{issue.data.moduleName}}; notify RO',
      },
      auditFields
    )
  )

  const [modulePowerErrorEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject: '{{issue.data.moduleName}} Power Errors',
        body: 'Power errors on Module {{issue.data.moduleName}}; notify RO',
        htmlBody:
          'Power errors on <em>{{issue.data.moduleName}}</em> notify RO',
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
          'Module {{issue.data.moduleName}}: Critical errors; notify R.O.',
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
        body: 'Module {{issue.data.moduleName}}: Critical errors; notify R.O.',
        htmlBody:
          'Module <em>{{issue.data.moduleName}}</em>: Critical errors; notify R.O.',
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
          '{{site.name}} no testing for {{numberOfDays issue.data.lastResultOn}}',
      },
      auditFields
    )
  )

  const [deviceNoResultsEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject: '{{site.name}} No Testing',
        body:
          '{{site.name}} no testing {{numberOfDays issue.data.lastResultOn}}',
        htmlBody:
          '<em>{{site.name}}</em> no testing for {{numberOfDays issue.data.lastResultOn}}',
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

  // Module Procedural issue messages
  const [moduleProceduralErrorAlertTemplateId] = await knex(
    'AlertTemplate'
  ).insert(
    Object.assign(
      {
        message:
          'Module {{issue.data.moduleName}} errors, conduct troubleshooting',
      },
      auditFields
    )
  )

  const [moduleProceduralErrorSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message:
          'Module {{issue.data.moduleName}} errors, conduct troubleshooting',
      },
      auditFields
    )
  )

  const [moduleProceduralErrorEmailTemplateId] = await knex(
    'EmailTemplate'
  ).insert(
    Object.assign(
      {
        subject: 'Procedural Module Errors',
        body:
          'Module {{issue.data.moduleName}} errors, conduct troubleshooting',
        htmlBody:
          'Module <em>{{issue.data.moduleName}}</em> errors, conduct troubleshooting',
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
        message: 'Procedural errors across machine, conduct troubleshooting',
      },
      auditFields
    )
  )

  const [machineProceduralErrorEmailTemplateId] = await knex(
    'EmailTemplate'
  ).insert(
    Object.assign(
      {
        subject: 'Procedural Errors',
        body: 'Procedural errors across machine, conduct troubleshooting',
        htmlBody: 'Procedural errors across machine, conduct troubleshooting',
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

  const [deviceOfflineMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert.id,
    alertTemplateId: deviceOfflineAlertTemplateId,
    smsTemplateId: deviceOfflineSmsTemplateId,
    emailTemplateId: deviceOfflineEmailTemplateId,
  })

  const [deviceNoResultsMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert.id,
    alertTemplateId: deviceNoResultsAlertTemplateId,
    smsTemplateId: deviceNoResultsSmsTemplateId,
    emailTemplateId: deviceNoResultsEmailTemplateId,
  })

  const [deviceMaintenanceMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Recommendation.id,
    alertTemplateId: deviceMaintenanceAlertTemplateId,
    smsTemplateId: deviceMaintenanceSmsTemplateId,
    emailTemplateId: deviceMaintenanceEmailTemplateId,
  })

  const [moduleFailureErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert.id,
    alertTemplateId: moduleFailureErrorAlertTemplateId,
    smsTemplateId: moduleFailureErrorSmsTemplateId,
    emailTemplateId: moduleFailureErrorEmailTemplateId,
  })

  const [moduleTemperatureErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert.id,
    alertTemplateId: moduleTemperatureErrorAlertTemplateId,
    smsTemplateId: moduleTemperatureErrorSmsTemplateId,
    emailTemplateId: moduleTemperatureErrorEmailTemplateId,
  })

  const [modulePowerErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert.id,
    alertTemplateId: modulePowerErrorAlertTemplateId,
    smsTemplateId: modulePowerErrorSmsTemplateId,
    emailTemplateId: modulePowerErrorEmailTemplateId,
  })

  const [machineTemperatureErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert.id,
    alertTemplateId: machineTemperatureErrorAlertTemplateId,
    smsTemplateId: machineTemperatureErrorSmsTemplateId,
    emailTemplateId: machineTemperatureErrorEmailTemplateId,
  })

  const [machinePowerErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert.id,
    alertTemplateId: machinePowerErrorAlertTemplateId,
    smsTemplateId: machinePowerErrorSmsTemplateId,
    emailTemplateId: machinePowerErrorEmailTemplateId,
  })

  const [moduleProceduralErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert.id,
    alertTemplateId: moduleProceduralErrorAlertTemplateId,
    smsTemplateId: moduleProceduralErrorSmsTemplateId,
    emailTemplateId: moduleProceduralErrorEmailTemplateId,
  })

  const [machineProceduralErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert.id,
    alertTemplateId: machineProceduralErrorAlertTemplateId,
    smsTemplateId: machineProceduralErrorSmsTemplateId,
    emailTemplateId: machineProceduralErrorEmailTemplateId,
  })

  const [dataCategoryLowTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert.id,
    alertTemplateId: dataCategoryLowAlertTemplateId,
    smsTemplateId: dataCategoryLowSmsTemplateId,
    emailTemplateId: dataCategoryLowEmailTemplateId,
  })

  const [stockLevelUpdateTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Recommendation.id,
    alertTemplateId: stockLevelUpdateAlertTemplateId,
    smsTemplateId: stockLevelUpdateSmsTemplateId,
    emailTemplateId: stockLevelUpdateEmailTemplateId,
  })

  const [reagentHealthTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert.id,
    alertTemplateId: reagentHealthAlertTemplateId,
    smsTemplateId: reagentHealthSmsTemplateId,
    emailTemplateId: reagentHealthEmailTemplateId,
  })

  // Issues
  const { id: issueStatusSeverityIdLow } = await knex('IssueStatusSeverity')
    .where('externalId', 'Low')
    .first()

  const { id: issueStatusSeverityIdMedium } = await knex('IssueStatusSeverity')
    .where('externalId', 'Medium')
    .first()

  const { id: issueStatusSeverityIdHigh } = await knex('IssueStatusSeverity')
    .where('externalId', 'High')
    .first()

  await knex('IssueStatus').insert([
    {
      name: 'Inactive',
      externalId: 'Inactive',
      i18nKey: 'issueStatusInactive',
      issueStatusSeverityId: issueStatusSeverityIdLow,
      sortOrder: 5,
    },
    {
      name: 'Active',
      externalId: 'Active',
      i18nKey: 'issueStatusActive',
      issueStatusSeverityId: issueStatusSeverityIdHigh,
      sortOrder: 0,
    },
    {
      name: 'Acknowledged',
      externalId: 'Acknowledged',
      i18nKey: 'issueStatusAcknowledged',
      issueStatusSeverityId: issueStatusSeverityIdMedium,
      sortOrder: 4,
    },
    {
      name: 'OK',
      externalId: 'OK',
      i18nKey: 'issueStatusOK',
      issueStatusSeverityId: issueStatusSeverityIdLow,
      sortOrder: 5,
    },
    {
      name: 'Due Soon',
      externalId: 'DueSoon',
      i18nKey: 'issueStatusDueSoon',
      issueStatusSeverityId: issueStatusSeverityIdMedium,
      sortOrder: 3,
    },
    {
      name: 'Due Now',
      externalId: 'DueNow',
      i18nKey: 'issueStatusDueNow',
      issueStatusSeverityId: issueStatusSeverityIdHigh,
      sortOrder: 2,
    },
    {
      name: 'Overdue',
      externalId: 'Overdue',
      i18nKey: 'issueStatusOverdue',
      issueStatusSeverityId: issueStatusSeverityIdHigh,
      sortOrder: 1,
    },
    {
      name: 'Resolved',
      externalId: 'Resolved',
      i18nKey: 'issueStatusResolved',
      issueStatusSeverityId: issueStatusSeverityIdLow,
      sortOrder: 5,
    },
  ])

  await knex('IssueType').insert([
    {
      name: 'Device Offline',
      externalId: 'DeviceOffline',
      i18nKey: 'issueStatusDeviceOffline',
      issueCategoryId: issueCategories.ConnectivityHealth.id,
      defaultMessageTypeId: deviceOfflineMessageTypeId,
    },
    {
      name: 'Device No Results',
      externalId: 'DeviceNoResults',
      i18nKey: 'issueStatusDeviceNoResults',
      issueCategoryId: issueCategories.ConnectivityHealth.id,
      defaultMessageTypeId: deviceNoResultsMessageTypeId,
    },
    {
      name: 'Device Maintenance',
      externalId: 'DeviceMaintenance',
      i18nKey: 'issueTypeDeviceMaintenance',
      issueCategoryId: issueCategories.DeviceHealth.id,
      defaultMessageTypeId: deviceMaintenanceMessageTypeId,
    },
    {
      name: 'Module Failure Error',
      externalId: 'ModuleFailureError',
      i18nKey: 'issueStatusModuleFailureError',
      issueCategoryId: issueCategories.DeviceHealth.id,
      defaultMessageTypeId: moduleFailureErrorTypeId,
    },
    {
      name: 'Module Temperature Error',
      externalId: 'ModuleTemperatureError',
      i18nKey: 'issueStatusModuleTemperatureError',
      issueCategoryId: issueCategories.DeviceHealth.id,
      defaultMessageTypeId: moduleTemperatureErrorTypeId,
    },
    {
      name: 'Module Power Error',
      externalId: 'ModulePowerError',
      i18nKey: 'issueStatusModulePowerError',
      issueCategoryId: issueCategories.DeviceHealth.id,
      defaultMessageTypeId: modulePowerErrorTypeId,
    },
    {
      name: 'Machine Temperature Error',
      externalId: 'MachineTemperatureError',
      i18nKey: 'issueStatusMachineTemperatureError',
      issueCategoryId: issueCategories.DeviceHealth.id,
      defaultMessageTypeId: machineTemperatureErrorTypeId,
    },
    {
      name: 'Machine Power Error',
      externalId: 'MachinePowerError',
      i18nKey: 'issueStatusMachinePowerError',
      issueCategoryId: issueCategories.DeviceHealth.id,
      defaultMessageTypeId: machinePowerErrorTypeId,
    },
    {
      name: 'Module Procedural Error',
      externalId: 'ModuleProceduralError',
      i18nKey: 'issueStatusModuleProceduralError',
      issueCategoryId: issueCategories.DeviceHealth.id,
      defaultMessageTypeId: moduleProceduralErrorTypeId,
    },
    {
      name: 'Machine Procedural Error',
      externalId: 'MachineProceduralError',
      i18nKey: 'issueStatusMachineProceduralError',
      issueCategoryId: issueCategories.DeviceHealth.id,
      defaultMessageTypeId: machineProceduralErrorTypeId,
    },
    {
      name: 'Data Category Low Error',
      externalId: 'DataCategoryLowError',
      i18nKey: 'issueStatusMachineProceduralError',
      issueCategoryId: issueCategories.DataHealth.id,
      defaultMessageTypeId: dataCategoryLowTypeId,
    },
    {
      name: 'Stock Level Update',
      externalId: 'StockLevelUpdate',
      i18nKey: 'stockLevelUpdateIssue',
      issueCategoryId: issueCategories.ReagentHealth.id,
      defaultMessageTypeId: stockLevelUpdateTypeId,
    },
    {
      name: 'Reagent Health Error',
      externalId: 'ReagentHealthError',
      i18nKey: 'reagentHealthError',
      issueCategoryId: issueCategories.ReagentHealth.id,
      defaultMessageTypeId: reagentHealthTypeId,
    },
  ])
}
