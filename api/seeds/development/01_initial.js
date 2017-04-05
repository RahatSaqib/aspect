module.exports = require('../../src/db').seed(seed)

const config = require('../../src/config')
const _ = require('lodash')
const bcrypt = require('bcrypt')
const { randomToken } = require('../../src/deviceApi/apiKey')
const permissions = require('./fixtures/permissions.json')
const geography = require('./fixtures/geography.json')
const patients = require('./fixtures/patients.json')

const millisInHour = 1000 * 60 * 60
const millisInMinute = 1000 * 60
const millisInNormalYear = 1000 * 60 * 60 * 24 * 365
const deviceNumber = 50
const routerNumber = 20
const resultMtbNumber = 1000
const resultEbolaNumber = 500
const resultHivVlNumber = 500
const resultHcvNumber = 500

const saltRounds = parseInt(config.passwordSaltRounds, 10)

function* seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = yield knex('User').where({ name: 'admin' }).first('id')
  if (existingAdminUser) {
    return
  }

  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = yield knex('User').insert({
    name: 'admin',
    password: bcrypt.hashSync('test07', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0
  })
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId
  }

  // Create partner types
  const partnerTypeFundingId = yield knex('PartnerType').insert({
    name: 'Funding'
  })
  const partnerTypeImplementingId = yield knex('PartnerType').insert({
    name: 'Implementing'
  })

  yield knex('PartnerType').insert({
    name: 'Operating'
  })

  // Create partners
  const [partnerOneId] = yield knex('Partner').insert({
    name: 'Partner One',
    partnerTypeId: partnerTypeFundingId,
    deviceLogHistoryDays: 14
  })

  const [partnerTwoId] = yield knex('Partner').insert({
    name: 'Partner Two',
    partnerTypeId: partnerTypeImplementingId,
    deviceLogHistoryDays: 14
  })
  const [partnerOneOrgUnitId] = yield knex('OrgUnit').insert({
    name: 'Partner One',
    partnerId: partnerOneId,
    depth: 1,
    leftBound: 1,
    rightBound: 6
  })
  const [regionNortheastId] = yield knex('OrgUnit').insert({
    name: 'Northeast',
    partnerId: partnerOneId,
    depth: 2,
    leftBound: 2,
    rightBound: 3
  })
  const [regionMidwestId] = yield knex('OrgUnit').insert({
    name: 'Midwest',
    partnerId: partnerOneId,
    depth: 2,
    leftBound: 4,
    rightBound: 5
  })
  // Categories of devices (lab, connectivity...)
  const [deviceTypeCategoryLab] = yield knex('DeviceTypeCategory').insert({
    name: 'Lab',
    hasConnectivity: 0,
    hasResults: 1
  })
  const [deviceTypeCategoryConnectivity] = yield knex('DeviceTypeCategory').insert({
    name: 'Router',
    hasConnectivity: 1,
    hasResults: 0
  })

  yield knex('DeviceTypeCategory').insert({
    name: 'Integrated',
    hasConnectivity: 1,
    hasResults: 1
  })

  yield knex('DeviceTypeCategory').insert({
    name: 'Client',
    hasConnectivity: 0,
    hasResults: 0
  })

  // define configurationData object
  const geneXpertConfigurationDataSchema = JSON.stringify({
    requirePrinter: {
      title: 'Require printer',
      type: 'string'
    },
    adminPassword: {
      title: 'Admin password',
      type: 'string'
    },
    firmwareUpdateRequired: {
      title: 'Firmware update required',
      type: 'string'
    },
    modules: {
      title: 'Modules',
      type: 'object',
      i18nKey: 'Modules',
      properties: {
        module1: {
          title: 'Module 1',
          type: 'string'
        },
        module2: {
          title: 'Module 2',
          type: 'string'
        },
        module3: {
          title: 'Module 3',
          type: 'string'
        },
        module4: {
          title: 'Module 4',
          type: 'string'
        }
      }
    }
  })
  const m2000ConfigurationDataSchema = JSON.stringify({
    requirePrinter: {
      title: 'Require printer',
      type: 'string'
    },
    adminPassword: {
      title: 'Admin password',
      type: 'string'
    },
    firmwareUpdateRequired: {
      title: 'Firmware update required',
      type: 'string'
    },
    firmwareVersions: {
      title: 'Firmware versions',
      type: 'object',
      i18nKey: 'Firmware versions',
      properties: {
        versionAlpha: {
          title: 'Alpha',
          type: 'string'
        },
        versionBeta: {
          title: 'Beta',
          type: 'string'
        },
        versionRC: {
          title: 'RC',
          type: 'string'
        },
        versionGold: {
          title: 'Gold',
          type: 'string'
        }
      }
    }
  })
  const daktariConfigurationDataSchema = JSON.stringify({
    requirePrinter: {
      title: 'Require printer',
      type: 'string'
    },
    adminPassword: {
      title: 'Admin password',
      type: 'string'
    },
    firmwareUpdateRequired: {
      title: 'Firmware update required',
      type: 'string'
    }
  })

  // define deviceOperation object
  const deviceOperationSchema = JSON.stringify({
    voltage: {
      title: 'Voltage',
      type: 'number',
      prefix: '',
      suffix: 'V',
      decimals: 2
    },
    temperature: {
      title: 'Temperature',
      type: 'number',
      prefix: '',
      suffix: 'F',
      decimals: 1
    }
  })

  // Device Types
  const [deviceTypeGeneXpertId] = yield knex('DeviceType').insert({
    name: 'GeneXpert',
    manufacturer: 'Cepheid',
    deviceTypeCategoryId: deviceTypeCategoryLab,
    configurationDataSchema: geneXpertConfigurationDataSchema,
    deviceOperationSchema
  })

  const [deviceTypeAfinionId] = yield knex('DeviceType').insert({
    name: 'Afinion',
    manufacturer: 'Alere',
    deviceTypeCategoryId: deviceTypeCategoryLab
  })

  const [deviceTypeQId] = yield knex('DeviceType').insert({
    name: 'Q',
    manufacturer: 'Alere',
    deviceTypeCategoryId: deviceTypeCategoryLab
  })

  const [deviceTypeM2000Id] = yield knex('DeviceType').insert({
    name: 'm2000',
    manufacturer: 'Abbott',
    deviceTypeCategoryId: deviceTypeCategoryLab,
    configurationDataSchema: m2000ConfigurationDataSchema,
    deviceOperationSchema
  })

  const [deviceTypeDaktariId] = yield knex('DeviceType').insert({
    name: 'Daktari',
    manufacturer: 'Daktari',
    deviceTypeCategoryId: deviceTypeCategoryLab,
    configurationDataSchema: daktariConfigurationDataSchema,
    deviceOperationSchema
  })

  const [deviceTypeIdRouter] = yield knex('DeviceType').insert({
    name: 'Metacom Router',
    manufacturer: 'Metacom',
    deviceTypeCategoryId: deviceTypeCategoryConnectivity
  })

  // DeviceStatus
  yield knex('DeviceStatus').insert({
    name: 'Provisioned',
    i18nKey: 'deviceStatusProvisioned',
    token: 'provisioned'
  })
  const [deviceStatusAssigned] = yield knex('DeviceStatus').insert({
    name: 'Assigned',
    i18nKey: 'deviceStatusAssigned',
    token: 'assigned'
  })
  const [deviceStatusApproved] = yield knex('DeviceStatus').insert({
    name: 'Approved',
    i18nKey: 'deviceStatusApproved',
    token: 'approved'
  })
  yield knex('DeviceStatus').insert({
    name: 'Decommissioned',
    i18nKey: 'deviceStatusDecommissioned',
    token: 'decommissioned'
  })

  // Assays and AssayTypes
  const [assayTypeMTBRifId] = yield knex('AssayType').insert({
    name: 'MTB/Rif',
    i18nKey: 'assayTypeMtbRif'
  })

  const [assayTypeEbolaId] = yield knex('AssayType').insert({
    name: 'Ebola',
    i18nKey: 'assayTypeEbola'
  })

  const [assayTypeHivVlId] = yield knex('AssayType').insert({
    name: 'HIV VL',
    i18nKey: 'assayTypeHivVl'
  })

  const [assayTypeEid] = yield knex('AssayType').insert({
    name: 'EID',
    i18nKey: 'assayTypeEid'
  })

  const [assayTypeHcvId] = yield knex('AssayType').insert({
    name: 'HCV',
    i18nKey: 'assayTypeHcv'
  })

  const [assayTypeLipidPanelId] = yield knex('AssayType').insert({
    name: 'Lipid Panel',
    i18nKey: 'assayTypeLipidPanel'
  })

  // define resultData object
  const geneXpertResultDataSchema = JSON.stringify({
    resultText: {
      title: 'Result Text',
      type: 'string'
    },
    probes: {
      title: 'Probes',
      type: 'object',
      i18nKey: 'Probes',
      properties: {
        probeA: {
          title: 'Probe A',
          type: 'string'
        },
        probeB: {
          title: 'Probe B',
          type: 'string'
        },
        probeC: {
          title: 'Probe C',
          type: 'string'
        },
        probeD: {
          title: 'Probe D',
          type: 'string'
        },
        probeE: {
          title: 'Probe E',
          type: 'string'
        },
        probeSpc: {
          title: 'Probe Spc',
          type: 'string'
        },
        qc1: {
          title: 'QC1',
          type: 'string'
        },
        qc2: {
          title: 'QC2',
          type: 'string'
        },
        probeACt: {
          title: 'Probe A Ct',
          type: 'number'
        },
        probeBCt: {
          title: 'Probe B Ct',
          type: 'number'
        },
        probeCCt: {
          title: 'Probe C Ct',
          type: 'number'
        },
        probeDCt: {
          title: 'Probe D Ct',
          type: 'number'
        },
        probeECt: {
          title: 'Probe E Ct',
          type: 'number'
        },
        probeSpcCt: {
          title: 'Probe Spc Ct',
          type: 'number'
        },
        qc1Ct: {
          title: 'QC1 Ct',
          type: 'number'
        },
        qc2Ct: {
          title: 'QC2 Ct',
          type: 'number'
        },
        probeAEndpt: {
          title: 'Probe A Endpt',
          type: 'number'
        },
        probeBEndpt: {
          title: 'Probe B Endpt',
          type: 'number'
        },
        probeCEndpt: {
          title: 'Probe C Endpt',
          type: 'number'
        },
        probeDEndpt: {
          title: 'Probe D Endpt',
          type: 'number'
        },
        probeEEndpt: {
          title: 'Probe E Endpt',
          type: 'number'
        },
        probeSpcEndpt: {
          title: 'Probe Spc Endpt',
          type: 'number'
        },
        qc1Endpt: {
          title: 'QC1 Endpt',
          type: 'number'
        },
        qc2Endpt: {
          title: 'QC2 Endpt',
          type: 'number'
        }
      }
    }
  })

  const geneXpertResultDataSchemaHiv = JSON.stringify({
    resultText: {
      title: 'Result Text',
      type: 'string',
      i18nKey: 'resultText'
    },
    copies: {
      title: 'Copies/mL',
      type: 'number',
      list: true
    },
    log: {
      title: 'log',
      type: 'number'
    },
    probes: {
      title: 'Probes',
      type: 'object',
      i18nKey: 'probes',
      properties: {
        gpCt: {
          title: 'GP Ct',
          type: 'number'
        },
        gpEndPt: {
          title: 'GP Endpt',
          type: 'number'
        },
        cicCt: {
          title: 'CIC Ct',
          type: 'number'
        },
        cicEndPt: {
          title: 'CIC EndPt',
          type: 'number'
        },
        sacCt: {
          title: 'SAC Ct',
          type: 'number'
        },
        sacEndPt: {
          title: 'SAC EndPt',
          type: 'number'
        },
        npCt: {
          title: 'NP Ct',
          type: 'number'
        },
        npEndPt: {
          title: 'NP EndPt',
          type: 'number'
        },
        qc1Ct: {
          title: 'QC1 Ct',
          type: 'number'
        },
        qc1Endpt: {
          title: 'QC1 EndPt',
          type: 'number'
        },
        qc2Ct: {
          title: 'QC2 Ct',
          type: 'number'
        },
        qc2Endpt: {
          title: 'Qc2Endpt',
          type: 'number'
        }
      }
    }
  })

  const geneXpertResultDataSchemaHcv = JSON.stringify({
    resultText: {
      title: 'Result Text',
      type: 'string',
      i18nKey: 'resultText'
    },
    count: {
      title: 'HCV Count',
      type: 'number',
      list: true
    },
    probes: {
      title: 'Probes',
      type: 'object',
      i18nKey: 'probes',
      properties: {
        gpCt: {
          title: 'GP Ct',
          type: 'number'
        },
        gpEndPt: {
          title: 'GP Endpt',
          type: 'number'
        },
        cicCt: {
          title: 'CIC Ct',
          type: 'number'
        },
        cicEndPt: {
          title: 'CIC EndPt',
          type: 'number'
        },
        sacCt: {
          title: 'SAC Ct',
          type: 'number'
        },
        sacEndPt: {
          title: 'SAC EndPt',
          type: 'number'
        },
        npCt: {
          title: 'NP Ct',
          type: 'number'
        },
        npEndPt: {
          title: 'NP EndPt',
          type: 'number'
        },
        qc1Ct: {
          title: 'QC1 Ct',
          type: 'number'
        },
        qc1Endpt: {
          title: 'QC1 EndPt',
          type: 'number'
        },
        qc2Ct: {
          title: 'QC2 Ct',
          type: 'number'
        },
        qc2Endpt: {
          title: 'Qc2Endpt',
          type: 'number'
        }
      }
    }
  })

  // define patientData object
  const geneXpertPatientDataSchema = JSON.stringify({
    id: {
      title: 'Patient ID',
      type: 'string',
      order: 0
    },
    name: {
      title: 'Name',
      type: 'string',
      order: 1
    },
    street: {
      title: 'Street',
      type: 'string',
      order: 2
    },
    city: {
      title: 'City',
      type: 'string',
      order: 3
    },
    state: {
      title: 'State',
      type: 'string',
      order: 4
    },
    zip: {
      title: 'Zip',
      type: 'string',
      order: 5
    },
    phone: {
      title: 'Phone',
      type: 'string',
      order: 6
    },
    hiv: {
      title: 'HIV Status',
      type: 'string',
      order: 7
    },
    age: {
      title: 'Age (in years)',
      type: 'number',
      order: 8
    },
    gender: {
      title: 'Gender',
      type: 'string',
      order: 9
    }
  })

  const [assayMtbRifId] = yield knex('Assay').insert({
    name: 'GeneXpert MTB/Rif',
    i18nKey: 'assayGeneXpertMtbRif',
    externalId: 'MtbRif',
    assayTypeId: assayTypeMTBRifId,
    deviceTypeId: deviceTypeGeneXpertId,
    resultCategory1Label: 'MTB',
    resultCategory1i18nKey: 'resultCategoryMtb',
    resultCategory2Label: 'Rif',
    resultCategory2i18nKey: 'resultCategoryRif',
    resultDataSchema: geneXpertResultDataSchema,
    patientDataSchema: geneXpertPatientDataSchema
  })

  const [assayHivVlId] = yield knex('Assay').insert({
    name: 'GeneXpert HIV VL',
    i18nKey: 'assayGeneXpertHivVl',
    externalId: 'HivVl',
    assayTypeId: assayTypeHivVlId,
    deviceTypeId: deviceTypeGeneXpertId,
    resultCategory1Label: 'HIV',
    resultCategory1i18nKey: 'resultCategoryHiv',
    resultCategory2Label: null,
    resultCategory2i18nKey: null,
    resultDataSchema: geneXpertResultDataSchemaHiv,
    patientDataSchema: geneXpertPatientDataSchema
  })

  const [assayGeneXpertHcvId] = yield knex('Assay').insert({
    name: 'GeneXpert HCV',
    i18nKey: 'assayGeneXpertHcv',
    externalId: 'GeneXpertHcv',
    assayTypeId: assayTypeHcvId,
    deviceTypeId: deviceTypeGeneXpertId,
    resultCategory1Label: 'HCV',
    resultCategory1i18nKey: 'resultCategoryHcv',
    resultCategory2Label: null,
    resultCategory2i18nKey: null,
    resultDataSchema: geneXpertResultDataSchemaHcv,
    patientDataSchema: geneXpertPatientDataSchema
  })

  const [assayDaktariHcvId] = yield knex('Assay').insert({
    name: 'Daktari HCV',
    i18nKey: 'assayDaktariHcv',
    externalId: 'DaktariHcv',
    assayTypeId: assayTypeHcvId,
    deviceTypeId: deviceTypeDaktariId,
    resultCategory1Label: 'HCV',
    resultCategory1i18nKey: 'resultCategoryHcv',
    resultCategory2Label: null,
    resultCategory2i18nKey: null,
    resultDataSchema: geneXpertResultDataSchemaHcv,
    patientDataSchema: geneXpertPatientDataSchema
  })

  const [assayDaktariHivVlId] = yield knex('Assay').insert({
    name: 'Daktari HIV-VL',
    i18nKey: 'assayDaktariHivVl',
    externalId: 'DaktariHivVl',
    assayTypeId: assayTypeHivVlId,
    deviceTypeId: deviceTypeDaktariId,
    resultCategory1Label: 'HIV',
    resultCategory1i18nKey: 'resultCategoryHiv',
    resultCategory2Label: null,
    resultCategory2i18nKey: null,
    resultDataSchema: geneXpertResultDataSchemaHiv,
    patientDataSchema: geneXpertPatientDataSchema
  })

  const [assayEbolaId] = yield knex('Assay').insert({
    name: 'GeneXpert Ebola',
    i18nKey: 'assayGeneXpertEbola',
    externalId: 'Ebola',
    assayTypeId: assayTypeEbolaId,
    deviceTypeId: deviceTypeGeneXpertId,
    resultCategory1Label: 'GP',
    resultCategory1i18nKey: 'resultCategoryEbolaGp',
    resultCategory2Label: 'NP',
    resultCategory2i18nKey: 'resultCategoryEbolaNp',
    resultDataSchema: geneXpertResultDataSchema,
    patientDataSchema: geneXpertPatientDataSchema
  })

  yield knex('Assay').insert({
    name: 'Afinion HIV VL',
    i18nKey: 'assayAfinionHivVl',
    externalId: 'AfinionHivVl',
    assayTypeId: assayTypeHivVlId,
    deviceTypeId: deviceTypeAfinionId,
    resultDataSchema: JSON.stringify({
      copies: {
        title: 'copies/mL',
        type: 'number',
        list: true
      },
      log: {
        title: 'log',
        type: 'number'
      }
    })
  })

  yield knex('Assay').insert({
    name: 'Afinion Lipid Panel',
    i18nKey: 'assayAfinionLipidPanel',
    externalId: 'LipidPanel',
    assayTypeId: assayTypeLipidPanelId,
    deviceTypeId: deviceTypeAfinionId,
    resultDataSchema: JSON.stringify({
      chol: {
        title: 'Chol (mmol/L)',
        type: 'number',
        unit: 'mmol/L',
        list: true
      },
      trig: {
        title: 'Trig (mmol/L)',
        type: 'number',
        unit: 'mmol/L',
        list: true
      },
      hdl: {
        title: 'HDL (mmol/L)',
        type: 'number',
        unit: 'mmol/L'
      }
    })
  })

  yield knex('Assay').insert({
    name: 'Q HIV VL',
    i18nKey: 'assayQHivVl',
    externalId: 'HivVl',
    assayTypeId: assayTypeHivVlId,
    deviceTypeId: deviceTypeQId,
    resultCategory1Label: 'HIV',
    resultCategory1i18nKey: 'resultCategoryHivVl'
  })

  yield knex('Assay').insert({
    name: 'Abbot m2000 HIV VL',
    i18nKey: 'AssayAbbotM2000HivVl',
    externalId: 'HivVl',
    assayTypeId: assayTypeHivVlId,
    deviceTypeId: deviceTypeM2000Id,
    resultCategory1Label: 'HIV',
    resultCategory1i18nKey: 'resultCategoryHivVl',
    resultDataSchema: JSON.stringify({
      copies: {
        list: true,
        title: 'VL Count',
        type: 'number'
      }
    }),
    patientDataSchema: JSON.stringify({
      provider: {
        title: 'Provider ID',
        type: 'string'
      },
      name: {
        title: 'Client Name',
        type: 'string',
        order: 1
      },
      surname: {
        title: 'Client Surname',
        type: 'string',
        order: 2
      },
      addressPhone: {
        title: 'Address/Phone',
        type: 'string',
        order: 3
      },
      artNumber: {
        title: 'ART #',
        type: 'string',
        order: 4
      },
      gender: {
        title: 'Gender',
        type: 'string',
        order: 5
      }
    })
  })

  yield knex('Assay').insert({
    name: 'Abbot m2000 EID',
    i18nKey: 'AssayAbbotM2000Eid',
    externalId: 'EID',
    assayTypeId: assayTypeEid,
    deviceTypeId: deviceTypeM2000Id,
    resultCategory1Label: 'EID',
    resultCategory1i18nKey: 'resultCategoryEid',
    resultDataSchema: JSON.stringify({
      resultText: {
        list: true,
        title: 'Result',
        type: 'string'
      }
    }),
    patientDataSchema: JSON.stringify({
      provider: {
        title: 'Provider ID',
        type: 'string',
        order: 0
      },
      name: {
        title: 'Client Name',
        type: 'string',
        order: 1
      },
      surname: {
        title: 'Client Surname',
        type: 'string',
        order: 2
      },
      addressPhone: {
        title: 'Address/Phone',
        type: 'string',
        order: 3
      },
      nameMother: {
        title: 'Mother\'s Name',
        type: 'string',
        order: 4
      },
      hccNumber: {
        list: true,
        title: 'HCC #',
        type: 'string',
        order: 5
      },
      gender: {
        title: 'Gender',
        type: 'string',
        order: 6
      }
    })
  })

  // Result types
  const [resultTypePatientId] = yield knex('ResultType').insert({
    name: 'Patient',
    i18nKey: 'resultTypePatient',
    externalId: 'Patient'
  })

  yield knex('ResultType').insert({
    name: 'EQA',
    i18nKey: 'resultTypeEqa',
    externalId: 'EQA'
  })

  yield knex('ResultType').insert({
    name: 'Training',
    i18nKey: 'resultTypeTraining',
    externalId: 'Training'
  })

  yield knex('ResultType').insert({
    name: 'Calibration',
    i18nKey: 'resultTypeCalibration',
    externalId: 'Calibration'
  })

  yield knex('ResultType').insert({
    name: 'Study/Research',
    i18nKey: 'resultTypeStudy',
    externalId: 'Study'
  })

  // result categories
  const [resultCategoryDetectedId] = yield knex('ResultCategory').insert({
    name: 'Detected',
    i18nKey: 'ResultCategoryDetected',
    externalId: 'Detected'
  })

  const [resultCategoryNotDetectedId] = yield knex('ResultCategory').insert({
    name: 'Not Detected',
    i18nKey: 'resultCategoryNotDetected',
    externalId: 'NotDetected'
  })

  const [resultCategoryIndeterminateId] = yield knex('ResultCategory').insert({
    name: 'Indeterminate',
    i18nKey: 'resultCategoryIndeterminate',
    externalId: 'Indeterminate'
  })

  const [resultCategoryInvalidId] = yield knex('ResultCategory').insert({
    name: 'Invalid',
    i18nKey: 'resultCategoryInvalid',
    externalId: 'Invalid'
  })

  const [resultCategoryNoResultId] = yield knex('ResultCategory').insert({
    name: 'No Result',
    i18nKey: 'resultCategoryNoResult',
    externalId: 'NoResult'
  })

  const [resultCategoryErrorId] = yield knex('ResultCategory').insert({
    name: 'Error',
    i18nKey: 'resultCategoryError',
    externalId: 'Error'
  })

  yield knex('ResultCategory').insert({
    name: 'Success',
    i18nKey: 'resultCategorySuccess',
    externalId: 'Success'
  })

  // assign categories to Assays
  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayMtbRifId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNotDetectedId,
    assayId: assayMtbRifId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryIndeterminateId,
    assayId: assayMtbRifId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryInvalidId,
    assayId: assayMtbRifId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNoResultId,
    assayId: assayMtbRifId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayMtbRifId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayEbolaId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNotDetectedId,
    assayId: assayEbolaId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryInvalidId,
    assayId: assayEbolaId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNoResultId,
    assayId: assayEbolaId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayEbolaId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayHivVlId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryInvalidId,
    assayId: assayHivVlId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNoResultId,
    assayId: assayHivVlId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayHivVlId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayDaktariHivVlId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryInvalidId,
    assayId: assayDaktariHivVlId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNoResultId,
    assayId: assayDaktariHivVlId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayDaktariHivVlId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayDaktariHcvId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryInvalidId,
    assayId: assayDaktariHcvId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNoResultId,
    assayId: assayDaktariHcvId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayDaktariHcvId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayGeneXpertHcvId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryInvalidId,
    assayId: assayGeneXpertHcvId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNoResultId,
    assayId: assayGeneXpertHcvId
  })

  yield knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayGeneXpertHcvId
  })


  // Units
  const [piece] = yield knex('Unit').insert({
    name: 'Piece',
    shortname: 'pc'
  })

  yield knex('Unit').insert({
    name: 'Liter',
    shortname: 'l'
  })

  yield knex('Unit').insert({
    name: 'Milliliter',
    shortname: 'ml'
  })

  const [milligram] = yield knex('Unit').insert({
    name: 'Milligram',
    shortname: 'mg'
  })

  yield knex('Unit').insert({
    name: 'Gram',
    shortname: 'g'
  })

  yield knex('Unit').insert({
    name: 'Kilogram',
    shortname: 'kg'
  })

  yield knex('Unit').insert({
    name: 'Ounce',
    shortname: 'oz'
  })

  // Consumable types
  // TODO: We need to discuss how shared consumables are handled
  const [consumableGlovesId] = yield knex('Consumable').insert({
    name: 'Gloves',
    unit: piece,
    canExpire: 0,
    manufacturer: 'ABC Company',
    autoInclude: 1
  })

  const [consumableGxTbCartridgeId] = yield knex('Consumable').insert({
    name: 'GeneXpert TB Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Cepheid',
    autoInclude: 0
  })

  const [consumableGxEbolaCartridgeId] = yield knex('Consumable').insert({
    name: 'GeneXpert Ebola Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Cepheid',
    autoInclude: 0
  })

  const [consumableGxHivVlCartridgeId] = yield knex('Consumable').insert({
    name: 'GeneXpert HIV Viral Load Cartridge',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Cepheid',
    autoInclude: 0
  })

  const [partnerOneReagent] = yield knex('Consumable').insert({
    name: 'Partner One Reagent',
    partnerId: partnerOneId,
    unit: milligram,
    canExpire: 1,
    manufacturer: 'Unichem',
    autoInclude: 0
  })

  const [partnerOneSwab] = yield knex('Consumable').insert({
    name: 'Partner One Swab',
    partnerId: partnerOneId,
    unit: piece,
    canExpire: 1,
    manufacturer: 'Johnson & Johnson',
    autoInclude: 0
  })

  const [partnerTwoSwab] = yield knex('Consumable').insert({
    name: 'Partner Two Swab',
    partnerId: partnerTwoId,
    unit: piece,
    canExpire: 1,
    manufacturer: 'Procter & Gamble',
    autoInclude: 0
  })

  // Assay Consumables
  yield knex('ConsumableAssay').insert({
    consumableId: consumableGxTbCartridgeId,
    assayId: assayMtbRifId,
    quantity: 1
  })

  yield knex('ConsumableAssay').insert({
    consumableId: consumableGxEbolaCartridgeId,
    assayId: assayEbolaId,
    quantity: 1
  })

  yield knex('ConsumableAssay').insert({
    consumableId: partnerOneReagent,
    assayId: assayMtbRifId,
    quantity: 500
  })

  yield knex('ConsumableAssay').insert({
    consumableId: partnerOneSwab,
    assayId: assayMtbRifId,
    quantity: 1
  })

  yield knex('ConsumableAssay').insert({
    consumableId: partnerTwoSwab,
    assayId: assayMtbRifId,
    quantity: 2
  })
  // Consumable Reasons

  yield knex('ConsumableReason').insert({
    name: 'Test Conducted',
    i18nKey: 'ConsumableReason_TestConducted',
    decrease: 1
  })

  yield knex('ConsumableReason').insert({
    name: 'Expired',
    i18nKey: 'ConsumableReason_Expired',
    decrease: 1
  })

  yield knex('ConsumableReason').insert({
    name: 'Stolen',
    i18nKey: 'ConsumableReason_Stolen',
    decrease: 1
  })

  yield knex('ConsumableReason').insert({
    name: 'Lost',
    i18nKey: 'ConsumableReason_Lost',
    decrease: 1
  })

  // Result Workflow Status
  yield knex('ResultWorkflowStatus').insert({
    name: 'OK',
    i18nkey: 'ResultWorkflowStatusOK',
    token: 'ok',
    externalId: 'OK'
  })
  yield knex('ResultWorkflowStatus').insert({
    name: 'Error',
    i18nkey: 'ResultWorkflowStatusError',
    token: 'error',
    externalId: 'Error'
  })
  const [ordered] = yield knex('ResultWorkflowStatus').insert({
    name: 'Ordered',
    i18nkey: 'ResultWorkflowStatusOrdered',
    token: 'ordered',
    externalId: 'Ordered'
  })
  yield knex('ResultWorkflowStatus').insert({
    name: 'In Progress',
    i18nkey: 'ResultWorkflowStatusInProgress',
    token: 'in-progress',
    externalId: 'InProgress'
  })
  const [processed] = yield knex('ResultWorkflowStatus').insert({
    name: 'Processed',
    i18nkey: 'ResultWorkflowStatusProcessed',
    token: 'processed',
    externalId: 'Processed'
  })
  const [validated] = yield knex('ResultWorkflowStatus').insert({
    name: 'Validated',
    i18nkey: 'ResultWorkflowStatusValidated',
    token: 'validated',
    externalId: 'Validated'
  })
  yield knex('ResultWorkflowStatus').insert({
    name: 'Delivered',
    i18nkey: 'ResultWorkflowStatusDelivered',
    token: 'delivered',
    externalId: 'Delivered'
  })
  const [acknowledged] = yield knex('ResultWorkflowStatus').insert({
    name: 'Acknowledged',
    i18nkey: 'ResultWorkflowStatusAcknowledged',
    token: 'acknowledged',
    externalId: 'Acknowledged'
  })

  yield knex('ResultWorkflowStatus').insert({
    name: 'Flagged',
    i18nkey: 'ResultWorkflowStatusFlagged',
    token: 'flagged',
    externalId: 'Flagged'
  })

  // Create permissions
  const modules = {}
  for (const module of permissions.modules) {
    const moduleData = {}
    modules[module.name] = moduleData
    for (const activity of module.activities) {
      const [permissionId] = yield knex('Permission').insert({
        module: module.name,
        activity
      })
      moduleData[activity] = permissionId
    }
  }

  // Create geographic hierarchy
  const countries = {}
  const geographies = []
  const siteDatas = []
  for (const country of geography.countries) {
    const countryData = _.pick(country, [
      'abbreviation', 'name', 'a3', 'culture', 'countryCode',
      'stateLabel', 'lgaLabel', 'timezone', 'portNumber',
      'exportColumns', 'inventoryDaysThreshold', 'monthStartsOnDay'])
    const [countryId] = yield knex('Country').insert(countryData)
    countryData.id = countryId
    countries[country.abbreviation] = countryData
    countryData.states = {}

    yield knex('Geography').insert({ countryId })

    for (const state of (country.states || [])) {
      const stateData = _.pick(state, ['abbreviation', 'name'])
      const [stateId] = yield knex('State').insert(stateData)
      stateData.id = stateId
      const stateKey = state.abbreviation || state.name
      countryData.states[stateKey] = stateData
      stateData.lgas = {}

      // assign org units based on state region
      const orgUnitId = _.includes(['OH', 'NE'], state.abbreviation) ? regionMidwestId
        : _.includes(['MA', 'NY'], state.abbreviation) ? regionNortheastId
        : partnerOneOrgUnitId

      yield knex('Geography').insert({ countryId, stateId })

      for (const lga of (state.lgas || [])) {
        const lgaData = _.pick(lga, ['name'])

        const [lgaId] = yield knex('Lga').insert(lgaData)
        lgaData.id = lgaId
        stateData.lgas[lga.name] = lgaData
        lgaData.sites = {}

        const geoData = { countryId, stateId, lgaId }
        const [geographyId] = yield knex('Geography').insert(geoData)
        geographies.push(Object.assign({ id: geographyId }, geoData))

        // up to 5 of sites at each LGA
        for (const siteNumber of _.range(1, 6 - (lgaData.id % 5))) {
          const siteData = Object.assign({
            partnerId: partnerOneId,
            orgUnitId,
            geographyId,
            externalId: `${state.name}_${siteNumber}`,
            name: `${lga.name} ${country.lgaLabel} ${state.name} #${siteNumber}`,
            shortname: `${lga.name}, ${stateKey} #${siteNumber}`,
            city: `${lga.name} City`,
            street1: `${lgaData.id} Main Street`,
            zip: `12345-${lgaData.id}`
          }, auditFields)
          const [siteId] = yield knex('Site').insert(siteData)
          siteData.id = siteId
          siteDatas.push(siteData)
        }
      }
    }
  }

  // Users
  const userIds = {}
  for (const name of ['Admin', 'Bill', 'Bob', 'Frank', 'Ed', 'Fred',
    'Jason', 'Jim', 'Jon', 'Ned', 'Sam', 'Steve']) {
    let userId
    if (name === 'Admin') {
      userId = adminId
    } else {
      [userId] = yield knex('User').insert({
        name: name.toLowerCase(),
        // User "Bill" was migrated from a GxAlert database.
        // Set pw to something that doesn't look like a bcrypt hash
        // so that Gx API is used to verify pw and set on aspect
        password: name === 'Bill' ? 'SOMESTRING' : bcrypt.hashSync('test07', saltRounds),
        legacyPassword: name === 'Bill' ? 1 : 0,
        approved: 1,
        createdOn: now,
        lockedOut: 0,
        failedPasswordAttempts: 0
      })
    }
    userIds[name.toLowerCase()] = userId

    const lastPartnerId = _.includes(['Jim', 'Jason'], name) ? partnerTwoId : partnerOneId
    const lastCountryId = _.includes(['Jim', 'Sam'], name) ? countries.NG.id : countries.US.id
    const timezone = _.includes(['Jim', 'Sam'], name) ? countries.NG.timezone : countries.US.timezone
    const culture = _.includes(['Jim', 'Sam'], name) ? countries.NG.culture : countries.US.culture

    yield knex('Person').insert(Object.assign({
      userId,
      name,
      lastPartnerId,
      lastCountryId,
      timezone,
      culture,
      geographyId: geographies[geographies.length % userId].id
    }, auditFields))
  }

  // insert some routers with sims:
  const routerIds = []
  for (let i = 0; i < routerNumber; i++) {
    const siteData = siteDatas[i % siteDatas.length]
    const [routerId] = yield knex('Device').insert(Object.assign({}, auditFields, {
      name: `Router at ${i} ${siteData.shortname}`,
      shortname: `r${i}`,
      deviceTypeId: deviceTypeIdRouter,
      deviceStatusId: deviceStatusApproved,
      partnerId: siteData.partnerId,
      orgUnitId: siteData.orgUnitId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      createdOn: new Date(+now - (3 * i * millisInHour)),
      updatedOn: new Date(+now - (i * millisInHour)),
      lastPingOn: new Date(+now - ((i * millisInHour) / 3)),
      lastSeenOn: new Date(+now - ((i * millisInHour) / 3))
    }))

    routerIds.push(routerId)
  }

  // ... and 1-3 sims for some routers
  const sims = _.range(0, routerNumber, 2).map((i) => {
    const routerId = routerIds[i]
    return Object.assign({}, auditFields, {
      deviceId: routerId,
      provider: i % 3 === 0 ? 'Glo' : 'Vodafone',
      serial: `SRL-${routerId}`,
      number: `+1 413 123 45${routerId}`
    })
  })
  yield knex('DeviceSim').insert(sims)

  // insert GeneXpert devices
  const devicesGeneXpert = []
  for (let i = 0; i < deviceNumber; i++) {
    const siteData = siteDatas[i % siteDatas.length]
    const routerId = routerIds[i]
    const device = Object.assign({}, auditFields, {
      name: `GeneXpert #${i} ${siteData.shortname}`,
      shortname: `GeneXpert #${i}`,
      deviceTypeId: deviceTypeGeneXpertId,
      deviceStatusId: _.random(1) > 0 ? deviceStatusApproved : deviceStatusAssigned,
      configurationData: JSON.stringify({
        requirePrinter: 'no',
        adminPassword: 'pwd123',
        firmwareUpdateRequired: 'yes',
        modules: {
          module1: '18889030',
          module2: '51395910',
          module3: '33550994',
          module4: '73235848'
        }
      }),
      partnerId: siteData.partnerId,
      orgUnitId: siteData.orgUnitId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      // not all sites will have a router - we only added routers to some site
      deviceId: routerId || null,
      createdOn: new Date(+now - (3 * i * millisInHour)),
      updatedOn: new Date(+now - (i * millisInHour)),
      lastPingOn: new Date(+now - ((i * millisInHour) / 3)),
      lastSeenOn: new Date(+now - ((i * millisInHour) / 3)),
      approvedOn: new Date(+now - (2 * i * millisInHour)),
      approvedBy: _.values(userIds)[_.random(_.size(userIds) - 1)],
      hostId: _.times(8, () => String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))).join(''),
      serial: _.times(24, () => String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))).join('')
    })

    device.id = yield knex('Device').insert(device)
    devicesGeneXpert.push(device)

    // Create API Keys
    yield knex('DeviceApiKey').insert(Object.assign({
      token: randomToken(),
      revoked: 0,
      partnerId: siteData.partnerId,
      orgUnitId: siteData.orgUnitId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      deviceId: device.id
    }, auditFields))

    // Create DeviceOperation
    const operationNumber = _.random(3, 11)
    for (let j = 0; j < operationNumber; j++) {
      yield knex('DeviceOperation')
        .insert({
          deviceId: device.id,
          data: JSON.stringify({
            voltage: _.random(1.35, 1.65, true),
            temperature: _.random(30, 70)
          }),
          startedOn: new Date(+now + (_.random(j, j + 1, true) * millisInHour)),
          createdOn: now
        })
    }
  }

  // insert Daktari devices
  const devicesDaktari = []
  for (let i = 0; i < deviceNumber; i++) {
    const siteData = siteDatas[i % siteDatas.length]
    const routerId = routerIds[i]
    const device = Object.assign({}, auditFields, {
      name: `Daktari #${i} ${siteData.shortname}`,
      shortname: `Daktari #${i}`,
      deviceTypeId: deviceTypeDaktariId,
      deviceStatusId: deviceStatusApproved,
      configurationData: JSON.stringify({
        requirePrinter: 'yes',
        adminPassword: 'pwd123',
        firmwareUpdateRequired: 'no'
      }),
      partnerId: siteData.partnerId,
      orgUnitId: siteData.orgUnitId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      // not all sites will have a router - we only added routers to some site
      deviceId: routerId || null,
      createdOn: new Date(+now - (3 * i * millisInHour)),
      updatedOn: new Date(+now - (i * millisInHour)),
      lastPingOn: new Date(+now - ((i * millisInHour) / 3)),
      lastSeenOn: new Date(+now - ((i * millisInHour) / 3)),
      approvedOn: new Date(+now - (2 * i * millisInHour)),
      approvedBy: _.values(userIds)[_.random(_.size(userIds) - 1)],
      hostId: _.times(8, () => String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))).join(''),
      serial: _.times(24, () => String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))).join('')
    })

    device.id = yield knex('Device').insert(device)
    devicesDaktari.push(device)

    // Create API Keys
    yield knex('DeviceApiKey').insert(Object.assign({
      token: randomToken(),
      revoked: 0,
      partnerId: siteData.partnerId,
      orgUnitId: siteData.orgUnitId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      deviceId: device.id
    }, auditFields))

    // Create DeviceOperation
    const operationNumber = _.random(3, 11)
    for (let j = 0; j < operationNumber; j++) {
      yield knex('DeviceOperation')
        .insert({
          deviceId: device.id,
          data: JSON.stringify({
            voltage: _.random(1.35, 1.65, true),
            temperature: _.random(30, 70)
          }),
          startedOn: new Date(+now + (_.random(j, j + 1, true) * millisInHour)),
          createdOn: now
        })
    }
  }

  // Insert Inventory Items
  for (let i = 0; i < siteDatas.length; i++) {
    const siteData = siteDatas[i]
    // TB Cartridges
    yield knex('InventoryItem').insert(Object.assign({
      consumableId: consumableGxTbCartridgeId,
      siteId: siteData.id,
      lotNumber: `${((i + 3) * (i + 1))}${['A', 'B'][i % 2]}-${((siteData.id + i) * consumableGxTbCartridgeId)}`,
      expiresOn: new Date((new Date(now.getTime() +
        _.random(-millisInNormalYear, millisInNormalYear))).setHours(0, 0, 0, 0)),
      quantityOnHand: _.random(0, 1000)
    }, auditFields))
    if (i % 5 === 0) {
      yield knex('InventoryItem').insert(Object.assign({
        consumableId: consumableGxEbolaCartridgeId,
        siteId: siteData.id,
        lotNumber: `${((i + 7) * (i + 1))}${['Q', 'P'][i % 2]}-${((siteData.id + i) * consumableGxEbolaCartridgeId)}`,
        expiresOn: new Date((new Date(now.getTime() +
          _.random(-millisInNormalYear, millisInNormalYear))).setHours(0, 0, 0, 0)),
        quantityOnHand: _.random(0, 1000)
      }, auditFields))
    }
    if (i % 7 === 0) {
      yield knex('InventoryItem').insert(Object.assign({
        consumableId: consumableGxHivVlCartridgeId,
        siteId: siteData.id,
        lotNumber: `${((i + 11) * (i + 1))}${['A', 'V'][i % 2]}-${((siteData.id + i) * consumableGxHivVlCartridgeId)}`,
        expiresOn: new Date((new Date(now.getTime() +
          _.random(-millisInNormalYear, millisInNormalYear))).setHours(0, 0, 0, 0)),
        quantityOnHand: _.random(0, 1000)
      }, auditFields))
    }
    // Gloves
    yield knex('InventoryItem').insert(Object.assign({
      consumableId: consumableGlovesId,
      siteId: siteData.id,
      quantityOnHand: _.random(0, 100)
    }, auditFields))
  }

  const [sampleTypeDBSId] = yield knex('SampleType')
    .insert({
      name: 'DBS',
      i18nKey: 'sampleTypeDBS',
      externalId: 'DBS'
    })

  const [sampleTypePlasmaId] = yield knex('SampleType')
    .insert({
      name: 'Plasma',
      i18nKey: 'sampleTypePlasma',
      externalId: 'Plasma'
    })

  yield knex('SampleType')
    .insert({
      name: 'Other',
      i18nKey: 'sampleTypeOther',
      externalId: 'Other'
    })

  // some TB samples:
  let samples = []
  for (let i = 0; i < resultMtbNumber / 2; i++) {
    const siteData = siteDatas[i % siteDatas.length]
    const sample = Object.assign({}, {
      externalId: `SMP-TB-${i}`,
      collectedOn: new Date(+now - (120 * millisInHour)),
      sampleTypeId: sampleTypeDBSId,
      originSiteId: siteData.id
    })

    sample.id = yield knex('Sample').insert(sample)

    samples.push(sample)
  }

  // Results section

  // TB results:
  let possibleResults = [{ resultText: 'Not Detected', category1: resultCategoryNotDetectedId, category2: null },
                          { resultText: 'MTB Detected, Rif Resistance Not Detected', category1: resultCategoryDetectedId, category2: resultCategoryNotDetectedId },
                          { resultText: 'MTB Detected, Rif Indeterminate', category1: resultCategoryDetectedId, category2: resultCategoryIndeterminateId },
                          { resultText: 'ERROR', category1: resultCategoryErrorId, category2: null },
                          { resultText: 'Invalid', category1: resultCategoryInvalidId, category2: null }]

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
      qc2Endpt: 1.22
    }
  }

  for (const i of _.range(1, resultMtbNumber + 1)) {
    const device = devicesGeneXpert[i % devicesGeneXpert.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const result = possibleResults[i % 5]
    const randomTimespan = _.random(6000) * millisInMinute
    resultData.resultText = result.resultText

    const resultId = yield knex('Result').insert(Object.assign({}, auditFields, {
      externalId: `UQTB-${i}`,
      assayId: assayMtbRifId,
      partnerId: partnerOneId,
      orgUnitId: partnerOneOrgUnitId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      deviceId: device.id,
      resultWorkflowStatusId: ordered,
      longitude: -81.581222,
      latitude: 28.419348,
      resultTypeId: resultTypePatientId,
      sampleId: sample.id,
      sampleRunNumber: `${(i % 2) + 1}`,
      resultCategory1: result.category1,
      resultCategory2: result.category2,
      resultData: JSON.stringify(resultData),
      assayVersion: '4',
      startedOn: new Date(+now - randomTimespan - (12 * millisInHour)),
      endedOn: new Date(+now - randomTimespan - (10 * millisInHour)),
      consumableSerial: `${i}12`,
      consumableExpirationDate: new Date(+now + (200 * i * millisInHour)),
      consumableLot: `Lot ${i % 5}`,
      instrumentSerial: `S-1234-${i % 3}`,
      moduleName: 'Module A',
      moduleSerial: `M-1234-${i % 4}`,
      researchId: `R-ID-${i}`,
      patientData: JSON.stringify(patients[_.random(99)]),
      senderVersion: '4.6b',
      senderOperator: 'Marsha',
      notes: 'This is a test... result',
      errorCode: result.category1 === resultCategoryErrorId ? '1024' : null,
      errorNotes: result.category1 === resultCategoryErrorId ? 'Exceeded cycle threshold' : null
    }))

    yield knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: ordered,
      operator: 'Marsha',
      changedOn: new Date(+now - randomTimespan - (25 * millisInHour)),
      createdOn: new Date(+now - randomTimespan - (26 * millisInHour)),
      createdBy: adminId
    })

    yield knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: acknowledged,
      operator: 'John',
      changedOn: new Date(+now - randomTimespan - (2 * millisInHour)),
      createdOn: new Date(+now - randomTimespan - (1 * millisInHour)),
      createdBy: adminId
    })
  }


  // some Ebola samples:
  samples = []
  for (let i = 0; i < resultEbolaNumber / 2; i++) {
    const siteData = siteDatas[i % siteDatas.length]
    const sample = Object.assign({}, {
      externalId: `SMP-EB-${i}`,
      collectedOn: new Date(+now - (120 * millisInHour)),
      sampleTypeId: sampleTypePlasmaId,
      originSiteId: siteData.id
    })

    sample.id = yield knex('Sample').insert(sample)

    samples.push(sample)
  }

  // Ebola results:
  possibleResults = [{ resultText: 'Ebola GP NON DÉTECTÉ|Ebola NP NON DÉTECTÉ', category1: resultCategoryNotDetectedId, category2: resultCategoryNotDetectedId },
                          { resultText: 'Ebola GP DÉTECTÉ|Ebola NP NON DÉTECTÉ', category1: resultCategoryDetectedId, category2: resultCategoryNotDetectedId },
                          { resultText: 'Ebola GP Not Detected|Ebola NP Detected', category1: resultCategoryNotDetectedId, category2: resultCategoryDetectedId },
                          { resultText: 'No Result', category1: resultCategoryNoResultId, category2: null },
                          { resultText: 'ERROR', category1: resultCategoryErrorId, category2: null },
                          { resultText: 'Invalid', category1: resultCategoryInvalidId, category2: null }]

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
      qc2Endpt: 1.22
    }
  }

  for (const i of _.range(1, resultEbolaNumber + 1)) {
    const device = devicesGeneXpert[i % devicesGeneXpert.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const result = possibleResults[i % 5]
    const randomTimespan = _.random(6000) * millisInMinute
    resultData.resultText = result.resultText

    const resultId = yield knex('Result').insert(Object.assign({}, auditFields, {
      externalId: `UQEB-${i}`,
      assayId: assayEbolaId,
      partnerId: partnerOneId,
      orgUnitId: partnerOneOrgUnitId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      deviceId: device.id,
      resultWorkflowStatusId: processed,
      longitude: -81.581222,
      latitude: 28.419348,
      resultTypeId: resultTypePatientId,
      sampleId: sample.id,
      sampleRunNumber: `${(i % 2) + 1}`,
      resultCategory1: result.category1,
      resultCategory2: result.category2,
      resultData: JSON.stringify(resultData),
      assayVersion: '4',
      startedOn: new Date(+now - randomTimespan - (12 * millisInHour)),
      endedOn: new Date(+now - randomTimespan - (10 * millisInHour)),
      consumableSerial: `${i}12`,
      consumableExpirationDate: new Date(+now + (200 * i * millisInHour)),
      consumableLot: `Lot ${i % 5}`,
      instrumentSerial: `S-1234-${i % 3}`,
      moduleName: 'Module A',
      moduleSerial: `M-1234-${i % 4}`,
      researchId: `R-ID-${i}`,
      patientData: JSON.stringify(patients[_.random(99)]),
      senderVersion: '4.7a',
      senderOperator: 'Marsha',
      notes: 'This is an Ebola test result',
      errorCode: result.category1 === resultCategoryErrorId ? '1024' : null,
      errorNotes: result.category1 === resultCategoryErrorId ? 'Exceeded cycle threshold' : null
    }))

    yield knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: ordered,
      operator: 'Bill',
      changedOn: new Date(+now - randomTimespan - (34 * millisInHour)),
      createdOn: new Date(+now - randomTimespan - (35 * millisInHour)),
      createdBy: adminId
    })

    yield knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: processed,
      operator: 'Marsha',
      changedOn: new Date(+now - randomTimespan - (13 * millisInHour)),
      createdOn: new Date(+now - randomTimespan - (12 * millisInHour)),
      createdBy: adminId
    })

    yield knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: acknowledged,
      operator: 'John',
      changedOn: new Date(+now + (41 * millisInHour)),
      createdOn: new Date(+now + (42 * millisInHour)),
      createdBy: adminId
    })
  }

  // some HIV VL samples:
  samples = []
  for (let i = 0; i < resultHivVlNumber / 2; i++) {
    const siteData = siteDatas[i % siteDatas.length]
    const sample = Object.assign({}, {
      externalId: `SMP-HIV-${i}`,
      collectedOn: new Date(+now - (120 * millisInHour)),
      sampleTypeId: sampleTypeDBSId,
      originSiteId: siteData.id
    })

    sample.id = yield knex('Sample').insert(sample)

    samples.push(sample)
  }

  // HIV VL Results:
  possibleResults = [{ resultText: 'HIV-1 DÉTECTÉ {0} copies/mL (log {1})', category1: resultCategoryDetectedId },
                          { resultText: 'HIV-1 NON DÉTECTÉ', category1: resultCategoryNotDetectedId },
                          { resultText: 'No Result', category1: resultCategoryNoResultId },
                          { resultText: 'ERROR', category1: resultCategoryErrorId },
                          { resultText: 'Invalid', category1: resultCategoryInvalidId }]

  resultData = {
    probes: {
      gpCt: 25.40,
      gpEndPt: 558.00,
      cicCt: 23.90,
      cicEndPt: 289.00,
      sacCt: 33.80,
      sacEndPt: 650.00,
      npCt: 12.2,
      npEndPt: null,
      qc1Ct: 0.32,
      qc1Endpt: 0,
      qc2Ct: 11.4,
      qc2Endpt: 0.5
    }
  }

  for (const i of _.range(1, resultHivVlNumber + 1)) {
    const device = devicesGeneXpert[i % devicesGeneXpert.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const result = possibleResults[i % 5]
    const randomTimespan = _.random(6000) * millisInMinute
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
    resultData.resultText = result.resultText.replace('{0}', copies).replace('{1}', log)

    const resultStatus = _.random(1) < 0.5 ? acknowledged : validated

    const resultId = yield knex('Result').insert(Object.assign({}, auditFields, {
      externalId: `UQHIV-${i}`,
      assayId: assayHivVlId,
      partnerId: partnerOneId,
      orgUnitId: partnerOneOrgUnitId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      deviceId: device.id,
      resultWorkflowStatusId: resultStatus,
      longitude: -81.581222,
      latitude: 28.419348,
      resultTypeId: resultTypePatientId,
      sampleId: sample.id,
      sampleRunNumber: `${(i % 2) + 1}`,
      resultCategory1: result.category1,
      resultData: JSON.stringify(resultData),
      assayVersion: '4',
      startedOn: new Date(+now - randomTimespan - (12 * millisInHour)),
      endedOn: new Date(+now - randomTimespan - (10 * millisInHour)),
      consumableSerial: `${i}12`,
      consumableExpirationDate: new Date(+now + (200 * i * millisInHour)),
      consumableLot: `Lot ${i % 5}`,
      instrumentSerial: `S-1234-${i % 3}`,
      moduleName: 'Module A',
      moduleSerial: `M-1234-${i % 4}`,
      researchId: `R-ID-${i}`,
      patientData: JSON.stringify(patients[_.random(99)]),
      senderVersion: '4.4',
      senderOperator: 'Marsha',
      notes: 'This is an HIV test result',
      errorCode: result.category1 === resultCategoryErrorId ? '1024' : null,
      errorNotes: result.category1 === resultCategoryErrorId ? 'Exceeded cycle threshold' : null
    }))

    yield knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: resultStatus,
      operator: 'Marsha',
      changedOn: new Date(+now - randomTimespan - (3 * millisInHour)),
      createdOn: new Date(+now - randomTimespan - (2 * millisInHour)),
      createdBy: adminId
    })
  }

  // some HCV samples for GeneXpert
  samples = []
  for (let i = 0; i < resultHcvNumber / 2; i++) {
    const sample = Object.assign({}, {
      externalId: `SMP-HCV-GX-${i}`,
      collectedOn: new Date(),
      sampleTypeId: sampleTypeDBSId
    })

    sample.id = yield knex('Sample').insert(sample)

    samples.push(sample)
  }

  // Daktari HCV Results:
  possibleResults = [{ resultText: 'HCV Detected - {0}', category1: resultCategoryDetectedId },
                          { resultText: 'HCV Not Detected', category1: resultCategoryNotDetectedId },
                          { resultText: 'No Result', category1: resultCategoryNoResultId },
                          { resultText: 'Error', category1: resultCategoryErrorId },
                          { resultText: 'Invalid', category1: resultCategoryInvalidId }]

  resultData = {
    probes: {
      gpCt: 25.40,
      gpEndPt: 558.00,
      cicCt: 23.90,
      cicEndPt: 289.00,
      sacCt: 33.80,
      sacEndPt: 650.00,
      npCt: 12.2,
      npEndPt: null,
      qc1Ct: 0.32,
      qc1Endpt: 0,
      qc2Ct: 11.4,
      qc2Endpt: 0.5
    }
  }

  for (const i of _.range(1, resultHcvNumber + 1)) {
    const device = devicesDaktari[i % devicesDaktari.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const result = possibleResults[i % 5]
    let count = 3200
    if (result === possibleResults[0]) {
      count = Math.floor(Math.random() * 100000000)
    } else {
      count = null
    }

    resultData.count = count
    resultData.resultText = result.resultText.replace('{0}', count)

    const resultId = yield knex('Result').insert(Object.assign({}, auditFields, {
      externalId: `UQ-GX-HCV-${i}`,
      assayId: assayGeneXpertHcvId,
      partnerId: partnerOneId,
      orgUnitId: partnerOneOrgUnitId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      deviceId: device.id,
      resultWorkflowStatusId: processed,
      longitude: -81.581222,
      latitude: 28.419348,
      resultTypeId: resultTypePatientId,
      sampleId: sample.id,
      sampleRunNumber: `${(i % 2) + 1}`,
      resultCategory1: result.category1,
      resultData: JSON.stringify(resultData),
      assayVersion: '4.7',
      startedOn: new Date(+now - (12 * i * millisInHour)),
      endedOn: new Date(+now - (10 * i * millisInHour)),
      consumableSerial: `${i}12`,
      consumableExpirationDate: new Date(+now + (200 * i * millisInHour)),
      consumableLot: `Lot ${i % 5}`,
      instrumentSerial: `S-1234-${i % 3}`,
      moduleName: 'Module A',
      moduleSerial: `M-1234-${i % 4}`,
      researchId: `R-ID-${i}`,
      patientData: JSON.stringify(patients[_.random(99)]),
      senderVersion: '4.7b',
      senderOperator: 'Gene Hackman',
      notes: 'This is an HCV test result',
      errorCode: result.category1 === resultCategoryErrorId ? '1024' : null,
      errorNotes: result.category1 === resultCategoryErrorId ? 'Exceeded cycle threshold' : null
    }))

    yield knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: processed,
      operator: 'Gene Hackman',
      changedOn: now,
      createdOn: now,
      createdBy: adminId
    })
  }

  // some HIV VL samples for Daktari
  samples = []
  for (let i = 0; i < resultHivVlNumber / 2; i++) {
    const siteData = siteDatas[i % siteDatas.length]
    const sample = Object.assign({}, {
      externalId: `SMP-HIV-DAK-${i}`,
      collectedOn: new Date(+now - (120 * millisInHour)),
      sampleTypeId: sampleTypeDBSId,
      originSiteId: siteData.id
    })

    sample.id = yield knex('Sample').insert(sample)

    samples.push(sample)
  }

  // HIV VL Results:
  possibleResults = [{ resultText: 'HIV Detected (log {1})', category1: resultCategoryDetectedId },
                          { resultText: 'HIV Not Detected', category1: resultCategoryNotDetectedId },
                          { resultText: 'No Result', category1: resultCategoryNoResultId },
                          { resultText: 'Error', category1: resultCategoryErrorId },
                          { resultText: 'Invalid', category1: resultCategoryInvalidId }]

  resultData = {
    probes: {
      gpCt: 25.40,
      gpEndPt: 558.00,
      cicCt: 23.90,
      cicEndPt: 289.00,
      sacCt: 33.80,
      sacEndPt: 650.00,
      npCt: 12.2,
      npEndPt: null,
      qc1Ct: 0.32,
      qc1Endpt: 0,
      qc2Ct: 11.4,
      qc2Endpt: 0.5
    }
  }

  for (const i of _.range(1, resultHivVlNumber + 1)) {
    const device = devicesDaktari[i % devicesDaktari.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const result = possibleResults[i % 5]
    const randomTimespan = _.random(6000) * millisInMinute
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
    resultData.resultText = result.resultText.replace('{0}', copies).replace('{1}', log)

    const resultId = yield knex('Result').insert(Object.assign({}, auditFields, {
      externalId: `UQ-DAK-HIV-${i}`,
      assayId: assayDaktariHivVlId,
      partnerId: partnerOneId,
      orgUnitId: partnerOneOrgUnitId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      deviceId: device.id,
      resultWorkflowStatusId: acknowledged,
      longitude: -81.581222,
      latitude: 28.419348,
      resultTypeId: resultTypePatientId,
      sampleId: sample.id,
      sampleRunNumber: `${(i % 2) + 1}`,
      resultCategory1: result.category1,
      resultData: JSON.stringify(resultData),
      assayVersion: '4',
      startedOn: new Date(+now - randomTimespan - (12 * millisInHour)),
      endedOn: new Date(+now - randomTimespan - (11 * millisInHour)),
      consumableSerial: `${i}12`,
      consumableExpirationDate: new Date(+now + (200 * i * millisInHour)),
      consumableLot: `Lot ${i % 5}`,
      instrumentSerial: `S-1234-${i % 3}`,
      moduleName: 'Module A',
      moduleSerial: `M-1234-${i % 4}`,
      researchId: `R-ID-${i}`,
      patientData: JSON.stringify(patients[_.random(99)]),
      senderVersion: '4.4',
      senderOperator: 'Aaron',
      notes: 'This is an HIV test result',
      errorCode: result.category1 === resultCategoryErrorId ? '1024' : null,
      errorNotes: result.category1 === resultCategoryErrorId ? 'Exceeded cycle threshold' : null
    }))

    yield knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: acknowledged,
      operator: 'Aaron',
      changedOn: new Date(+now - randomTimespan - (2 * millisInHour)),
      createdOn: new Date(+now - randomTimespan - (1 * millisInHour)),
      createdBy: adminId
    })
  }

  // some HCV samples for Daktari
  samples = []
  for (let i = 0; i < resultHcvNumber / 2; i++) {
    const siteData = siteDatas[i % siteDatas.length]
    const sample = Object.assign({}, {
      externalId: `SMP-HCV-DAK-${i}`,
      collectedOn: new Date(+now - (120 * millisInHour)),
      sampleTypeId: sampleTypeDBSId,
      originSiteId: siteData.id
    })

    sample.id = yield knex('Sample').insert(sample)

    samples.push(sample)
  }

  // Daktari HCV Results:
  possibleResults = [{ resultText: 'HCV Detected (log {1})', category1: resultCategoryDetectedId },
                          { resultText: 'HCV Not Detected', category1: resultCategoryNotDetectedId },
                          { resultText: 'No Result', category1: resultCategoryNoResultId },
                          { resultText: 'Error', category1: resultCategoryErrorId },
                          { resultText: 'Invalid', category1: resultCategoryInvalidId }]

  resultData = {
    probes: {
      gpCt: 25.40,
      gpEndPt: 558.00,
      cicCt: 23.90,
      cicEndPt: 289.00,
      sacCt: 33.80,
      sacEndPt: 650.00,
      npCt: 12.2,
      npEndPt: null,
      qc1Ct: 0.32,
      qc1Endpt: 0,
      qc2Ct: 11.4,
      qc2Endpt: 0.5
    }
  }

  for (const i of _.range(1, resultHcvNumber + 1)) {
    const device = devicesDaktari[i % devicesDaktari.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const result = possibleResults[i % 5]
    const randomTimespan = _.random(6000) * millisInMinute
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
    resultData.resultText = result.resultText.replace('{0}', copies).replace('{1}', log)

    const resultId = yield knex('Result').insert(Object.assign({}, auditFields, {
      externalId: `UQ-DAK-HCV-${i}`,
      assayId: assayDaktariHcvId,
      partnerId: partnerOneId,
      orgUnitId: partnerOneOrgUnitId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      deviceId: device.id,
      resultWorkflowStatusId: acknowledged,
      longitude: -81.581222,
      latitude: 28.419348,
      resultTypeId: resultTypePatientId,
      sampleId: sample.id,
      sampleRunNumber: `${(i % 2) + 1}`,
      resultCategory1: result.category1,
      resultData: JSON.stringify(resultData),
      assayVersion: '4',
      startedOn: new Date(+now - randomTimespan - (12 * millisInHour)),
      endedOn: new Date(+now - randomTimespan - (11 * millisInHour)),
      consumableSerial: `${i}12`,
      consumableExpirationDate: new Date(+now + (200 * i * millisInHour)),
      consumableLot: `Lot ${i % 5}`,
      instrumentSerial: `S-1234-${i % 3}`,
      moduleName: 'Module A',
      moduleSerial: `M-1234-${i % 4}`,
      researchId: `R-ID-${i}`,
      patientData: JSON.stringify(patients[_.random(99)]),
      senderVersion: '4.4',
      senderOperator: 'Aaron',
      notes: 'This is an HCV test result',
      errorCode: result.category1 === resultCategoryErrorId ? '1024' : null,
      errorNotes: result.category1 === resultCategoryErrorId ? 'Exceeded cycle threshold' : null
    }))

    yield knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: acknowledged,
      operator: 'Aaron',
      changedOn: new Date(+now - randomTimespan - (1 * millisInHour)),
      createdOn: new Date(+now - randomTimespan - (2 * millisInHour)),
      createdBy: adminId
    })
  }

  // data filters
  const [dataFilterIdOH] = yield knex('DataFilter').insert({
    name: 'Ohio Filter',
    // TODO specify query constraint format (likely similar to MongoDB)
    constraint: JSON.stringify({
      state: {
        id: countries.US.states.OH.id
      }
    })
  })

  const [dataFilterIdNE] = yield knex('DataFilter').insert({
    name: 'Nebraska Filter',
    constraint: JSON.stringify({
      state: {
        id: countries.US.states.NE.id
      }
    })
  })

  const [dataFilterIdOHWayne] = yield knex('DataFilter').insert({
    name: 'Wayne County, OH Filter',
    constraint: JSON.stringify({
      lga: {
        id: countries.US.states.OH.lgas.Wayne.id
      }
    })
  })

  const [dataFilterIdMASuffolk] = yield knex('DataFilter').insert({
    name: 'Suffolk County, MA Filter',
    constraint: JSON.stringify({
      lga: {
        id: countries.US.states.MA.lgas.Suffolk.id
      }
    })
  })

  // Roles
  const [roleIdAdmin] = yield knex('Role').insert({
    name: 'Admin',
    partnerId: partnerOneId
  })

  const [roleIdOH] = yield knex('Role').insert({
    name: 'Ohio Users',
    partnerId: partnerOneId,
    dataFilterId: dataFilterIdOH
  })
  const [roleIdNE] = yield knex('Role').insert({
    name: 'Nebraska Users',
    partnerId: partnerOneId,
    dataFilterId: dataFilterIdNE
  })

  const [roleIdOHWayne] = yield knex('Role').insert({
    name: 'Wayne County, OH Users',
    partnerId: partnerOneId,
    dataFilterId: dataFilterIdOHWayne
  })

  const [roleIdMASuffolk] = yield knex('Role').insert({
    name: 'Suffolk County, MA Users',
    partnerId: partnerOneId,
    dataFilterId: dataFilterIdMASuffolk
  })

  const [roleIdParentOrgUnit] = yield knex('Role').insert({
    name: 'Partner One Users',
    partnerId: partnerOneId,
    orgUnitId: partnerOneOrgUnitId
  })

  const [roleIdNortheast] = yield knex('Role').insert({
    name: 'Northeast Users',
    partnerId: partnerOneId,
    orgUnitId: regionNortheastId
  })

  const [roleIdMidwest] = yield knex('Role').insert({
    name: 'Midwest Users',
    partnerId: partnerOneId,
    orgUnitId: regionMidwestId
  })

  const [roleIdPartnerTwo] = yield knex('Role').insert({
    name: 'Partner Two Users',
    partnerId: partnerTwoId
  })

  // assign permissions to roles
  yield knex('RolePermission').insert([
    { roleId: roleIdAdmin, permissionId: modules.demo.admin },
    { roleId: roleIdAdmin, permissionId: modules.deviceApiKey.admin },
    { roleId: roleIdAdmin, permissionId: modules.device.admin },
    { roleId: roleIdAdmin, permissionId: modules.person.admin },
    { roleId: roleIdAdmin, permissionId: modules.result.admin },
    { roleId: roleIdAdmin, permissionId: modules.site.admin },
    { roleId: roleIdAdmin, permissionId: modules.assay.admin },
    { roleId: roleIdAdmin, permissionId: modules.inventory.admin },
    { roleId: roleIdAdmin, permissionId: modules.notification.admin },
    { roleId: roleIdAdmin, permissionId: modules.report.admin },

    // FIXME: result permission for role

    { roleId: roleIdOH, permissionId: modules.site.edit },
    { roleId: roleIdOH, permissionId: modules.device.edit },
    { roleId: roleIdOH, permissionId: modules.assay.edit },
    { roleId: roleIdOH, permissionId: modules.inventory.edit },

    { roleId: roleIdNE, permissionId: modules.site.edit },
    { roleId: roleIdNE, permissionId: modules.device.edit },


    { roleId: roleIdOHWayne, permissionId: modules.site.view },
    { roleId: roleIdOHWayne, permissionId: modules.device.view },
    { roleId: roleIdOHWayne, permissionId: modules.assay.view },
    { roleId: roleIdOHWayne, permissionId: modules.inventory.view },

    { roleId: roleIdMASuffolk, permissionId: modules.device.view },

    { roleId: roleIdMidwest, permissionId: modules.site.edit },
    { roleId: roleIdMidwest, permissionId: modules.device.edit },

    { roleId: roleIdNortheast, permissionId: modules.site.edit },
    { roleId: roleIdNortheast, permissionId: modules.device.edit },

    { roleId: roleIdParentOrgUnit, permissionId: modules.site.edit },
    { roleId: roleIdParentOrgUnit, permissionId: modules.device.edit },

    { roleId: roleIdPartnerTwo, permissionId: modules.inventory.edit }
  ])

  // assign roles to users
  yield knex('UserRole').insert([
    { userId: userIds.admin, roleId: roleIdAdmin },
    { userId: userIds.bob, roleId: roleIdOH },
    { userId: userIds.ed, roleId: roleIdMidwest },
    { userId: userIds.frank, roleId: roleIdNE },
    { userId: userIds.fred, roleId: roleIdOHWayne },
    { userId: userIds.jon, roleId: roleIdParentOrgUnit },
    { userId: userIds.ned, roleId: roleIdNortheast },
    { userId: userIds.sam, roleId: roleIdAdmin },
    { userId: userIds.jason, roleId: roleIdPartnerTwo },
    { userId: userIds.jim, roleId: roleIdParentOrgUnit },
    { userId: userIds.steve, roleId: roleIdMASuffolk },
    { userId: userIds.bill, roleId: roleIdMASuffolk },
    { userId: userIds.bill, roleId: roleIdOH }])
}
