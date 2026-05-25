module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const bcrypt = require('bcrypt')
const Promise = require('bluebird')
const { addMilliseconds, addMinutes, subMinutes, subDays } = require('date-fns')
const jobFunctionsFixturePartnerOne = require('./fixtures/jobFunctions_partnerOne')
const jobFunctionsFixturePartnerTwo = require('./fixtures/jobFunctions_partnerTwo')
const { upsertJobFunctionFixture, upsertPermissionFixture, upsertGeneXpertDeviceTypeAndAssays } = require('../common')
const config = require('../../src/config')
const { seedAbbottM2000AndAssays } = require('../utils_abbott_m2000')
const {
  allAssayTypeToId,
  allDeviceTypeCategoryToId,
  allPartnerTypeToId,
  allResultCategoryToId,
  allResultStatusToId,
  allResultSourceToId,
  consumableToId,
  deviceApprovalToId,
  sampleTypeToId,
  resultTypeToId,
} = require('../../src/shared/dictionary')
const { randomToken } = require('../../src/deviceApi/apiKey')
const geography = require('./fixtures/geography.json')
const patients = require('./fixtures/patients.json')
const dashboardWidget = require('./fixtures/dashboardWidget')
const { errorCodes } = require('./fixtures/errorCodes.js')
const upsertConsumables = require('../common/upsert_consumables')
const { insertSite } = require('../../src/site/common/db')

const millisInHour = 1000 * 60 * 60
const millisInMinute = 1000 * 60
const millisInNormalYear = 1000 * 60 * 60 * 24 * 365
const resultTimeFrameInDays = 365

const resultHcvNumber = 100
const now = new Date()
const patientNumber = patients.length - 1

const saltRounds = parseInt(config.passwordSaltRounds, 10)

