module.exports = require('../../src/db').seed(seed)

const config = require('../../src/config')
const _ = require('lodash')
const bcrypt = require('bcrypt')
const permissions = require('./fixtures/permissions.json')
const geography = require('./fixtures/geography.json')
const features = require('./fixtures/features.json')

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

  // Create partner types
  await knex('PartnerType').insert({
    name: 'Funding',
  })
  await knex('PartnerType').insert({
    name: 'Implementing',
  })

  await knex('PartnerType').insert({
    name: 'Operating',
  })

  // Categories of devices (lab, connectivity...)
  const [deviceTypeCategoryLab] = await knex('DeviceTypeCategory').insert({
    name: 'Lab',
    hasConnectivity: 0,
    hasResults: 1,
  })

  const [deviceTypeCategoryConnectivity] = await knex(
    'DeviceTypeCategory'
  ).insert({
    name: 'Router',
    hasConnectivity: 1,
    hasResults: 0,
  })

  await knex('DeviceTypeCategory').insert({
    name: 'Integrated',
    hasConnectivity: 1,
    hasResults: 1,
  })

  await knex('DeviceTypeCategory').insert({
    name: 'Client',
    hasConnectivity: 0,
    hasResults: 0,
  })

  const [deviceTypeCategoryInformationSystem] = await knex(
    'DeviceTypeCategory'
  ).insert({
    name: 'Information System',
    hasConnectivity: 0,
    hasResults: 1,
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

  // DeviceStatus
  await knex('DeviceStatus').insert({
    name: 'Provisioned',
    i18nKey: 'deviceStatusProvisioned',
    token: 'provisioned',
  })
  await knex('DeviceStatus').insert({
    name: 'Assigned',
    i18nKey: 'deviceStatusAssigned',
    token: 'assigned',
  })
  await knex('DeviceStatus').insert({
    name: 'Approved',
    i18nKey: 'deviceStatusApproved',
    token: 'approved',
  })
  await knex('DeviceStatus').insert({
    name: 'Decommissioned',
    i18nKey: 'deviceStatusDecommissioned',
    token: 'decommissioned',
  })

  // DeviceMaintenanceStatus
  await knex('DeviceMaintenanceStatus').insert({
    name: 'Online',
    i18nKey: 'deviceMaintenanceStatusOnline',
    token: 'online',
  })
  await knex('DeviceMaintenanceStatus').insert({
    name: 'Offline',
    i18nKey: 'deviceMaintenanceStatusOffline',
    token: 'offline',
  })

  // Result source
  const [resultSourceDiagnosticId] = await knex('ResultSource').insert({
    name: 'Diagnostic Device',
    i18nKey: 'resultSourceDiagnostic',
    externalId: 'DiagnosticDevice',
  })

  await knex('ResultSource').insert({
    name: 'Other System',
    i18nKey: 'resultSourceOtherSystem',
    externalId: 'OtherSystem',
  })

  await knex('ResultSource').insert({
    name: 'Entered by Hand',
    i18nKey: 'resultSourceEnteredByHand',
    externalId: 'EnteredByHand',
  })

  await knex('ResultSource').insert({
    name: 'Generated',
    i18nKey: 'resultSourceGenerated',
    externalId: 'Generated',
  })

  // Assays and AssayTypes
  const [assayTypeMTBRifId] = await knex('AssayType').insert({
    name: 'MTB/Rif',
    i18nKey: 'assayTypeMtbRif',
  })

  const [assayTypeEbolaId] = await knex('AssayType').insert({
    name: 'Ebola',
    i18nKey: 'assayTypeEbola',
  })

  const [assayTypeHivVlId] = await knex('AssayType').insert({
    name: 'HIV VL',
    i18nKey: 'assayTypeHivVl',
  })

  const [assayTypeHivQualId] = await knex('AssayType').insert({
    name: 'HIV Qual',
    i18nKey: 'assayTypeHivQual',
  })

  const [assayTypeHcvId] = await knex('AssayType').insert({
    name: 'HCV',
    i18nKey: 'assayTypeHcv',
  })

  const [assayTypeUnknownId] = await knex('AssayType').insert({
    name: 'Unknown',
    i18nKey: 'assayTypeUnknown',
  })

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

  // Result types
  await knex('ResultType').insert({
    name: 'Patient',
    i18nKey: 'resultTypePatient',
    externalId: 'Patient',
  })

  await knex('ResultType').insert({
    name: 'EQA',
    i18nKey: 'resultTypeEqa',
    externalId: 'EQA',
  })

  await knex('ResultType').insert({
    name: 'Training',
    i18nKey: 'resultTypeTraining',
    externalId: 'Training',
  })

  await knex('ResultType').insert({
    name: 'Calibration',
    i18nKey: 'resultTypeCalibration',
    externalId: 'Calibration',
  })

  await knex('ResultType').insert({
    name: 'Study/Research',
    i18nKey: 'resultTypeStudy',
    externalId: 'Study',
  })

  // result categories
  const [resultCategoryDetectedId] = await knex('ResultCategory').insert({
    name: 'Detected',
    i18nKey: 'ResultCategoryDetected',
    externalId: 'Detected',
  })

  const [resultCategoryTraceDetectedId] = await knex('ResultCategory').insert({
    name: 'Trace Detected',
    i18nKey: 'ResultCategoryTraceDetected',
    externalId: 'Trace Detected',
  })

  const [resultCategoryNotDetectedId] = await knex('ResultCategory').insert({
    name: 'Not Detected',
    i18nKey: 'resultCategoryNotDetected',
    externalId: 'NotDetected',
  })

  const [resultCategoryIndeterminateId] = await knex('ResultCategory').insert({
    name: 'Indeterminate',
    i18nKey: 'resultCategoryIndeterminate',
    externalId: 'Indeterminate',
  })

  const [resultCategoryInvalidId] = await knex('ResultCategory').insert({
    name: 'Invalid',
    i18nKey: 'resultCategoryInvalid',
    externalId: 'Invalid',
  })

  const [resultCategoryNoResultId] = await knex('ResultCategory').insert({
    name: 'No Result',
    i18nKey: 'resultCategoryNoResult',
    externalId: 'NoResult',
  })

  const [resultCategoryErrorId] = await knex('ResultCategory').insert({
    name: 'Error',
    i18nKey: 'resultCategoryError',
    externalId: 'Error',
  })

  await knex('ResultCategory').insert({
    name: 'Success',
    i18nKey: 'resultCategorySuccess',
    externalId: 'Success',
  })

  await knex('ResultCategory').insert({
    name: 'Collect New Sample',
    i18nkey: 'resultCategoryCollectNewSample',
    externalId: 'CollectNewSample',
  })

  await knex('ResultCategory').insert({
    name: 'Discordant',
    i18nkey: 'resultCategoryDiscordant',
    externalId: 'Discordant',
  })

  await knex('ResultCategory').insert({
    name: 'LessThan1000',
    i18nkey: 'resultCategoryLessThan1000',
    externalId: 'LessThan1000',
  })

  await knex('ResultCategory').insert({
    name: 'MoreThan1000',
    i18nkey: 'resultCategoryMoreThan1000',
    externalId: 'MoreThan1000',
  })

  await knex('ResultCategory').insert({
    name: 'Rejected',
    i18nkey: 'resultCategoryRejected',
    externalId: 'Rejected',
  })

  await knex('ResultCategory').insert({
    name: 'Missing',
    i18nkey: 'resultCategoryMissing',
    externalId: 'Missing',
  })

  await knex('ResultCategory').insert({
    name: 'Unknown',
    i18nkey: 'resultCategoryUnknown',
    externalId: 'Unknown',
  })

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
  const [piece] = await knex('Unit').insert({
    name: 'Piece',
    shortName: 'pc',
  })

  await knex('Unit').insert({
    name: 'Liter',
    shortName: 'l',
  })

  await knex('Unit').insert({
    name: 'Milliliter',
    shortName: 'ml',
  })

  await knex('Unit').insert({
    name: 'Milligram',
    shortName: 'mg',
  })

  await knex('Unit').insert({
    name: 'Gram',
    shortName: 'g',
  })

  await knex('Unit').insert({
    name: 'Kilogram',
    shortName: 'kg',
  })

  await knex('Unit').insert({
    name: 'Ounce',
    shortName: 'oz',
  })

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

  // Consumable Reasons
  await knex('ConsumableReason').insert({
    name: 'Asserted Zero Inventory',
    i18nKey: 'ConsumableReason_AssertedZeroInventory',
    decrease: 0,
    reset: 1,
  })

  await knex('ConsumableReason').insert({
    name: 'Test Conducted',
    i18nKey: 'ConsumableReason_TestConducted',
    decrease: 1,
    reset: 0,
  })

  await knex('ConsumableReason').insert({
    name: 'Transfer Sent',
    i18nKey: 'ConsumableReason_TransferSent',
    decrease: 1,
    reset: 0,
  })

  await knex('ConsumableReason').insert({
    name: 'Transfer Received',
    i18nKey: 'ConsumableReason_TransferReceived',
    decrease: 0,
    reset: 0,
  })

  await knex('ConsumableReason').insert({
    name: 'Expired',
    i18nKey: 'ConsumableReason_Expired',
    decrease: 1,
    reset: 0,
  })

  await knex('ConsumableReason').insert({
    name: 'Imported',
    i18nKey: 'ConsumableReason_Imported',
    decrease: 0,
    reset: 1,
  })

  await knex('ConsumableReason').insert({
    name: 'Stolen',
    i18nKey: 'ConsumableReason_Stolen',
    decrease: 1,
    reset: 0,
  })

  await knex('ConsumableReason').insert({
    name: 'Lost',
    i18nKey: 'ConsumableReason_Lost',
    decrease: 1,
    reset: 0,
  })

  await knex('ConsumableReason').insert({
    name: 'Captured',
    i18nKey: 'ConsumableReason_Captured',
    decrease: 0,
    reset: 1,
  })

  // Result Workflow Status
  await knex('ResultWorkflowStatus').insert({
    name: 'OK',
    i18nkey: 'ResultWorkflowStatusOK',
    externalId: 'OK',
  })
  await knex('ResultWorkflowStatus').insert({
    name: 'Error',
    i18nkey: 'ResultWorkflowStatusError',
    externalId: 'Error',
  })
  await knex('ResultWorkflowStatus').insert({
    name: 'Ordered',
    i18nkey: 'ResultWorkflowStatusOrdered',
    externalId: 'Ordered',
  })
  await knex('ResultWorkflowStatus').insert({
    name: 'In Progress',
    i18nkey: 'ResultWorkflowStatusInProgress',
    externalId: 'InProgress',
  })
  await knex('ResultWorkflowStatus').insert({
    name: 'Processed',
    i18nkey: 'ResultWorkflowStatusProcessed',
    externalId: 'Processed',
  })
  await knex('ResultWorkflowStatus').insert({
    name: 'Validated',
    i18nkey: 'ResultWorkflowStatusValidated',
    externalId: 'Validated',
  })
  await knex('ResultWorkflowStatus').insert({
    name: 'Ready for delivery',
    i18nkey: 'ResultWorkflowStatusDeliverable',
    externalId: 'Deliverable',
  })
  await knex('ResultWorkflowStatus').insert({
    name: 'Delivered',
    i18nkey: 'ResultWorkflowStatusDelivered',
    externalId: 'Delivered',
  })
  await knex('ResultWorkflowStatus').insert({
    name: 'Acknowledged',
    i18nkey: 'ResultWorkflowStatusAcknowledged',
    externalId: 'Acknowledged',
  })

  await knex('ResultWorkflowStatus').insert({
    name: 'Flagged',
    i18nkey: 'ResultWorkflowStatusFlagged',
    externalId: 'Flagged',
  })

  await knex('ResultWorkflowStatus').insert({
    name: 'Purged',
    i18nkey: 'ResultWorkflowStatusPurged',
    externalId: 'Purged',
  })

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

  await knex('SampleType').insert({
    name: 'DBS',
    i18nKey: 'sampleTypeDBS',
    externalId: 'DBS',
  })

  await knex('SampleType').insert({
    name: 'Plasma',
    i18nKey: 'sampleTypePlasma',
    externalId: 'Plasma',
  })

  await knex('SampleType').insert({
    name: 'Other',
    i18nKey: 'sampleTypeOther',
    externalId: 'Other',
  })

  // Messages
  await knex('MessageStatus').insert([
    {
      name: 'Initial',
      externalId: 'Initial',
      i18nKey: 'messageStatusInitial',
    },
    {
      name: 'Pending',
      externalId: 'Pending',
      i18nKey: 'messageStatusPending',
    },
    {
      name: 'Sent',
      externalId: 'Sent',
      i18nKey: 'messageStatusSent',
    },
    {
      name: 'Error',
      externalId: 'Error',
      i18nKey: 'messageStatusError',
    },
  ])

  await knex('MessageSeverity').insert([
    {
      name: 'Alert',
      externalId: 'Alert',
      i18nKey: 'messageSeverityAlert',
    },
    {
      name: 'Recommendation',
      externalId: 'Recommendation',
      i18nKey: 'messageSeverityRecommendation',
    },
  ])
  const messageSeverities = await rowsAsObject(knex, 'MessageSeverity')

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

  const [moduleGenericErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert.id,
    alertTemplateId: moduleGenericErrorAlertTemplateId,
    smsTemplateId: moduleGenericErrorSmsTemplateId,
    emailTemplateId: moduleGenericErrorEmailTemplateId,
  })

  const [machineGenericErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert.id,
    alertTemplateId: machineGenericErrorAlertTemplateId,
    smsTemplateId: machineGenericErrorSmsTemplateId,
    emailTemplateId: machineGenericErrorEmailTemplateId,
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
  await knex('IssueCategory').insert([
    {
      name: 'Device Health',
      externalId: 'DeviceHealth',
      i18nKey: 'issueCategoryDeviceHealth',
    },
    {
      name: 'Reagent Health',
      externalId: 'ReagentHealth',
      i18nKey: 'issueCategoryReagentHealth',
    },
    {
      name: 'Data Health',
      externalId: 'DataHealth',
      i18nKey: 'issueCategoryDataHealth',
    },
    {
      name: 'Connectivity Health',
      externalId: 'ConnectivityHealth',
      i18nKey: 'issueCategoryConnectivityHealth',
    },
  ])
  const issueCategories = await rowsAsObject(knex, 'IssueCategory')

  await knex('IssueStatus').insert([
    {
      name: 'Inactive',
      externalId: 'Inactive',
      i18nKey: 'issueStatusInactive',
    },
    { name: 'Active', externalId: 'Active', i18nKey: 'issueStatusActive' },
    {
      name: 'Acknowledged',
      externalId: 'Acknowledged',
      i18nKey: 'issueStatusAcknowledged',
    },
    { name: 'OK', externalId: 'OK', i18nKey: 'issueStatusOK' },
    { name: 'Due Soon', externalId: 'DueSoon', i18nKey: 'issueStatusDueSoon' },
    { name: 'Due Now', externalId: 'DueNow', i18nKey: 'issueStatusDueNow' },
    { name: 'Overdue', externalId: 'Overdue', i18nKey: 'issueStatusOverdue' },
    {
      name: 'Resolved',
      externalId: 'Resolved',
      i18nKey: 'issueStatusResolved',
    },
  ])

  await knex('IssueEventStatus').insert([
    {
      externalId: 'Triggered',
    },
    {
      externalId: 'Resolved',
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
      name: 'Module Generic Error',
      externalId: 'ModuleGenericError',
      i18nKey: 'issueStatusModuleGenericError',
      issueCategoryId: issueCategories.DeviceHealth.id,
      defaultMessageTypeId: moduleGenericErrorTypeId,
    },
    {
      name: 'Machine Generic Error',
      externalId: 'MachineGenericError',
      i18nKey: 'issueStatusMachineGenericError',
      issueCategoryId: issueCategories.DeviceHealth.id,
      defaultMessageTypeId: machineGenericErrorTypeId,
    },
    {
      name: 'Data Category Low Error',
      externalId: 'DataCategoryLowError',
      i18nKey: 'issueStatusMachineGenericError',
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

function rowsAsObject(knex, table, column = 'externalId') {
  return knex(table).reduce((memo, row) => {
    memo[row[column]] = row
    return memo
  }, {})
}