function calculateDateForResult(currentResult, totalResults, randomMillisToAdd) {
  const daysToSubtract = resultTimeFrameInDays - Math.ceil((currentResult / totalResults) * resultTimeFrameInDays)

  return addMilliseconds(subDays(now, daysToSubtract), _.random(randomMillisToAdd))
}

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User').where({ name: 'admin' }).first('id')
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
  const { funding: partnerTypeFundingId, implementing: partnerTypeImplementingId } = await allPartnerTypeToId()

  // Create partners
  const [partnerOneId] = await knex('Partner').insert({
    name: 'Partner One',
    externalId: 'partnerOne',
    partnerTypeId: partnerTypeFundingId,
    deviceLogHistoryDays: 14,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
  })

  const [partnerTwoId] = await knex('Partner').insert({
    name: 'Partner Two',
    externalId: 'partnerTwo',
    partnerTypeId: partnerTypeImplementingId,
    deviceLogHistoryDays: 14,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
  })

  await upsertGeneXpertDeviceTypeAndAssays(knex, [
    'GxMtbXdr',
    'GxMtbRif',
    'GxMtbRifUltra',
    'GxHiv1Vl',
    'GxHiv1Qual',
    'GxEbola',
    'GxHcv',
    'GxUnknown',
    'assayGXCovid19',
  ])
  await seedAbbottM2000AndAssays(knex)

  // Categories of devices (lab, connectivity...)
  const {
    Lab: deviceTypeCategoryLab,
    Router: deviceTypeCategoryConnectivity,
    'Information System': deviceTypeCategoryInformationSystem,
  } = await allDeviceTypeCategoryToId()

  // define configurationData object
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
  const [deviceTypeQId] = await knex('DeviceType').insert({
    externalId: 'AlereQ',
    name: 'Alere Q',
    manufacturer: 'Alere',
    deviceTypeCategoryId: deviceTypeCategoryLab,
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
  const { DiagnosticDevice: resultSourceDiagnosticId, LIMS: resultSourceLIMSId } = await allResultSourceToId()

  // Assays and AssayTypes
  const {
    'HIV VL': assayTypeHivVlId,
    'CD4 Count': assayTypeCD4Id,
    EID: assayTypeEid,
    HCV: assayTypeHcvId,
  } = await allAssayTypeToId()

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
  const patientData = {
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
  }
  const geneXpertPatientDataSchema = JSON.stringify({
    ...patientData,
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

  const [assayDaktariHcvId] = await knex('Assay').insert({
    name: 'Daktari HCV',
    abbreviation: 'DAK HCV',
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
    abbreviation: 'DAK HIV VL',
    i18nKey: 'assayDaktariHivVl',
    externalId: 'DaktariHivVL',
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
    abbreviation: 'DAK CD4',
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
    name: 'Q HIV VL',
    abbreviation: 'Q HIV VL',
    i18nKey: 'assayQHivVl',
    externalId: 'QHivVL',
    assayTypeId: assayTypeHivVlId,
    deviceTypeId: deviceTypeQId,
    resultSourceId: resultSourceDiagnosticId,
    resultCategory1Label: 'HIV',
    resultCategory1i18nKey: 'resultCategoryHivVl',
  })

  await knex('Assay').insert({
    name: 'CHAI HIV VL',
    abbreviation: 'CHAI HIV VL',
    i18nKey: 'AssayChaiHivVl',
    externalId: 'CHAIHivVL',
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
    abbreviation: 'CHAI EID',
    i18nKey: 'AssayChaiEid',
    externalId: 'CHAIEID',
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
    abbreviation: 'CC HIV',
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
    NotDetected: resultCategoryNotDetectedId,
    Invalid: resultCategoryInvalidId,
    NoResult: resultCategoryNoResultId,
    Error: resultCategoryErrorId,
    LessThan1000: resultCategoryLessThan1000,
    MoreThan1000: resultCategoryMoreThan1000,
  } = await allResultCategoryToId()

  // assign categories to Assays
  // Daktari HIV Viral Load
  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayDaktariHivVlId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNotDetectedId,
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

  await upsertConsumables(knex, true, ['DaktariCD4', 'DaktariHivVL'])
  const consumableGxTbCartridgeId = await consumableToId('GxMtbRifCartridge')

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

    const [countryGeographyId] = await knex('Geography').insert({
      countryId,
    })
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
          const siteData = {
            partnerId: partnerOneId,
            geographyId,
            externalId: `${state.name}_${lga.name}`,
            name: `${lga.name} County ${state.name}`,
            shortName: `${lga.name}, ${stateKey}`,
            city: `${lga.name} City`,
            street1: `${lgaData.id} Main Street`,
            zip: `12345-${lgaData.id}`,
            latitude: _.has(state, 'lat') ? state.lat + _.random(-0.5, 0.5, true) : undefined,
            longitude: _.has(state, 'lng') ? state.lng + _.random(-0.5, 0.5, true) : undefined,
            ...auditFields,
          }
          const [siteId] = await insertSite(knex, siteData)
          siteData.id = siteId
          siteDatas.push(siteData)
        }
      })
    })
  })

  const siteDataDayton = {
    partnerId: partnerOneId,
    geographyId: siteDatas[0].geographyId,
    externalId: 'OH_Dayton',
    name: 'Dayton Ohio',
    shortName: 'Dayton, OH',
    city: 'Dayton City',
    street1: '3 Main Street',
    zip: '12345-3',
    latitude: 0,
    longitude: 0,
    ...auditFields,
  }
  const [siteDaytonId] = await insertSite(knex, siteDataDayton)
  siteDataDayton.id = siteDaytonId

  const { id: geographyId } = await knex('Geography as g')
    .innerJoin('Country as c', 'c.id', 'g.countryId')
    .where({ 'c.a3': 'USA' })
    .first('g.id')

  const [adminPersonId] = await knex('Person').insert({
    userId: adminId,
    name: 'Admin',
    lastPartnerId: partnerOneId,
    lastCountryId: countries.US.id,
    timezone: countries.US.timezone,
    culture: countries.US.culture,
    geographyId,
    canLogIn: true,
    ...auditFields,
  })

  // set admin's email/sms
  await knex('Person').where('userId', adminId).update({
    email: config.admin.email,
    cell: config.admin.cell,
  })

  const [regionalAdminId] = await knex('User').insert({
    name: 'regionalAdmin',
    password: bcrypt.hashSync('test07', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })

  const [regionalAdminPersonId] = await knex('Person').insert({
    userId: regionalAdminId,
    name: 'Regional Admin',
    email: config.manager.email,
    cell: config.manager.cell,
    lastPartnerId: partnerOneId,
    lastCountryId: countries.US.id,
    timezone: countries.US.timezone,
    culture: countries.US.culture,
    geographyId,
    canLogIn: true,
    ...auditFields,
  })

  // create clinician user
  const [clinicianId] = await knex('User').insert({
    name: 'clinician',
    password: bcrypt.hashSync('test07', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })

  const [clinicianPersonId] = await knex('Person').insert({
    userId: clinicianId,
    name: 'Clinician',
    lastPartnerId: partnerOneId,
    lastCountryId: countries.US.id,
    timezone: countries.US.timezone,
    culture: countries.US.culture,
    geographyId,
    canLogIn: true,
    ...auditFields,
  })

  const deviceApprovalApproved = await deviceApprovalToId('approved')

  // insert router with sims
  const site = siteDatas[0]
  const [routerId] = await knex('Device').insert({
    ...auditFields,
    name: `Router at ${site.shortName}`,
    shortName: `Router ${site.shortName}`,
    deviceTypeId: deviceTypeIdRouter,
    deviceApprovalId: deviceApprovalApproved,
    partnerId: site.partnerId,
    siteId: site.id,
    createdOn: new Date(+now - 3 * _.random(10) * millisInHour),
    updatedOn: new Date(+now - _.random(10) * millisInHour),
    lastPingOn: new Date(+now - (_.random(10) * millisInHour) / 3),
    lastSeenOn: new Date(+now - (_.random(10) * millisInHour) / 3),
  })

  // insert Daktari devices
  const devicesDaktari = []
  await Promise.each(siteDatas, async (siteData, i) => {
    const device = {
      ...auditFields,
      name: `Daktari ${siteData.shortName}`,
      shortName: `Daktari ${siteData.shortName}`,
      deviceTypeId: deviceTypeDaktariVirologyId,
      deviceApprovalId: deviceApprovalApproved,
      configurationData: JSON.stringify({
        requirePrinter: 'yes',
        adminPassword: 'pwd123',
        firmwareUpdateRequired: 'no',
      }),
      partnerId: siteData.partnerId,
      siteId: siteData.id,
      defaultReportableSiteId: siteDatas[i + 1] ? siteDatas[i + 1].id : null,
      deviceId: i === 0 ? routerId : null,
      createdOn: new Date(+now - 3 * i * millisInHour),
      updatedOn: new Date(+now - i * millisInHour),
      lastPingOn: new Date(+now - (i * millisInHour) / 3),
      lastSeenOn: new Date(+now - (i * millisInHour) / 3),
      hostId: _.times(8, () => String.fromCharCode(65 + i + (_.random(1) > 0 ? 32 : 0))).join(''),
      serial: _.times(24, () => String.fromCharCode(65 + i + (_.random(1) > 0 ? 32 : 0))).join(''),
    }

    ;[device.id] = await knex('Device').insert(device)
    devicesDaktari.push(device)

    // Create API Keys
    const [deviceApiKeyId] = await knex('DeviceApiKey').insert({
      token: randomToken(),
      revoked: 0,
      partnerId: siteData.partnerId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      ...auditFields,
    })

    await knex('Device').where('id', device.id).update({ deviceApiKeyId })
  })

  // Insert Inventory Items
  await Promise.each(siteDatas, async (siteData, i) => {
    // TB Cartridges
    await knex('InventoryItem').insert({
      consumableId: consumableGxTbCartridgeId,
      siteId: siteData.id,
      lotNumber: `${(i + 3) * (i + 1)}${['A', 'B'][i % 2]}-${(siteData.id + i) * consumableGxTbCartridgeId}`,
      expiresOn: new Date(
        new Date(now.getTime() + _.random(-millisInNormalYear, millisInNormalYear)).setHours(0, 0, 0, 0)
      ),
      quantityOnHand: _.random(0, 1000),
      ...auditFields,
    })
  })

  // some HCV samples for Daktari
  const samples = []
  await Promise.each(siteDatas, async (siteData, i) => {
    const siteDate = i === 0 ? siteDataDayton : siteDatas[i]
    const sample = {
      externalId: `SMP-HIV-GX-${i}`,
      collectedOn: calculateDateForResult(i, resultHcvNumber, millisInMinute),
      sampleTypeId: await sampleTypeToId('DBS'),
      originSiteId: siteDate.id,
      createdOn: now,
      updatedOn: now,
    }
    ;[sample.id] = await knex('Sample').insert(sample)
    samples.push(sample)
  })

  // Daktari HIV VL  Results:
  const possibleResults = [
    {
      resultText: 'HIV Detected (log {1})',
      category1: resultCategoryDetectedId,
    },
    {
      resultText: 'HIV Not Detected',
      category1: resultCategoryNotDetectedId,
    },
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
  _.map(_.range(devicesDaktari.length * 4), i => {
    const device = devicesDaktari[i % siteDatas.length]
    const siteData = siteDatas.find(site => site.id === device.siteId)
    const sample = samples[i % samples.length]
    const randomDate = calculateDateForResult(i, resultHcvNumber, 6000)

    // make sure that at least first 4 results are 'reportable'
    const result = possibleResults[i <= 3 ? i % 2 : _.random(4)]
    let copies = 3200
    let log = 5
    if (result === possibleResults[0]) {
      copies = Math.floor(Math.random() * 500000)
      log = Math.round(Math.random() * 600) / 100
    } else {
      copies = null
      log = null
    }
    resultData.resultText = result.resultText.replace('{0}', copies).replace('{1}', log)

    resultDatas.push({
      ...auditFields,
      externalId: `UQ-DAK-HIV-${i}`,
      assayId: assayDaktariHivVlId,
      partnerId: partnerOneId,
      siteId: siteData.id,
      deviceId: device.id,
      longitude: -81.581222,
      latitude: 28.419348,
      resultSourceId: resultSourceDiagnosticId,
      resultTypeId: resultTypePatientId,
      sampleId: sample.id,
      sampleRunNumber: `${(i % 2) + 1}`,
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
      errorCode: result.category1 === resultCategoryErrorId ? errorCodes[_.random(errorCodes.length)] : null,
      errorNotes: result.category1 === resultCategoryErrorId ? 'Exceeded cycle threshold' : null,
      reportableSiteId: sample.originSiteId || siteData.id,
    })
  })

  const resultStatuses = await allResultStatusToId()
  const resultStatusesIds = Object.values(resultStatuses)

  const createdOn = subMinutes(now, 90)
  await Promise.each(resultDatas, async (resultData, i) => {
    const [resultId] = await knex('Result').insert(resultData)

    // Insert one result status log (ensure we log one of each status)
    let rdm = (i + 1) % resultStatusesIds.length
    await knex('ResultStatusLog').insert({
      resultId,
      resultStatusId: resultStatusesIds[rdm],
      createdOn,
      createdBy: adminId,
    })
    // Insert another random result status log
    rdm = _.random(0, resultStatusesIds.length - 1)
    await knex('ResultStatusLog').insert({
      resultId,
      resultStatusId: resultStatusesIds[rdm],
      createdOn,
      createdBy: adminId,
    })
  })

  await upsertPermissionFixture(knex)
  await upsertJobFunctionFixture(knex, jobFunctionsFixturePartnerOne, partnerOneId)
  await upsertJobFunctionFixture(knex, jobFunctionsFixturePartnerTwo, partnerTwoId)

  const { id: jobFunctionIdSuperAdmin } = await knex('JobFunction')
    .where({ externalId: 'superAdmin', partnerId: partnerOneId })
    .first()
  const { id: jobFunctionIdClinician } = await knex('JobFunction')
    .where({ externalId: 'clinician', partnerId: partnerOneId })
    .first()
  const { id: jobFunctionIdRegionalAdmin } = await knex('JobFunction')
    .where({ externalId: 'regionalAdmin', partnerId: partnerOneId })
    .first()
  const { id: jobFunctionIdPartnerTwo } = await knex('JobFunction')
    .where({ externalId: 'labManager', partnerId: partnerTwoId })
    .first()

  // Constrain jobs by context
  await knex('JobContext').insert([
    { personId: adminPersonId, jobFunctionId: jobFunctionIdSuperAdmin, geographyId: countries.US.geographyId },
  ])

  await knex('JobContext').insert([
    {
      personId: regionalAdminPersonId,
      jobFunctionId: jobFunctionIdRegionalAdmin,
      geographyId: countries.US.geographyId,
    },
  ])

  await knex('JobContext').insert([
    { personId: clinicianPersonId, jobFunctionId: jobFunctionIdClinician, siteId: siteDataDayton.id },
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
      'externalId',
      'description',
      'descriptionI18nKey',
      'dashboards',
    ])
    widgetData.dashboards = JSON.stringify(widgetData.dashboards || { home: {} })

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
    await knex('DashboardWidgetStat').insert({
      dashboardWidgetId: widgetId,
      ...statWidgetData,
    })
    widgetIds[_.toLower(widget.title)] = widgetId
  })

  await knex('JobFunctionDashboardWidget').insert([
    { jobFunctionId: jobFunctionIdSuperAdmin, widgetId: widgetIds.sites },
    { jobFunctionId: jobFunctionIdSuperAdmin, widgetId: widgetIds.devices },
    { jobFunctionId: jobFunctionIdSuperAdmin, widgetId: widgetIds.results },

    { jobFunctionId: jobFunctionIdRegionalAdmin, widgetId: widgetIds.sites },
    { jobFunctionId: jobFunctionIdRegionalAdmin, widgetId: widgetIds.devices },

    { jobFunctionId: jobFunctionIdPartnerTwo, widgetId: widgetIds.sites },
    { jobFunctionId: jobFunctionIdPartnerTwo, widgetId: widgetIds.devices },

    { jobFunctionId: jobFunctionIdClinician, widgetId: widgetIds.sites },
    { jobFunctionId: jobFunctionIdClinician, widgetId: widgetIds.devices },
  ])
}
