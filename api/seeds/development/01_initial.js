module.exports = require('../utils').seed(seed, __filename)
const Promise = require('bluebird')
const _ = require('lodash')
const bcrypt = require('bcrypt')
const {
  addMilliseconds,
  addMinutes,
  addHours,
  subHours,
  subDays,
} = require('date-fns')

const config = require('../../src/config')
const { seedAbbottM2000AndAssays } = require('../utils_abbott_m2000')
const {
  allAssayTypeToId,
  allDeviceApprovalToId,
  allDeviceTypeCategoryToId,
  allPartnerTypeToId,
  allResultCategoryToId,
  allResultSourceToId,
  allResultWorkflowStatusToId,
  allSampleTypeToId,
  assayTypeToId,
  resultSourceToId,
  resultTypeToId,
  unitToId,
} = require('../../src/shared/dictionary')
const { randomToken } = require('../../src/deviceApi/apiKey')
const geography = require('./fixtures/geography.json')
const patients = require('./fixtures/patients.json')
const patientDataSchema = require('../fixtures/MGITPatientDataSchema')
const dashboardWidget = require('./fixtures/dashboardWidget')
const { errorCodes } = require('./fixtures/errorCodes.js')
const {
  upsertMGITDeviceTypeAndAssays,
  upsertCultureAssays,
} = require('../commonTB')
const { getRandomTBPatientData } = require('../commonTbresults')
const jobFunctionsFixturePartnerOne = require('./fixtures/jobFunctions_partnerOne')
const jobFunctionsFixturePartnerTwo = require('./fixtures/jobFunctions_partnerTwo')
const { upsertJobFunctionFixture } = require('../common')
const upsertReports = require('../common/upsert_reports')

const millisInHour = 1000 * 60 * 60
const millisInMinute = 1000 * 60
const millisInNormalYear = 1000 * 60 * 60 * 24 * 365
const resultTimeFrameInDays = 365
const deviceNumber = 50
const routerNumber = 20
const resultMultiplier = process.env['seeds.resultMultiplier'] || 100
const resultMtbNumber = resultMultiplier
const resultHivVlNumber = 0.6 * resultMultiplier
const resultEbolaNumber = 0
const resultHcvNumber = 0
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
    Math.ceil((currentResult / totalResults) * resultTimeFrameInDays)

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

  await seedAbbottM2000AndAssays(knex)

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

  const [deviceTypeQId] = await knex('DeviceType').insert({
    externalId: 'AlereQ',
    name: 'Alere Q',
    manufacturer: 'Alere',
    deviceTypeCategoryId: deviceTypeCategoryLab,
  })

  const [deviceTypeIdRouter] = await knex('DeviceType').insert({
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

  let { id: deviceTypeSenaiteLimsId } =
    (await knex('DeviceType').where('externalId', 'SenaiteLims').first('id')) ||
    {}
  if (!deviceTypeSenaiteLimsId) {
    ;[deviceTypeSenaiteLimsId] = await knex('DeviceType').insert({
      externalId: 'SenaiteLims',
      name: 'Senaite LIMS',
      manufacturer: 'Senaite',
      deviceTypeCategoryId: deviceTypeCategoryInformationSystem,
    })
  }

  let { id: deviceTypeHainGenoScanId } =
    (await knex('DeviceType')
      .where('externalId', 'HainGenoScan')
      .first('id')) || {}
  if (!deviceTypeHainGenoScanId) {
    ;[deviceTypeHainGenoScanId] = await knex('DeviceType').insert({
      externalId: 'HainGenoScan',
      name: 'Hain GenoScan',
      manufacturer: 'Hain Lifescience',
      deviceTypeCategoryId: deviceTypeCategoryLab,
    })
  }
  await upsertMGITDeviceTypeAndAssays(knex)
  await upsertCultureAssays(knex, deviceTypeSenaiteLimsId)
  // Units
  const piece = await unitToId('Piece')

  /*
  GenoType Test Strips for Tuberculosis
    http://www.hain-lifescience.co.za/products/microbiology/mycobacteria/tubercolusis.html
    http://www.hain-lifescience.co.za/uploadfiles/file/produkte/mikrobiologie/mykobakterien/tb_eng.pdf

  - GenoType MTBC VER 1.X: Molecular genetic assay for differentiation between M. tuberculosis,
      M. bovis ssp. bovis, M. bovis ssp. caprae, M. africanum, M. microti, M. canettii
      and the vaccine strain M. bovis BCG (Bacille Calmette-Guérin)
    Strip Consists of 13 Bands: 2 Control Bands, 1 MTBC probe band and 10 gene probe bands
    - Band 1: Conjugate Control
    - Band 2: Universal Control
    - Band 3: MTBC
    - M. tuberculosis/M. canettii: Bands 4,5,6,7,8
    - M. africanum: Bands 4,5,6,7,10
    - M. microti: Bands 4,5,6,10,11
    - M. bovis ssp. bovis: Bands 4,7,9,10
    - M. bovis BCG: Bands 4,7,9,10,13
    - M. bovis ssp. caprae: Bands 5,7,10,12
  */
  const assayGenoTypeMTBCV1 = {
    name: 'GenoType MTBC VER 1.X',
    abbreviation: 'GTMTBCV1',
    i18nKey: 'assayGenoTypeMTBCV1',
    externalId: 'assayGenoTypeMTBCV1',
    assayTypeId: await assayTypeToId('GenoType Test Strip'),
    deviceTypeId: deviceTypeHainGenoScanId,
    resultSourceId: await resultSourceToId('DiagnosticDevice'),
    resultCategory1Label: 'Result',
    resultDataSchema: JSON.stringify({
      no: {
        list: false,
        order: 1,
        type: 'number',
        title: 'Order-Number of Strip in Analysis',
      },
      company: {
        list: true,
        order: 2,
        type: 'string',
        title: 'Producer of Testkit',
      },
      typeOfTest: {
        list: true,
        order: 3,
        type: 'string',
        title: 'Internal name of setcard',
      },
      revision: {
        list: false,
        order: 4,
        type: 'number',
        title: 'Internal revision number of setcard',
      },
      control: {
        list: false,
        order: 5,
        type: 'string',
        title: 'Internal name of control',
      },
      igType: {
        list: true,
        order: 6,
        type: 'string',
        title: 'Internal Ig-Type',
      },
      charge: {
        list: false,
        order: 7,
        type: 'string',
        title: 'Lot-Number of Testkit',
      },
      stripType: {
        list: true,
        order: 8,
        type: 'string',
        title: 'Internal Type of Strip',
      },
      cw: {
        list: false,
        order: 9,
        type: 'number',
        title: 'Internal Connected-With-Strip number',
      },
      probeNumber: {
        list: false,
        order: 10,
        type: 'string',
        title: 'Blood-Sample-ID',
      },
      pid: {
        list: true,
        order: 11,
        type: 'string',
        title: 'External Patient-ID',
      },
      lastName: {
        list: false,
        order: 12,
        type: 'string',
        title: 'Last name of Patient',
      },
      firstName: {
        list: false,
        order: 13,
        type: 'string',
        title: 'First name of Patient',
      },
      birthday: {
        list: false,
        order: 14,
        type: 'date',
        title: 'Date of Birth of Patient',
      },
      sex: {
        list: false,
        order: 15,
        type: 'string',
        title: 'Sex of Patient',
      },
      elisaIgA: {
        list: true,
        order: 16,
        type: 'string',
        title: 'Result Elisa IgA',
      },
      elisaIgG: {
        list: true,
        order: 17,
        type: 'string',
        title: 'Result Elisa IgG',
      },
      elisaIgM: {
        list: true,
        order: 18,
        type: 'string',
        title: 'Result Elisa IgM',
      },
      dateOfRequest: {
        list: false,
        order: 19,
        type: 'date',
        title: 'Date of Request',
      },
      dateOfAnalysis: {
        list: false,
        order: 20,
        type: 'date',
        title: 'Date of Analysis',
      },
      cutOffTolerance: {
        list: false,
        order: 21,
        type: 'number',
        title: 'Cut-Off Tolerance value',
      },
      rShort: {
        list: true,
        order: 22,
        type: 'string',
        title: 'Short form of result',
      },
      result: {
        list: false,
        order: 23,
        type: 'string',
        title: 'Long form of result',
      },
      rjoined: {
        list: false,
        order: 24,
        type: 'string',
        title: 'Result for joined Analysis',
      },
      antigens: {
        list: false,
        order: 25,
        type: 'string',
        title: 'Antigens',
      },
      revAntigens: {
        list: false,
        order: 26,
        type: 'string',
        title: 'Content of "Revised Antigens" Field in Analysis Window',
      },
      windowsUser: {
        list: false,
        order: 27,
        type: 'string',
        title: 'User logged onto Windows System',
      },
      checkSum: {
        list: false,
        order: 28,
        type: 'number',
        title: 'Checksum for data row',
      },
      band1I: {
        list: false,
        order: 29,
        type: 'number',
        title: 'Intensity of Band 1 on Strip',
      },
      band1Co: {
        list: false,
        order: 30,
        type: 'number',
        title: 'Relative Intensity of Band 1 compared to CutOff',
      },
      band1A: {
        list: false,
        order: 31,
        type: 'number',
        title: 'Integral (Area) of Band 1 on Strip',
      },
      band1R: {
        list: false,
        order: 32,
        type: 'number',
        title: 'Relative Intensity of Band 1',
      },
      band2I: {
        list: false,
        order: 33,
        type: 'number',
        title: 'Intensity of Band 2 on Strip',
      },
      band2Co: {
        list: false,
        order: 34,
        type: 'number',
        title: 'Relative Intensity of Band 2 compared to CutOff',
      },
      band2A: {
        list: false,
        order: 35,
        type: 'number',
        title: 'Integral (Area) of Band 2 on Strip',
      },
      band2R: {
        list: false,
        order: 36,
        type: 'number',
        title: 'Relative Intensity of Band 2',
      },
      band3I: {
        list: false,
        order: 37,
        type: 'number',
        title: 'Intensity of Band N on Strip',
      },
      band3Co: {
        list: false,
        order: 38,
        type: 'number',
        title: 'Relative Intensity of Band N compared to CutOff',
      },
      band3A: {
        list: false,
        order: 39,
        type: 'number',
        title: 'Integral (Area) of Band N on Strip',
      },
      band3R: {
        list: false,
        order: 40,
        type: 'number',
        title: 'Relative Intensity of Band N',
      },
      band4I: {
        list: false,
        order: 41,
        type: 'number',
        title: 'Intensity of Band 4 on Strip',
      },
      band4Co: {
        list: false,
        order: 42,
        type: 'number',
        title: 'Relative Intensity of Band 4 compared to CutOff',
      },
      band4A: {
        list: false,
        order: 43,
        type: 'number',
        title: 'Integral (Area) of Band 4 on Strip',
      },
      band4R: {
        list: false,
        order: 44,
        type: 'number',
        title: 'Relative Intensity of Band 4',
      },
      band5I: {
        list: false,
        order: 45,
        type: 'number',
        title: 'Intensity of Band 5 on Strip',
      },
      band5Co: {
        list: false,
        order: 46,
        type: 'number',
        title: 'Relative Intensity of Band 5 compared to CutOff',
      },
      band5A: {
        list: false,
        order: 47,
        type: 'number',
        title: 'Integral (Area) of Band 5 on Strip',
      },
      band5R: {
        list: false,
        order: 48,
        type: 'number',
        title: 'Relative Intensity of Band 5',
      },
      band6I: {
        list: false,
        order: 49,
        type: 'number',
        title: 'Intensity of Band 6 on Strip',
      },
      band6Co: {
        list: false,
        order: 50,
        type: 'number',
        title: 'Relative Intensity of Band 6 compared to CutOff',
      },
      band6A: {
        list: false,
        order: 51,
        type: 'number',
        title: 'Integral (Area) of Band 6 on Strip',
      },
      band6R: {
        list: false,
        order: 52,
        type: 'number',
        title: 'Relative Intensity of Band 6',
      },
      band7I: {
        list: false,
        order: 53,
        type: 'number',
        title: 'Intensity of Band 7 on Strip',
      },
      band7Co: {
        list: false,
        order: 54,
        type: 'number',
        title: 'Relative Intensity of Band 7 compared to CutOff',
      },
      band7A: {
        list: false,
        order: 55,
        type: 'number',
        title: 'Integral (Area) of Band 7 on Strip',
      },
      band7R: {
        list: false,
        order: 56,
        type: 'number',
        title: 'Relative Intensity of Band 7',
      },
      band8I: {
        list: false,
        order: 57,
        type: 'number',
        title: 'Intensity of Band 8 on Strip',
      },
      band8Co: {
        list: false,
        order: 58,
        type: 'number',
        title: 'Relative Intensity of Band 8 compared to CutOff',
      },
      band8A: {
        list: false,
        order: 59,
        type: 'number',
        title: 'Integral (Area) of Band 8 on Strip',
      },
      band8R: {
        list: false,
        order: 60,
        type: 'number',
        title: 'Relative Intensity of Band 8',
      },
      band9I: {
        list: false,
        order: 61,
        type: 'number',
        title: 'Intensity of Band 9 on Strip',
      },
      band9Co: {
        list: false,
        order: 62,
        type: 'number',
        title: 'Relative Intensity of Band 9 compared to CutOff',
      },
      band9A: {
        list: false,
        order: 63,
        type: 'number',
        title: 'Integral (Area) of Band 9 on Strip',
      },
      band9R: {
        list: false,
        order: 64,
        type: 'number',
        title: 'Relative Intensity of Band 9',
      },
      band10I: {
        list: false,
        order: 65,
        type: 'number',
        title: 'Intensity of Band 10 on Strip',
      },
      band10Co: {
        list: false,
        order: 66,
        type: 'number',
        title: 'Relative Intensity of Band 10 compared to CutOff',
      },
      band10A: {
        list: false,
        order: 67,
        type: 'number',
        title: 'Integral (Area) of Band 10 on Strip',
      },
      band10R: {
        list: false,
        order: 68,
        type: 'number',
        title: 'Relative Intensity of Band 10',
      },
    }),
    patientDataSchema: JSON.stringify(patientDataSchema),
  }
  let { id: assayGenoTypeMTBCV1Id } =
    (await knex('Assay')
      .where('externalId', 'assayGenoTypeMTBCV1')
      .first('id')) || {}
  if (!assayGenoTypeMTBCV1Id) {
    ;[assayGenoTypeMTBCV1Id] = await knex('Assay').insert({
      ...assayGenoTypeMTBCV1,
      externalId: 'assayGenoTypeMTBCV1',
    })
    const [genoTypeMTBCV1TestSripId] = await knex('Consumable').insert({
      name: 'GenoType MTBC VER 1.X Test Strip',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Hain Lifescience',
    })
    await knex('ConsumableAssay').insert([
      {
        assayId: assayGenoTypeMTBCV1Id,
        consumableId: genoTypeMTBCV1TestSripId,
        quantity: 1,
      },
    ])
  } else {
    await knex('Assay')
      .where('id', assayGenoTypeMTBCV1Id)
      .update(assayGenoTypeMTBCV1)
  }

  /*
  - GenoType MTBDRplus VER 2.0: Molecular genetic assay for detection of M. tuberculosis
      complex and its resistances to rifampicin and/or isoniazid
    Strip Consists of 27 Bands: 2 Control Bands, 1 MTBC probe band and 24 gene probe bands
    - Band 1: Conjugate Control
    - Band 2: Amplification Control
    - Band 3: MTBC
    - Band 4: rpoB Locus Control
    - Band 5: rpoB wild type probe 1
    - Band 6: rpoB wild type probe 2
    - Band 7: rpoB wild type probe 3
    - Band 8: rpoB wild type probe 4
    - Band 9: rpoB wild type probe 5
    - Band 10: rpoB wild type probe 6
    - Band 11: rpoB wild type probe 7
    - Band 12: rpoB wild type probe 8
    - Band 13: rpoB mutation probe 1
    - Band 14: rpoB mutation probe 2A
    - Band 15: rpoB mutation probe 2B
    - Band 16: rpoB mutation probe 3
    - Band 17: katG Locus Control
    - Band 18: katG wild type probe
    - Band 19: katG mutation probe 1
    - Band 20: katG mutation probe 2
    - Band 21: inhA Locus Control
    - Band 22: inhA wild type probe 1
    - Band 23: inhA wild type probe 2
    - Band 24: inhA mutation probe 1
    - Band 25: inhA mutation probe 2
    - Band 26: inhA mutation probe 3A
    - Band 27: inhA mutation probe 3B
    - No Resistance: Bands 4,5,6,7,8,9,10,11,12,17,18,21,22,23
    - Rifampicin & Isoniazid Resistance:
        Bands 4,5,6,7,8,9,10,12,14,17,19,21,22,23
        or
        Bands 4,5,6,7,8,9,10,11,16,17,20,21,22,26
        or
        Bands 4,5,6,7,8,9,10,12,17,21,22,23
    - Isoniazid Resistance: Bands 4,5,6,7,8,9,10,11,12,17,18,21,23,24
  */
  const assayGenoTypeMTBDRplusV2 = {
    name: 'GenoType MTBDRplus VER 2.0',
    abbreviation: 'GTMTBDRplusV2',
    i18nKey: 'assayGenoTypeMTBDRplusV2',
    externalId: 'assayGenoTypeMTBDRplusV2',
    assayTypeId: await assayTypeToId('GenoType Test Strip'),
    deviceTypeId: deviceTypeHainGenoScanId,
    resultSourceId: await resultSourceToId('DiagnosticDevice'),
    resultCategory1Label: 'Result',
    resultDataSchema: JSON.stringify({
      no: {
        list: false,
        order: 1,
        type: 'number',
        title: 'Order-Number of Strip in Analysis',
      },
      company: {
        list: true,
        order: 2,
        type: 'string',
        title: 'Producer of Testkit',
      },
      typeOfTest: {
        list: true,
        order: 3,
        type: 'string',
        title: 'Internal name of setcard',
      },
      revision: {
        list: false,
        order: 4,
        type: 'number',
        title: 'Internal revision number of setcard',
      },
      control: {
        list: false,
        order: 5,
        type: 'string',
        title: 'Internal name of control',
      },
      igType: {
        list: true,
        order: 6,
        type: 'string',
        title: 'Internal Ig-Type',
      },
      charge: {
        list: false,
        order: 7,
        type: 'string',
        title: 'Lot-Number of Testkit',
      },
      stripType: {
        list: true,
        order: 8,
        type: 'string',
        title: 'Internal Type of Strip',
      },
      cw: {
        list: false,
        order: 9,
        type: 'number',
        title: 'Internal Connected-With-Strip number',
      },
      probeNumber: {
        list: false,
        order: 10,
        type: 'string',
        title: 'Blood-Sample-ID',
      },
      pid: {
        list: true,
        order: 11,
        type: 'string',
        title: 'External Patient-ID',
      },
      lastName: {
        list: false,
        order: 12,
        type: 'string',
        title: 'Last name of Patient',
      },
      firstName: {
        list: false,
        order: 13,
        type: 'string',
        title: 'First name of Patient',
      },
      birthday: {
        list: false,
        order: 14,
        type: 'date',
        title: 'Date of Birth of Patient',
      },
      sex: {
        list: false,
        order: 15,
        type: 'string',
        title: 'Sex of Patient',
      },
      elisaIgA: {
        list: true,
        order: 16,
        type: 'string',
        title: 'Result Elisa IgA',
      },
      elisaIgG: {
        list: true,
        order: 17,
        type: 'string',
        title: 'Result Elisa IgG',
      },
      elisaIgM: {
        list: true,
        order: 18,
        type: 'string',
        title: 'Result Elisa IgM',
      },
      dateOfRequest: {
        list: false,
        order: 19,
        type: 'date',
        title: 'Date of Request',
      },
      dateOfAnalysis: {
        list: false,
        order: 20,
        type: 'date',
        title: 'Date of Analysis',
      },
      cutOffTolerance: {
        list: false,
        order: 21,
        type: 'number',
        title: 'Cut-Off Tolerance value',
      },
      rShort: {
        list: true,
        order: 22,
        type: 'string',
        title: 'Short form of result',
      },
      result: {
        list: false,
        order: 23,
        type: 'string',
        title: 'Long form of result',
      },
      rjoined: {
        list: false,
        order: 24,
        type: 'string',
        title: 'Result for joined Analysis',
      },
      antigens: {
        list: false,
        order: 25,
        type: 'string',
        title: 'Antigens',
      },
      revAntigens: {
        list: false,
        order: 26,
        type: 'string',
        title: 'Content of "Revised Antigens" Field in Analysis Window',
      },
      windowsUser: {
        list: false,
        order: 27,
        type: 'string',
        title: 'User logged onto Windows System',
      },
      checkSum: {
        list: false,
        order: 28,
        type: 'number',
        title: 'Checksum for data row',
      },
      band1I: {
        list: false,
        order: 29,
        type: 'number',
        title: 'Intensity of Band 1 on Strip',
      },
      band1Co: {
        list: false,
        order: 30,
        type: 'number',
        title: 'Relative Intensity of Band 1 compared to CutOff',
      },
      band1A: {
        list: false,
        order: 31,
        type: 'number',
        title: 'Integral (Area) of Band 1 on Strip',
      },
      band1R: {
        list: false,
        order: 32,
        type: 'number',
        title: 'Relative Intensity of Band 1',
      },
      band2I: {
        list: false,
        order: 33,
        type: 'number',
        title: 'Intensity of Band 2 on Strip',
      },
      band2Co: {
        list: false,
        order: 34,
        type: 'number',
        title: 'Relative Intensity of Band 2 compared to CutOff',
      },
      band2A: {
        list: false,
        order: 35,
        type: 'number',
        title: 'Integral (Area) of Band 2 on Strip',
      },
      band2R: {
        list: false,
        order: 36,
        type: 'number',
        title: 'Relative Intensity of Band 2',
      },
      band3I: {
        list: false,
        order: 37,
        type: 'number',
        title: 'Intensity of Band N on Strip',
      },
      band3Co: {
        list: false,
        order: 38,
        type: 'number',
        title: 'Relative Intensity of Band N compared to CutOff',
      },
      band3A: {
        list: false,
        order: 39,
        type: 'number',
        title: 'Integral (Area) of Band N on Strip',
      },
      band3R: {
        list: false,
        order: 40,
        type: 'number',
        title: 'Relative Intensity of Band N',
      },
      band4I: {
        list: false,
        order: 41,
        type: 'number',
        title: 'Intensity of Band 4 on Strip',
      },
      band4Co: {
        list: false,
        order: 42,
        type: 'number',
        title: 'Relative Intensity of Band 4 compared to CutOff',
      },
      band4A: {
        list: false,
        order: 43,
        type: 'number',
        title: 'Integral (Area) of Band 4 on Strip',
      },
      band4R: {
        list: false,
        order: 44,
        type: 'number',
        title: 'Relative Intensity of Band 4',
      },
      band5I: {
        list: false,
        order: 45,
        type: 'number',
        title: 'Intensity of Band 5 on Strip',
      },
      band5Co: {
        list: false,
        order: 46,
        type: 'number',
        title: 'Relative Intensity of Band 5 compared to CutOff',
      },
      band5A: {
        list: false,
        order: 47,
        type: 'number',
        title: 'Integral (Area) of Band 5 on Strip',
      },
      band5R: {
        list: false,
        order: 48,
        type: 'number',
        title: 'Relative Intensity of Band 5',
      },
      band6I: {
        list: false,
        order: 49,
        type: 'number',
        title: 'Intensity of Band 6 on Strip',
      },
      band6Co: {
        list: false,
        order: 50,
        type: 'number',
        title: 'Relative Intensity of Band 6 compared to CutOff',
      },
      band6A: {
        list: false,
        order: 51,
        type: 'number',
        title: 'Integral (Area) of Band 6 on Strip',
      },
      band6R: {
        list: false,
        order: 52,
        type: 'number',
        title: 'Relative Intensity of Band 6',
      },
      band7I: {
        list: false,
        order: 53,
        type: 'number',
        title: 'Intensity of Band 7 on Strip',
      },
      band7Co: {
        list: false,
        order: 54,
        type: 'number',
        title: 'Relative Intensity of Band 7 compared to CutOff',
      },
      band7A: {
        list: false,
        order: 55,
        type: 'number',
        title: 'Integral (Area) of Band 7 on Strip',
      },
      band7R: {
        list: false,
        order: 56,
        type: 'number',
        title: 'Relative Intensity of Band 7',
      },
      band8I: {
        list: false,
        order: 57,
        type: 'number',
        title: 'Intensity of Band 8 on Strip',
      },
      band8Co: {
        list: false,
        order: 58,
        type: 'number',
        title: 'Relative Intensity of Band 8 compared to CutOff',
      },
      band8A: {
        list: false,
        order: 59,
        type: 'number',
        title: 'Integral (Area) of Band 8 on Strip',
      },
      band8R: {
        list: false,
        order: 60,
        type: 'number',
        title: 'Relative Intensity of Band 8',
      },
      band9I: {
        list: false,
        order: 61,
        type: 'number',
        title: 'Intensity of Band 9 on Strip',
      },
      band9Co: {
        list: false,
        order: 62,
        type: 'number',
        title: 'Relative Intensity of Band 9 compared to CutOff',
      },
      band9A: {
        list: false,
        order: 63,
        type: 'number',
        title: 'Integral (Area) of Band 9 on Strip',
      },
      band9R: {
        list: false,
        order: 64,
        type: 'number',
        title: 'Relative Intensity of Band 9',
      },
      band10I: {
        list: false,
        order: 65,
        type: 'number',
        title: 'Intensity of Band 10 on Strip',
      },
      band10Co: {
        list: false,
        order: 66,
        type: 'number',
        title: 'Relative Intensity of Band 10 compared to CutOff',
      },
      band10A: {
        list: false,
        order: 67,
        type: 'number',
        title: 'Integral (Area) of Band 10 on Strip',
      },
      band10R: {
        list: false,
        order: 68,
        type: 'number',
        title: 'Relative Intensity of Band 10',
      },
      band11I: {
        list: false,
        order: 69,
        type: 'number',
        title: 'Intensity of Band 11 on Strip',
      },
      band11Co: {
        list: false,
        order: 70,
        type: 'number',
        title: 'Relative Intensity of Band 11 compared to CutOff',
      },
      band11A: {
        list: false,
        order: 71,
        type: 'number',
        title: 'Integral (Area) of Band 11 on Strip',
      },
      band11R: {
        list: false,
        order: 72,
        type: 'number',
        title: 'Relative Intensity of Band 11',
      },
      band12I: {
        list: false,
        order: 73,
        type: 'number',
        title: 'Intensity of Band 12 on Strip',
      },
      band12Co: {
        list: false,
        order: 74,
        type: 'number',
        title: 'Relative Intensity of Band 12 compared to CutOff',
      },
      band12A: {
        list: false,
        order: 75,
        type: 'number',
        title: 'Integral (Area) of Band 12 on Strip',
      },
      band12R: {
        list: false,
        order: 76,
        type: 'number',
        title: 'Relative Intensity of Band 12',
      },
      band13I: {
        list: false,
        order: 77,
        type: 'number',
        title: 'Intensity of Band 13 on Strip',
      },
      band13Co: {
        list: false,
        order: 78,
        type: 'number',
        title: 'Relative Intensity of Band 13 compared to CutOff',
      },
      band13A: {
        list: false,
        order: 79,
        type: 'number',
        title: 'Integral (Area) of Band 13 on Strip',
      },
      band13R: {
        list: false,
        order: 80,
        type: 'number',
        title: 'Relative Intensity of Band 13',
      },
      band14I: {
        list: false,
        order: 81,
        type: 'number',
        title: 'Intensity of Band 14 on Strip',
      },
      band14Co: {
        list: false,
        order: 82,
        type: 'number',
        title: 'Relative Intensity of Band 14 compared to CutOff',
      },
      band14A: {
        list: false,
        order: 83,
        type: 'number',
        title: 'Integral (Area) of Band 14 on Strip',
      },
      band14R: {
        list: false,
        order: 84,
        type: 'number',
        title: 'Relative Intensity of Band 14',
      },
      band15I: {
        list: false,
        order: 85,
        type: 'number',
        title: 'Intensity of Band 15 on Strip',
      },
      band15Co: {
        list: false,
        order: 86,
        type: 'number',
        title: 'Relative Intensity of Band 15 compared to CutOff',
      },
      band15A: {
        list: false,
        order: 87,
        type: 'number',
        title: 'Integral (Area) of Band 15 on Strip',
      },
      band15R: {
        list: false,
        order: 88,
        type: 'number',
        title: 'Relative Intensity of Band 15',
      },
      band16I: {
        list: false,
        order: 89,
        type: 'number',
        title: 'Intensity of Band 16 on Strip',
      },
      band16Co: {
        list: false,
        order: 90,
        type: 'number',
        title: 'Relative Intensity of Band 16 compared to CutOff',
      },
      band16A: {
        list: false,
        order: 91,
        type: 'number',
        title: 'Integral (Area) of Band 16 on Strip',
      },
      band16R: {
        list: false,
        order: 92,
        type: 'number',
        title: 'Relative Intensity of Band 16',
      },
      band17I: {
        list: false,
        order: 93,
        type: 'number',
        title: 'Intensity of Band 17 on Strip',
      },
      band17Co: {
        list: false,
        order: 94,
        type: 'number',
        title: 'Relative Intensity of Band 17 compared to CutOff',
      },
      band17A: {
        list: false,
        order: 95,
        type: 'number',
        title: 'Integral (Area) of Band 17 on Strip',
      },
      band17R: {
        list: false,
        order: 96,
        type: 'number',
        title: 'Relative Intensity of Band 17',
      },
      band18I: {
        list: false,
        order: 97,
        type: 'number',
        title: 'Intensity of Band 18 on Strip',
      },
      band18Co: {
        list: false,
        order: 98,
        type: 'number',
        title: 'Relative Intensity of Band 18 compared to CutOff',
      },
      band18A: {
        list: false,
        order: 99,
        type: 'number',
        title: 'Integral (Area) of Band 18 on Strip',
      },
      band18R: {
        list: false,
        order: 100,
        type: 'number',
        title: 'Relative Intensity of Band 18',
      },
      band19I: {
        list: false,
        order: 101,
        type: 'number',
        title: 'Intensity of Band 19 on Strip',
      },
      band19Co: {
        list: false,
        order: 102,
        type: 'number',
        title: 'Relative Intensity of Band 19 compared to CutOff',
      },
      band19A: {
        list: false,
        order: 103,
        type: 'number',
        title: 'Integral (Area) of Band 19 on Strip',
      },
      band19R: {
        list: false,
        order: 104,
        type: 'number',
        title: 'Relative Intensity of Band 19',
      },
      band20I: {
        list: false,
        order: 105,
        type: 'number',
        title: 'Intensity of Band 20 on Strip',
      },
      band20Co: {
        list: false,
        order: 106,
        type: 'number',
        title: 'Relative Intensity of Band 20 compared to CutOff',
      },
      band20A: {
        list: false,
        order: 107,
        type: 'number',
        title: 'Integral (Area) of Band 20 on Strip',
      },
      band20R: {
        list: false,
        order: 108,
        type: 'number',
        title: 'Relative Intensity of Band 20',
      },
      band21I: {
        list: false,
        order: 109,
        type: 'number',
        title: 'Intensity of Band 21 on Strip',
      },
      band21Co: {
        list: false,
        order: 110,
        type: 'number',
        title: 'Relative Intensity of Band 21 compared to CutOff',
      },
      band21A: {
        list: false,
        order: 111,
        type: 'number',
        title: 'Integral (Area) of Band 21 on Strip',
      },
      band21R: {
        list: false,
        order: 112,
        type: 'number',
        title: 'Relative Intensity of Band 21',
      },
      band22I: {
        list: false,
        order: 113,
        type: 'number',
        title: 'Intensity of Band 22 on Strip',
      },
      band22Co: {
        list: false,
        order: 114,
        type: 'number',
        title: 'Relative Intensity of Band 22 compared to CutOff',
      },
      band22A: {
        list: false,
        order: 115,
        type: 'number',
        title: 'Integral (Area) of Band 22 on Strip',
      },
      band22R: {
        list: false,
        order: 116,
        type: 'number',
        title: 'Relative Intensity of Band 22',
      },
      band23I: {
        list: false,
        order: 117,
        type: 'number',
        title: 'Intensity of Band 23 on Strip',
      },
      band23Co: {
        list: false,
        order: 118,
        type: 'number',
        title: 'Relative Intensity of Band 23 compared to CutOff',
      },
      band23A: {
        list: false,
        order: 119,
        type: 'number',
        title: 'Integral (Area) of Band 23 on Strip',
      },
      band23R: {
        list: false,
        order: 120,
        type: 'number',
        title: 'Relative Intensity of Band 23',
      },
      band24I: {
        list: false,
        order: 121,
        type: 'number',
        title: 'Intensity of Band 24 on Strip',
      },
      band24Co: {
        list: false,
        order: 122,
        type: 'number',
        title: 'Relative Intensity of Band 24 compared to CutOff',
      },
      band24A: {
        list: false,
        order: 123,
        type: 'number',
        title: 'Integral (Area) of Band 24 on Strip',
      },
      band24R: {
        list: false,
        order: 124,
        type: 'number',
        title: 'Relative Intensity of Band 24',
      },
      band25I: {
        list: false,
        order: 125,
        type: 'number',
        title: 'Intensity of Band 25 on Strip',
      },
      band25Co: {
        list: false,
        order: 126,
        type: 'number',
        title: 'Relative Intensity of Band 25 compared to CutOff',
      },
      band25A: {
        list: false,
        order: 127,
        type: 'number',
        title: 'Integral (Area) of Band 25 on Strip',
      },
      band25R: {
        list: false,
        order: 128,
        type: 'number',
        title: 'Relative Intensity of Band 25',
      },
      band26I: {
        list: false,
        order: 129,
        type: 'number',
        title: 'Intensity of Band 26 on Strip',
      },
      band26Co: {
        list: false,
        order: 130,
        type: 'number',
        title: 'Relative Intensity of Band 26 compared to CutOff',
      },
      band26A: {
        list: false,
        order: 131,
        type: 'number',
        title: 'Integral (Area) of Band 26 on Strip',
      },
      band26R: {
        list: false,
        order: 132,
        type: 'number',
        title: 'Relative Intensity of Band 26',
      },
      band27I: {
        list: false,
        order: 133,
        type: 'number',
        title: 'Intensity of Band 27 on Strip',
      },
      band27Co: {
        list: false,
        order: 134,
        type: 'number',
        title: 'Relative Intensity of Band 27 compared to CutOff',
      },
      band27A: {
        list: false,
        order: 135,
        type: 'number',
        title: 'Integral (Area) of Band 27 on Strip',
      },
      band27R: {
        list: false,
        order: 136,
        type: 'number',
        title: 'Relative Intensity of Band 27',
      },
    }),
    patientDataSchema: JSON.stringify(patientDataSchema),
  }
  let { id: assayGenoTypeMTBDRplusV2Id } =
    (await knex('Assay')
      .where('externalId', 'assayGenoTypeMTBDRplusV2')
      .first('id')) || {}
  if (!assayGenoTypeMTBDRplusV2Id) {
    ;[assayGenoTypeMTBDRplusV2Id] = await knex('Assay').insert({
      ...assayGenoTypeMTBDRplusV2,
      externalId: 'assayGenoTypeMTBDRplusV2',
    })
    const [genoTypeMTBDRplusV2TestSripId] = await knex('Consumable').insert({
      name: 'GenoType MTBDRplus VER 2.0 Test Strip',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Hain Lifescience',
    })
    await knex('ConsumableAssay').insert([
      {
        assayId: assayGenoTypeMTBDRplusV2Id,
        consumableId: genoTypeMTBDRplusV2TestSripId,
        quantity: 1,
      },
    ])
  } else {
    await knex('Assay')
      .where('id', assayGenoTypeMTBDRplusV2Id)
      .update(assayGenoTypeMTBDRplusV2)
  }

  /*
  - GenoType MTBDRsl: Molecular genetic assay for detection of M. tuberculosis complex and
      its resistances to fluoro-quinolones and aminoglycosides/cyclic peptides (and ethambutol)

    - VER 1.0: Strip Consists of 22 Bands: 2 Control Bands, 1 MTBC probe band and 19 gene probe bands
     - Band 1: Conjugate Control
     - Band 2: Amplification Control
     - Band 3: MTBC
     - Band 4: gyrA Locus Control (gyrA)
     - Band 5: gyrA wild type probe 1 (gyrA WT1)
     - Band 6: gyrA wild type probe 2 (gyrA WT2)
     - Band 7: gyrA wild type probe 3 (gyrA WT3)
     - Band 8: gyrA mutation probe 1 (gyrA MUT1)
     - Band 9: gyrA mutation probe 2 (gyrA MUT2)
     - Band 10: gyrA mutation probe 3A (gyrA MUT3A)
     - Band 11: gyrA mutation probe 3B (gyrA MUT3B)
     - Band 12: gyrA mutation probe 3C (gyrA MUT3C)
     - Band 13: gyrA mutation probe 3D (gyrA MUT3D)
     - Band 14: rrs Locus Control (rrs)
     - Band 15: rrs wild type probe 1 (rrs WT1)
     - Band 16: rrs wild type probe 2 (rrs WT2)
     - Band 17: rrs mutation probe 1 (rrs MUT1)
     - Band 18: rrs mutation probe 2 (rrs MUT2)
     - Band 19: embB Locus Control (embB)
     - Band 20: embB wild type probe 1 (embB WT1)
     - Band 21: embB mutation probe 1A (embB MUT1A)
     - Band 22: embB mutation probe 1B (embB MUT1B)
  */
  const assayGenoTypeMTBDRslV1 = {
    name: 'GenoType MTBDRsl VER 1.0',
    abbreviation: 'GTMTBDRslV1',
    i18nKey: 'assayGenoTypeMTBDRslV1',
    externalId: 'assayGenoTypeMTBDRslV1',
    assayTypeId: await assayTypeToId('GenoType Test Strip'),
    deviceTypeId: deviceTypeHainGenoScanId,
    resultSourceId: await resultSourceToId('DiagnosticDevice'),
    resultCategory1Label: 'Result',
    resultDataSchema: JSON.stringify({
      no: {
        list: false,
        order: 1,
        type: 'number',
        title: 'Order-Number of Strip in Analysis',
      },
      company: {
        list: true,
        order: 2,
        type: 'string',
        title: 'Producer of Testkit',
      },
      typeOfTest: {
        list: true,
        order: 3,
        type: 'string',
        title: 'Internal name of setcard',
      },
      revision: {
        list: false,
        order: 4,
        type: 'number',
        title: 'Internal revision number of setcard',
      },
      control: {
        list: false,
        order: 5,
        type: 'string',
        title: 'Internal name of control',
      },
      igType: {
        list: true,
        order: 6,
        type: 'string',
        title: 'Internal Ig-Type',
      },
      charge: {
        list: false,
        order: 7,
        type: 'string',
        title: 'Lot-Number of Testkit',
      },
      stripType: {
        list: true,
        order: 8,
        type: 'string',
        title: 'Internal Type of Strip',
      },
      cw: {
        list: false,
        order: 9,
        type: 'number',
        title: 'Internal Connected-With-Strip number',
      },
      probeNumber: {
        list: false,
        order: 10,
        type: 'string',
        title: 'Blood-Sample-ID',
      },
      pid: {
        list: true,
        order: 11,
        type: 'string',
        title: 'External Patient-ID',
      },
      lastName: {
        list: false,
        order: 12,
        type: 'string',
        title: 'Last name of Patient',
      },
      firstName: {
        list: false,
        order: 13,
        type: 'string',
        title: 'First name of Patient',
      },
      birthday: {
        list: false,
        order: 14,
        type: 'date',
        title: 'Date of Birth of Patient',
      },
      sex: {
        list: false,
        order: 15,
        type: 'string',
        title: 'Sex of Patient',
      },
      elisaIgA: {
        list: true,
        order: 16,
        type: 'string',
        title: 'Result Elisa IgA',
      },
      elisaIgG: {
        list: true,
        order: 17,
        type: 'string',
        title: 'Result Elisa IgG',
      },
      elisaIgM: {
        list: true,
        order: 18,
        type: 'string',
        title: 'Result Elisa IgM',
      },
      dateOfRequest: {
        list: false,
        order: 19,
        type: 'date',
        title: 'Date of Request',
      },
      dateOfAnalysis: {
        list: false,
        order: 20,
        type: 'date',
        title: 'Date of Analysis',
      },
      cutOffTolerance: {
        list: false,
        order: 21,
        type: 'number',
        title: 'Cut-Off Tolerance value',
      },
      rShort: {
        list: true,
        order: 22,
        type: 'string',
        title: 'Short form of result',
      },
      result: {
        list: false,
        order: 23,
        type: 'string',
        title: 'Long form of result',
      },
      rjoined: {
        list: false,
        order: 24,
        type: 'string',
        title: 'Result for joined Analysis',
      },
      antigens: {
        list: false,
        order: 25,
        type: 'string',
        title: 'Antigens',
      },
      revAntigens: {
        list: false,
        order: 26,
        type: 'string',
        title: 'Content of "Revised Antigens" Field in Analysis Window',
      },
      windowsUser: {
        list: false,
        order: 27,
        type: 'string',
        title: 'User logged onto Windows System',
      },
      checkSum: {
        list: false,
        order: 28,
        type: 'number',
        title: 'Checksum for data row',
      },
      band1I: {
        list: false,
        order: 29,
        type: 'number',
        title: 'Intensity of Band 1 on Strip',
      },
      band1Co: {
        list: false,
        order: 30,
        type: 'number',
        title: 'Relative Intensity of Band 1 compared to CutOff',
      },
      band1A: {
        list: false,
        order: 31,
        type: 'number',
        title: 'Integral (Area) of Band 1 on Strip',
      },
      band1R: {
        list: false,
        order: 32,
        type: 'number',
        title: 'Relative Intensity of Band 1',
      },
      band2I: {
        list: false,
        order: 33,
        type: 'number',
        title: 'Intensity of Band 2 on Strip',
      },
      band2Co: {
        list: false,
        order: 34,
        type: 'number',
        title: 'Relative Intensity of Band 2 compared to CutOff',
      },
      band2A: {
        list: false,
        order: 35,
        type: 'number',
        title: 'Integral (Area) of Band 2 on Strip',
      },
      band2R: {
        list: false,
        order: 36,
        type: 'number',
        title: 'Relative Intensity of Band 2',
      },
      band3I: {
        list: false,
        order: 37,
        type: 'number',
        title: 'Intensity of Band N on Strip',
      },
      band3Co: {
        list: false,
        order: 38,
        type: 'number',
        title: 'Relative Intensity of Band N compared to CutOff',
      },
      band3A: {
        list: false,
        order: 39,
        type: 'number',
        title: 'Integral (Area) of Band N on Strip',
      },
      band3R: {
        list: false,
        order: 40,
        type: 'number',
        title: 'Relative Intensity of Band N',
      },
      band4I: {
        list: false,
        order: 41,
        type: 'number',
        title: 'Intensity of Band 4 on Strip',
      },
      band4Co: {
        list: false,
        order: 42,
        type: 'number',
        title: 'Relative Intensity of Band 4 compared to CutOff',
      },
      band4A: {
        list: false,
        order: 43,
        type: 'number',
        title: 'Integral (Area) of Band 4 on Strip',
      },
      band4R: {
        list: false,
        order: 44,
        type: 'number',
        title: 'Relative Intensity of Band 4',
      },
      band5I: {
        list: false,
        order: 45,
        type: 'number',
        title: 'Intensity of Band 5 on Strip',
      },
      band5Co: {
        list: false,
        order: 46,
        type: 'number',
        title: 'Relative Intensity of Band 5 compared to CutOff',
      },
      band5A: {
        list: false,
        order: 47,
        type: 'number',
        title: 'Integral (Area) of Band 5 on Strip',
      },
      band5R: {
        list: false,
        order: 48,
        type: 'number',
        title: 'Relative Intensity of Band 5',
      },
      band6I: {
        list: false,
        order: 49,
        type: 'number',
        title: 'Intensity of Band 6 on Strip',
      },
      band6Co: {
        list: false,
        order: 50,
        type: 'number',
        title: 'Relative Intensity of Band 6 compared to CutOff',
      },
      band6A: {
        list: false,
        order: 51,
        type: 'number',
        title: 'Integral (Area) of Band 6 on Strip',
      },
      band6R: {
        list: false,
        order: 52,
        type: 'number',
        title: 'Relative Intensity of Band 6',
      },
      band7I: {
        list: false,
        order: 53,
        type: 'number',
        title: 'Intensity of Band 7 on Strip',
      },
      band7Co: {
        list: false,
        order: 54,
        type: 'number',
        title: 'Relative Intensity of Band 7 compared to CutOff',
      },
      band7A: {
        list: false,
        order: 55,
        type: 'number',
        title: 'Integral (Area) of Band 7 on Strip',
      },
      band7R: {
        list: false,
        order: 56,
        type: 'number',
        title: 'Relative Intensity of Band 7',
      },
      band8I: {
        list: false,
        order: 57,
        type: 'number',
        title: 'Intensity of Band 8 on Strip',
      },
      band8Co: {
        list: false,
        order: 58,
        type: 'number',
        title: 'Relative Intensity of Band 8 compared to CutOff',
      },
      band8A: {
        list: false,
        order: 59,
        type: 'number',
        title: 'Integral (Area) of Band 8 on Strip',
      },
      band8R: {
        list: false,
        order: 60,
        type: 'number',
        title: 'Relative Intensity of Band 8',
      },
      band9I: {
        list: false,
        order: 61,
        type: 'number',
        title: 'Intensity of Band 9 on Strip',
      },
      band9Co: {
        list: false,
        order: 62,
        type: 'number',
        title: 'Relative Intensity of Band 9 compared to CutOff',
      },
      band9A: {
        list: false,
        order: 63,
        type: 'number',
        title: 'Integral (Area) of Band 9 on Strip',
      },
      band9R: {
        list: false,
        order: 64,
        type: 'number',
        title: 'Relative Intensity of Band 9',
      },
      band10I: {
        list: false,
        order: 65,
        type: 'number',
        title: 'Intensity of Band 10 on Strip',
      },
      band10Co: {
        list: false,
        order: 66,
        type: 'number',
        title: 'Relative Intensity of Band 10 compared to CutOff',
      },
      band10A: {
        list: false,
        order: 67,
        type: 'number',
        title: 'Integral (Area) of Band 10 on Strip',
      },
      band10R: {
        list: false,
        order: 68,
        type: 'number',
        title: 'Relative Intensity of Band 10',
      },
      band11I: {
        list: false,
        order: 69,
        type: 'number',
        title: 'Intensity of Band 11 on Strip',
      },
      band11Co: {
        list: false,
        order: 70,
        type: 'number',
        title: 'Relative Intensity of Band 11 compared to CutOff',
      },
      band11A: {
        list: false,
        order: 71,
        type: 'number',
        title: 'Integral (Area) of Band 11 on Strip',
      },
      band11R: {
        list: false,
        order: 72,
        type: 'number',
        title: 'Relative Intensity of Band 11',
      },
      band12I: {
        list: false,
        order: 73,
        type: 'number',
        title: 'Intensity of Band 12 on Strip',
      },
      band12Co: {
        list: false,
        order: 74,
        type: 'number',
        title: 'Relative Intensity of Band 12 compared to CutOff',
      },
      band12A: {
        list: false,
        order: 75,
        type: 'number',
        title: 'Integral (Area) of Band 12 on Strip',
      },
      band12R: {
        list: false,
        order: 76,
        type: 'number',
        title: 'Relative Intensity of Band 12',
      },
      band13I: {
        list: false,
        order: 77,
        type: 'number',
        title: 'Intensity of Band 13 on Strip',
      },
      band13Co: {
        list: false,
        order: 78,
        type: 'number',
        title: 'Relative Intensity of Band 13 compared to CutOff',
      },
      band13A: {
        list: false,
        order: 79,
        type: 'number',
        title: 'Integral (Area) of Band 13 on Strip',
      },
      band13R: {
        list: false,
        order: 80,
        type: 'number',
        title: 'Relative Intensity of Band 13',
      },
      band14I: {
        list: false,
        order: 81,
        type: 'number',
        title: 'Intensity of Band 14 on Strip',
      },
      band14Co: {
        list: false,
        order: 82,
        type: 'number',
        title: 'Relative Intensity of Band 14 compared to CutOff',
      },
      band14A: {
        list: false,
        order: 83,
        type: 'number',
        title: 'Integral (Area) of Band 14 on Strip',
      },
      band14R: {
        list: false,
        order: 84,
        type: 'number',
        title: 'Relative Intensity of Band 14',
      },
      band15I: {
        list: false,
        order: 85,
        type: 'number',
        title: 'Intensity of Band 15 on Strip',
      },
      band15Co: {
        list: false,
        order: 86,
        type: 'number',
        title: 'Relative Intensity of Band 15 compared to CutOff',
      },
      band15A: {
        list: false,
        order: 87,
        type: 'number',
        title: 'Integral (Area) of Band 15 on Strip',
      },
      band15R: {
        list: false,
        order: 88,
        type: 'number',
        title: 'Relative Intensity of Band 15',
      },
      band16I: {
        list: false,
        order: 89,
        type: 'number',
        title: 'Intensity of Band 16 on Strip',
      },
      band16Co: {
        list: false,
        order: 90,
        type: 'number',
        title: 'Relative Intensity of Band 16 compared to CutOff',
      },
      band16A: {
        list: false,
        order: 91,
        type: 'number',
        title: 'Integral (Area) of Band 16 on Strip',
      },
      band16R: {
        list: false,
        order: 92,
        type: 'number',
        title: 'Relative Intensity of Band 16',
      },
      band17I: {
        list: false,
        order: 93,
        type: 'number',
        title: 'Intensity of Band 17 on Strip',
      },
      band17Co: {
        list: false,
        order: 94,
        type: 'number',
        title: 'Relative Intensity of Band 17 compared to CutOff',
      },
      band17A: {
        list: false,
        order: 95,
        type: 'number',
        title: 'Integral (Area) of Band 17 on Strip',
      },
      band17R: {
        list: false,
        order: 96,
        type: 'number',
        title: 'Relative Intensity of Band 17',
      },
      band18I: {
        list: false,
        order: 97,
        type: 'number',
        title: 'Intensity of Band 18 on Strip',
      },
      band18Co: {
        list: false,
        order: 98,
        type: 'number',
        title: 'Relative Intensity of Band 18 compared to CutOff',
      },
      band18A: {
        list: false,
        order: 99,
        type: 'number',
        title: 'Integral (Area) of Band 18 on Strip',
      },
      band18R: {
        list: false,
        order: 100,
        type: 'number',
        title: 'Relative Intensity of Band 18',
      },
      band19I: {
        list: false,
        order: 101,
        type: 'number',
        title: 'Intensity of Band 19 on Strip',
      },
      band19Co: {
        list: false,
        order: 102,
        type: 'number',
        title: 'Relative Intensity of Band 19 compared to CutOff',
      },
      band19A: {
        list: false,
        order: 103,
        type: 'number',
        title: 'Integral (Area) of Band 19 on Strip',
      },
      band19R: {
        list: false,
        order: 104,
        type: 'number',
        title: 'Relative Intensity of Band 19',
      },
      band20I: {
        list: false,
        order: 105,
        type: 'number',
        title: 'Intensity of Band 20 on Strip',
      },
      band20Co: {
        list: false,
        order: 106,
        type: 'number',
        title: 'Relative Intensity of Band 20 compared to CutOff',
      },
      band20A: {
        list: false,
        order: 107,
        type: 'number',
        title: 'Integral (Area) of Band 20 on Strip',
      },
      band20R: {
        list: false,
        order: 108,
        type: 'number',
        title: 'Relative Intensity of Band 20',
      },
      band21I: {
        list: false,
        order: 109,
        type: 'number',
        title: 'Intensity of Band 21 on Strip',
      },
      band21Co: {
        list: false,
        order: 110,
        type: 'number',
        title: 'Relative Intensity of Band 21 compared to CutOff',
      },
      band21A: {
        list: false,
        order: 111,
        type: 'number',
        title: 'Integral (Area) of Band 21 on Strip',
      },
      band21R: {
        list: false,
        order: 112,
        type: 'number',
        title: 'Relative Intensity of Band 21',
      },
      band22I: {
        list: false,
        order: 113,
        type: 'number',
        title: 'Intensity of Band 22 on Strip',
      },
      band22Co: {
        list: false,
        order: 114,
        type: 'number',
        title: 'Relative Intensity of Band 22 compared to CutOff',
      },
      band22A: {
        list: false,
        order: 115,
        type: 'number',
        title: 'Integral (Area) of Band 22 on Strip',
      },
      band22R: {
        list: false,
        order: 116,
        type: 'number',
        title: 'Relative Intensity of Band 22',
      },
    }),
    patientDataSchema: JSON.stringify(patientDataSchema),
  }
  let { id: assayGenoTypeMTBDRslV1Id } =
    (await knex('Assay')
      .where('externalId', 'assayGenoTypeMTBDRslV1')
      .first('id')) || {}
  if (!assayGenoTypeMTBDRslV1Id) {
    ;[assayGenoTypeMTBDRslV1Id] = await knex('Assay').insert({
      ...assayGenoTypeMTBDRslV1,
      externalId: 'assayGenoTypeMTBDRslV1',
    })
    const [genoTypeMTBDRslV1TestSripId] = await knex('Consumable').insert({
      name: 'GenoType MTBDRsl VER 1.0 Test Strip',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Hain Lifescience',
    })
    await knex('ConsumableAssay').insert([
      {
        assayId: assayGenoTypeMTBDRslV1Id,
        consumableId: genoTypeMTBDRslV1TestSripId,
        quantity: 1,
      },
    ])
  } else {
    await knex('Assay')
      .where('id', assayGenoTypeMTBDRslV1Id)
      .update(assayGenoTypeMTBDRslV1)
  }
  /*
    - VER 2.0: Strip Consists of 27 Bands: 2 Control Bands, 1 MTBC probe band and 24 gene probe bands
     - Band 1: Conjugate Control
     - Band 2: Amplification Control
     - Band 3: MTBC
     - Band 4: gyrA Locus Control (gyrA)
     - Band 5: gyrA wild type probe 1 (gyrA WT1)
     - Band 6: gyrA wild type probe 2 (gyrA WT2)
     - Band 7: gyrA wild type probe 3 (gyrA WT3)
     - Band 8: gyrA mutation probe 1 (gyrA MUT1)
     - Band 9: gyrA mutation probe 2 (gyrA MUT2)
     - Band 10: gyrA mutation probe 3A (gyrA MUT3A)
     - Band 11: gyrA mutation probe 3B (gyrA MUT3B)
     - Band 12: gyrA mutation probe 3C (gyrA MUT3C)
     - Band 13: gyrA mutation probe 3D (gyrA MUT3D)
     - Band 14: gyrB Locus Control (gyrB)
     - Band 15: gyrB wild type probe 1 (gyrB WT1)
     - Band 16: gyrB mutation probe 1 (gyrB MUT1)
     - Band 17: gyrB mutation probe 2 (gyrB MUT2)
     - Band 18: rrs Locus Control (rrs)
     - Band 19: rrs wild type probe 1 (rrs WT1)
     - Band 20: rrs wild type probe 2 (rrs WT2)
     - Band 21: rrs mutation probe 1 (rrs MUT1)
     - Band 22: rrs mutation probe 2 (rrs MUT2)
     - Band 23: eis Locus Control (eis)
     - Band 24: eis wild type probe 1 (eis WT1)
     - Band 25: eis wild type probe 2 (eis WT2)
     - Band 26: eis wild type probe 3 (eis WT3)
     - Band 27: eis mutation probe 1 (eis MUT1)
  */
  const assayGenoTypeMTBDRslV2 = {
    name: 'GenoType MTBDRsl VER 2.0',
    abbreviation: 'GTMTBDRslV2',
    i18nKey: 'assayGenoTypeMTBDRslV2',
    externalId: 'assayGenoTypeMTBDRslV2',
    assayTypeId: await assayTypeToId('GenoType Test Strip'),
    deviceTypeId: deviceTypeHainGenoScanId,
    resultSourceId: await resultSourceToId('DiagnosticDevice'),
    resultCategory1Label: 'Result',
    resultDataSchema: JSON.stringify({
      no: {
        list: false,
        order: 1,
        type: 'number',
        title: 'Order-Number of Strip in Analysis',
      },
      company: {
        list: true,
        order: 2,
        type: 'string',
        title: 'Producer of Testkit',
      },
      typeOfTest: {
        list: true,
        order: 3,
        type: 'string',
        title: 'Internal name of setcard',
      },
      revision: {
        list: false,
        order: 4,
        type: 'number',
        title: 'Internal revision number of setcard',
      },
      control: {
        list: false,
        order: 5,
        type: 'string',
        title: 'Internal name of control',
      },
      igType: {
        list: true,
        order: 6,
        type: 'string',
        title: 'Internal Ig-Type',
      },
      charge: {
        list: false,
        order: 7,
        type: 'string',
        title: 'Lot-Number of Testkit',
      },
      stripType: {
        list: true,
        order: 8,
        type: 'string',
        title: 'Internal Type of Strip',
      },
      cw: {
        list: false,
        order: 9,
        type: 'number',
        title: 'Internal Connected-With-Strip number',
      },
      probeNumber: {
        list: false,
        order: 10,
        type: 'string',
        title: 'Blood-Sample-ID',
      },
      pid: {
        list: true,
        order: 11,
        type: 'string',
        title: 'External Patient-ID',
      },
      lastName: {
        list: false,
        order: 12,
        type: 'string',
        title: 'Last name of Patient',
      },
      firstName: {
        list: false,
        order: 13,
        type: 'string',
        title: 'First name of Patient',
      },
      birthday: {
        list: false,
        order: 14,
        type: 'date',
        title: 'Date of Birth of Patient',
      },
      sex: {
        list: false,
        order: 15,
        type: 'string',
        title: 'Sex of Patient',
      },
      elisaIgA: {
        list: true,
        order: 16,
        type: 'string',
        title: 'Result Elisa IgA',
      },
      elisaIgG: {
        list: true,
        order: 17,
        type: 'string',
        title: 'Result Elisa IgG',
      },
      elisaIgM: {
        list: true,
        order: 18,
        type: 'string',
        title: 'Result Elisa IgM',
      },
      dateOfRequest: {
        list: false,
        order: 19,
        type: 'date',
        title: 'Date of Request',
      },
      dateOfAnalysis: {
        list: false,
        order: 20,
        type: 'date',
        title: 'Date of Analysis',
      },
      cutOffTolerance: {
        list: false,
        order: 21,
        type: 'number',
        title: 'Cut-Off Tolerance value',
      },
      rShort: {
        list: true,
        order: 22,
        type: 'string',
        title: 'Short form of result',
      },
      result: {
        list: false,
        order: 23,
        type: 'string',
        title: 'Long form of result',
      },
      rjoined: {
        list: false,
        order: 24,
        type: 'string',
        title: 'Result for joined Analysis',
      },
      antigens: {
        list: false,
        order: 25,
        type: 'string',
        title: 'Antigens',
      },
      revAntigens: {
        list: false,
        order: 26,
        type: 'string',
        title: 'Content of "Revised Antigens" Field in Analysis Window',
      },
      windowsUser: {
        list: false,
        order: 27,
        type: 'string',
        title: 'User logged onto Windows System',
      },
      checkSum: {
        list: false,
        order: 28,
        type: 'number',
        title: 'Checksum for data row',
      },
      band1I: {
        list: false,
        order: 29,
        type: 'number',
        title: 'Intensity of Band 1 on Strip',
      },
      band1Co: {
        list: false,
        order: 30,
        type: 'number',
        title: 'Relative Intensity of Band 1 compared to CutOff',
      },
      band1A: {
        list: false,
        order: 31,
        type: 'number',
        title: 'Integral (Area) of Band 1 on Strip',
      },
      band1R: {
        list: false,
        order: 32,
        type: 'number',
        title: 'Relative Intensity of Band 1',
      },
      band2I: {
        list: false,
        order: 33,
        type: 'number',
        title: 'Intensity of Band 2 on Strip',
      },
      band2Co: {
        list: false,
        order: 34,
        type: 'number',
        title: 'Relative Intensity of Band 2 compared to CutOff',
      },
      band2A: {
        list: false,
        order: 35,
        type: 'number',
        title: 'Integral (Area) of Band 2 on Strip',
      },
      band2R: {
        list: false,
        order: 36,
        type: 'number',
        title: 'Relative Intensity of Band 2',
      },
      band3I: {
        list: false,
        order: 37,
        type: 'number',
        title: 'Intensity of Band N on Strip',
      },
      band3Co: {
        list: false,
        order: 38,
        type: 'number',
        title: 'Relative Intensity of Band N compared to CutOff',
      },
      band3A: {
        list: false,
        order: 39,
        type: 'number',
        title: 'Integral (Area) of Band N on Strip',
      },
      band3R: {
        list: false,
        order: 40,
        type: 'number',
        title: 'Relative Intensity of Band N',
      },
      band4I: {
        list: false,
        order: 41,
        type: 'number',
        title: 'Intensity of Band 4 on Strip',
      },
      band4Co: {
        list: false,
        order: 42,
        type: 'number',
        title: 'Relative Intensity of Band 4 compared to CutOff',
      },
      band4A: {
        list: false,
        order: 43,
        type: 'number',
        title: 'Integral (Area) of Band 4 on Strip',
      },
      band4R: {
        list: false,
        order: 44,
        type: 'number',
        title: 'Relative Intensity of Band 4',
      },
      band5I: {
        list: false,
        order: 45,
        type: 'number',
        title: 'Intensity of Band 5 on Strip',
      },
      band5Co: {
        list: false,
        order: 46,
        type: 'number',
        title: 'Relative Intensity of Band 5 compared to CutOff',
      },
      band5A: {
        list: false,
        order: 47,
        type: 'number',
        title: 'Integral (Area) of Band 5 on Strip',
      },
      band5R: {
        list: false,
        order: 48,
        type: 'number',
        title: 'Relative Intensity of Band 5',
      },
      band6I: {
        list: false,
        order: 49,
        type: 'number',
        title: 'Intensity of Band 6 on Strip',
      },
      band6Co: {
        list: false,
        order: 50,
        type: 'number',
        title: 'Relative Intensity of Band 6 compared to CutOff',
      },
      band6A: {
        list: false,
        order: 51,
        type: 'number',
        title: 'Integral (Area) of Band 6 on Strip',
      },
      band6R: {
        list: false,
        order: 52,
        type: 'number',
        title: 'Relative Intensity of Band 6',
      },
      band7I: {
        list: false,
        order: 53,
        type: 'number',
        title: 'Intensity of Band 7 on Strip',
      },
      band7Co: {
        list: false,
        order: 54,
        type: 'number',
        title: 'Relative Intensity of Band 7 compared to CutOff',
      },
      band7A: {
        list: false,
        order: 55,
        type: 'number',
        title: 'Integral (Area) of Band 7 on Strip',
      },
      band7R: {
        list: false,
        order: 56,
        type: 'number',
        title: 'Relative Intensity of Band 7',
      },
      band8I: {
        list: false,
        order: 57,
        type: 'number',
        title: 'Intensity of Band 8 on Strip',
      },
      band8Co: {
        list: false,
        order: 58,
        type: 'number',
        title: 'Relative Intensity of Band 8 compared to CutOff',
      },
      band8A: {
        list: false,
        order: 59,
        type: 'number',
        title: 'Integral (Area) of Band 8 on Strip',
      },
      band8R: {
        list: false,
        order: 60,
        type: 'number',
        title: 'Relative Intensity of Band 8',
      },
      band9I: {
        list: false,
        order: 61,
        type: 'number',
        title: 'Intensity of Band 9 on Strip',
      },
      band9Co: {
        list: false,
        order: 62,
        type: 'number',
        title: 'Relative Intensity of Band 9 compared to CutOff',
      },
      band9A: {
        list: false,
        order: 63,
        type: 'number',
        title: 'Integral (Area) of Band 9 on Strip',
      },
      band9R: {
        list: false,
        order: 64,
        type: 'number',
        title: 'Relative Intensity of Band 9',
      },
      band10I: {
        list: false,
        order: 65,
        type: 'number',
        title: 'Intensity of Band 10 on Strip',
      },
      band10Co: {
        list: false,
        order: 66,
        type: 'number',
        title: 'Relative Intensity of Band 10 compared to CutOff',
      },
      band10A: {
        list: false,
        order: 67,
        type: 'number',
        title: 'Integral (Area) of Band 10 on Strip',
      },
      band10R: {
        list: false,
        order: 68,
        type: 'number',
        title: 'Relative Intensity of Band 10',
      },
      band11I: {
        list: false,
        order: 69,
        type: 'number',
        title: 'Intensity of Band 11 on Strip',
      },
      band11Co: {
        list: false,
        order: 70,
        type: 'number',
        title: 'Relative Intensity of Band 11 compared to CutOff',
      },
      band11A: {
        list: false,
        order: 71,
        type: 'number',
        title: 'Integral (Area) of Band 11 on Strip',
      },
      band11R: {
        list: false,
        order: 72,
        type: 'number',
        title: 'Relative Intensity of Band 11',
      },
      band12I: {
        list: false,
        order: 73,
        type: 'number',
        title: 'Intensity of Band 12 on Strip',
      },
      band12Co: {
        list: false,
        order: 74,
        type: 'number',
        title: 'Relative Intensity of Band 12 compared to CutOff',
      },
      band12A: {
        list: false,
        order: 75,
        type: 'number',
        title: 'Integral (Area) of Band 12 on Strip',
      },
      band12R: {
        list: false,
        order: 76,
        type: 'number',
        title: 'Relative Intensity of Band 12',
      },
      band13I: {
        list: false,
        order: 77,
        type: 'number',
        title: 'Intensity of Band 13 on Strip',
      },
      band13Co: {
        list: false,
        order: 78,
        type: 'number',
        title: 'Relative Intensity of Band 13 compared to CutOff',
      },
      band13A: {
        list: false,
        order: 79,
        type: 'number',
        title: 'Integral (Area) of Band 13 on Strip',
      },
      band13R: {
        list: false,
        order: 80,
        type: 'number',
        title: 'Relative Intensity of Band 13',
      },
      band14I: {
        list: false,
        order: 81,
        type: 'number',
        title: 'Intensity of Band 14 on Strip',
      },
      band14Co: {
        list: false,
        order: 82,
        type: 'number',
        title: 'Relative Intensity of Band 14 compared to CutOff',
      },
      band14A: {
        list: false,
        order: 83,
        type: 'number',
        title: 'Integral (Area) of Band 14 on Strip',
      },
      band14R: {
        list: false,
        order: 84,
        type: 'number',
        title: 'Relative Intensity of Band 14',
      },
      band15I: {
        list: false,
        order: 85,
        type: 'number',
        title: 'Intensity of Band 15 on Strip',
      },
      band15Co: {
        list: false,
        order: 86,
        type: 'number',
        title: 'Relative Intensity of Band 15 compared to CutOff',
      },
      band15A: {
        list: false,
        order: 87,
        type: 'number',
        title: 'Integral (Area) of Band 15 on Strip',
      },
      band15R: {
        list: false,
        order: 88,
        type: 'number',
        title: 'Relative Intensity of Band 15',
      },
      band16I: {
        list: false,
        order: 89,
        type: 'number',
        title: 'Intensity of Band 16 on Strip',
      },
      band16Co: {
        list: false,
        order: 90,
        type: 'number',
        title: 'Relative Intensity of Band 16 compared to CutOff',
      },
      band16A: {
        list: false,
        order: 91,
        type: 'number',
        title: 'Integral (Area) of Band 16 on Strip',
      },
      band16R: {
        list: false,
        order: 92,
        type: 'number',
        title: 'Relative Intensity of Band 16',
      },
      band17I: {
        list: false,
        order: 93,
        type: 'number',
        title: 'Intensity of Band 17 on Strip',
      },
      band17Co: {
        list: false,
        order: 94,
        type: 'number',
        title: 'Relative Intensity of Band 17 compared to CutOff',
      },
      band17A: {
        list: false,
        order: 95,
        type: 'number',
        title: 'Integral (Area) of Band 17 on Strip',
      },
      band17R: {
        list: false,
        order: 96,
        type: 'number',
        title: 'Relative Intensity of Band 17',
      },
      band18I: {
        list: false,
        order: 97,
        type: 'number',
        title: 'Intensity of Band 18 on Strip',
      },
      band18Co: {
        list: false,
        order: 98,
        type: 'number',
        title: 'Relative Intensity of Band 18 compared to CutOff',
      },
      band18A: {
        list: false,
        order: 99,
        type: 'number',
        title: 'Integral (Area) of Band 18 on Strip',
      },
      band18R: {
        list: false,
        order: 100,
        type: 'number',
        title: 'Relative Intensity of Band 18',
      },
      band19I: {
        list: false,
        order: 101,
        type: 'number',
        title: 'Intensity of Band 19 on Strip',
      },
      band19Co: {
        list: false,
        order: 102,
        type: 'number',
        title: 'Relative Intensity of Band 19 compared to CutOff',
      },
      band19A: {
        list: false,
        order: 103,
        type: 'number',
        title: 'Integral (Area) of Band 19 on Strip',
      },
      band19R: {
        list: false,
        order: 104,
        type: 'number',
        title: 'Relative Intensity of Band 19',
      },
      band20I: {
        list: false,
        order: 105,
        type: 'number',
        title: 'Intensity of Band 20 on Strip',
      },
      band20Co: {
        list: false,
        order: 106,
        type: 'number',
        title: 'Relative Intensity of Band 20 compared to CutOff',
      },
      band20A: {
        list: false,
        order: 107,
        type: 'number',
        title: 'Integral (Area) of Band 20 on Strip',
      },
      band20R: {
        list: false,
        order: 108,
        type: 'number',
        title: 'Relative Intensity of Band 20',
      },
      band21I: {
        list: false,
        order: 109,
        type: 'number',
        title: 'Intensity of Band 21 on Strip',
      },
      band21Co: {
        list: false,
        order: 110,
        type: 'number',
        title: 'Relative Intensity of Band 21 compared to CutOff',
      },
      band21A: {
        list: false,
        order: 111,
        type: 'number',
        title: 'Integral (Area) of Band 21 on Strip',
      },
      band21R: {
        list: false,
        order: 112,
        type: 'number',
        title: 'Relative Intensity of Band 21',
      },
      band22I: {
        list: false,
        order: 113,
        type: 'number',
        title: 'Intensity of Band 22 on Strip',
      },
      band22Co: {
        list: false,
        order: 114,
        type: 'number',
        title: 'Relative Intensity of Band 22 compared to CutOff',
      },
      band22A: {
        list: false,
        order: 115,
        type: 'number',
        title: 'Integral (Area) of Band 22 on Strip',
      },
      band22R: {
        list: false,
        order: 116,
        type: 'number',
        title: 'Relative Intensity of Band 22',
      },
      band23I: {
        list: false,
        order: 117,
        type: 'number',
        title: 'Intensity of Band 23 on Strip',
      },
      band23Co: {
        list: false,
        order: 118,
        type: 'number',
        title: 'Relative Intensity of Band 23 compared to CutOff',
      },
      band23A: {
        list: false,
        order: 119,
        type: 'number',
        title: 'Integral (Area) of Band 23 on Strip',
      },
      band23R: {
        list: false,
        order: 120,
        type: 'number',
        title: 'Relative Intensity of Band 23',
      },
      band24I: {
        list: false,
        order: 121,
        type: 'number',
        title: 'Intensity of Band 24 on Strip',
      },
      band24Co: {
        list: false,
        order: 122,
        type: 'number',
        title: 'Relative Intensity of Band 24 compared to CutOff',
      },
      band24A: {
        list: false,
        order: 123,
        type: 'number',
        title: 'Integral (Area) of Band 24 on Strip',
      },
      band24R: {
        list: false,
        order: 124,
        type: 'number',
        title: 'Relative Intensity of Band 24',
      },
      band25I: {
        list: false,
        order: 125,
        type: 'number',
        title: 'Intensity of Band 25 on Strip',
      },
      band25Co: {
        list: false,
        order: 126,
        type: 'number',
        title: 'Relative Intensity of Band 25 compared to CutOff',
      },
      band25A: {
        list: false,
        order: 127,
        type: 'number',
        title: 'Integral (Area) of Band 25 on Strip',
      },
      band25R: {
        list: false,
        order: 128,
        type: 'number',
        title: 'Relative Intensity of Band 25',
      },
      band26I: {
        list: false,
        order: 129,
        type: 'number',
        title: 'Intensity of Band 26 on Strip',
      },
      band26Co: {
        list: false,
        order: 130,
        type: 'number',
        title: 'Relative Intensity of Band 26 compared to CutOff',
      },
      band26A: {
        list: false,
        order: 131,
        type: 'number',
        title: 'Integral (Area) of Band 26 on Strip',
      },
      band26R: {
        list: false,
        order: 132,
        type: 'number',
        title: 'Relative Intensity of Band 26',
      },
      band27I: {
        list: false,
        order: 133,
        type: 'number',
        title: 'Intensity of Band 27 on Strip',
      },
      band27Co: {
        list: false,
        order: 134,
        type: 'number',
        title: 'Relative Intensity of Band 27 compared to CutOff',
      },
      band27A: {
        list: false,
        order: 135,
        type: 'number',
        title: 'Integral (Area) of Band 27 on Strip',
      },
      band27R: {
        list: false,
        order: 136,
        type: 'number',
        title: 'Relative Intensity of Band 27',
      },
    }),
    patientDataSchema: JSON.stringify(patientDataSchema),
  }
  let { id: assayGenoTypeMTBDRslV2Id } =
    (await knex('Assay')
      .where('externalId', 'assayGenoTypeMTBDRslV2')
      .first('id')) || {}
  if (!assayGenoTypeMTBDRslV2Id) {
    ;[assayGenoTypeMTBDRslV2Id] = await knex('Assay').insert({
      ...assayGenoTypeMTBDRslV2,
      externalId: 'assayGenoTypeMTBDRslV2',
    })
    const [genoTypeMTBDRslV2TestSripId] = await knex('Consumable').insert({
      name: 'GenoType MTBDRsl VER 2.0 Test Strip',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Hain Lifescience',
    })
    await knex('ConsumableAssay').insert([
      {
        assayId: assayGenoTypeMTBDRslV2Id,
        consumableId: genoTypeMTBDRslV2TestSripId,
        quantity: 1,
      },
    ])
  } else {
    await knex('Assay')
      .where('id', assayGenoTypeMTBDRslV2Id)
      .update(assayGenoTypeMTBDRslV2)
  }

  // DeviceApproval
  const { approved: deviceApprovalApproved } = await allDeviceApprovalToId()

  // Result source
  const {
    DiagnosticDevice: resultSourceDiagnosticId,
  } = await allResultSourceToId()

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

  const geneXpertTBPatientDataSchema = JSON.stringify({
    ...patientData,
    hivStatus: {
      title: 'HIV Status',
      type: 'string',
      order: 7,
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
    patientDataSchema: geneXpertTBPatientDataSchema,
    abbreviation: 'GX MTB/Rif',
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
    patientDataSchema: geneXpertTBPatientDataSchema,
    abbreviation: 'GX MTB/ULTRA',
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
    abbreviation: 'GX HIV VL',
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
    abbreviation: 'GX HIV Qual',
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
    abbreviation: 'GX Ebola',
  })

  await knex('Assay').insert({
    name: 'GeneXpert Unknown',
    i18nKey: 'assayGeneXpertUnknown',
    externalId: 'GxUnknown',
    assayTypeId: assayTypeUnknownId,
    deviceTypeId: deviceTypeGeneXpertId,
    resultSourceId: resultSourceDiagnosticId,
    patientDataSchema: geneXpertPatientDataSchema,
    abbreviation: 'GX UK',
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
    abbreviation: 'GX HCV',
  })

  await knex('Assay').insert({
    name: 'Q HIV VL',
    i18nKey: 'assayQHivVl',
    externalId: 'QHivVL',
    assayTypeId: assayTypeHivVlId,
    deviceTypeId: deviceTypeQId,
    resultSourceId: resultSourceDiagnosticId,
    resultCategory1Label: 'HIV',
    resultCategory1i18nKey: 'resultCategoryHivVl',
    abbreviation: 'Q HIV VL',
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
    LessThan40: resultCategoryLessThan40,
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
    resultCategoryId: resultCategoryLessThan40,
    assayId: assayGeneXpertHiv1VlId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryLessThan1000,
    assayId: assayGeneXpertHiv1VlId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryMoreThan1000,
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

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNotDetectedId,
    assayId: assayGeneXpertHcvId,
  })

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

  // Result Workflow Status
  const {
    Ordered: ordered,
    Processed: processed,
    Validated: validated,
    Deliverable: deliverable,
    Acknowledged: acknowledged,
  } = await allResultWorkflowStatusToId()

  // Create geographic hierarchy
  const countries = {}
  const geographies = []
  const preventRandomSitesForCountries = ['ZANHLS', 'MZ']
  const modules = ['A', 'B', 'C', 'D']

  await Promise.all(
    _.map(geography.countries, async country => {
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
      ])
      const [countryId] = await knex('Country').insert(countryData)
      countryData.id = countryId
      countries[country.abbreviation] = countryData
      countryData.states = {}
      countryData.sites = []

      const [countryGeographyId] = await knex('Geography').insert({ countryId })
      countryData.geographyId = countryGeographyId

      const labStrings = [
        'Lab',
        'Microbiology Lab',
        'NMRL',
        'Reference Lab',
        'Clinic',
        'Hospital',
      ]

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
              geographies.push({ id: geographyId, ...geoData })

              // up to 5 of sites at each LGA
              if (
                !preventRandomSitesForCountries.includes(
                  countryData.abbreviation
                )
              ) {
                await Promise.all(
                  _.map(_.range(1, 6 - (lgaData.id % 5)), async siteNumber => {
                    const city =
                      lga.cities && lga.cities[siteNumber - 1]
                        ? lga.cities[siteNumber - 1]
                        : null
                    const siteData = {
                      partnerId: partnerOneId,
                      geographyId,
                      externalId: `${state.name}_${siteNumber}`,
                      name: city
                        ? `${city} ${
                            labStrings[_.random(0, labStrings.length - 1)]
                          }`
                        : `${lga.name} County Lab ${siteNumber}`,
                      shortName:
                        city || `${lga.name}, ${stateKey} ${siteNumber}`,
                      city: city || `${lga.name} City`,
                      street1: `${lgaData.id} Main Street`,
                      zip: `12345-${lgaData.id}`,
                      latitude: _.has(state, 'lat')
                        ? state.lat + _.random(-0.5, 0.5, true)
                        : undefined,
                      longitude: _.has(state, 'lng')
                        ? state.lng + _.random(-0.5, 0.5, true)
                        : undefined,
                      ...auditFields,
                    }
                    const [siteId] = await knex('Site').insert(siteData)
                    siteData.id = siteId
                    countryData.sites.push(siteData)
                  })
                )
              }
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
        'Admin1',
        'Admin2',
        'Admin3',
        'Admin4',
        'Admin5',
        'Admin6',
        'Admin7',
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
        const countryAbbreviation = _.includes(['Jim', 'Sam'], name)
          ? countries.NG.abbreviation
          : countries.US.abbreviation

        const geographiesId = await knex('Country as c')
          .join('Geography as g', 'c.id', 'g.countryId')
          .where({ abbreviation: countryAbbreviation })
          .select('g.id')
          .pluck('g.id')
        const [personId] = await knex('Person').insert({
          userId,
          name,
          lastPartnerId,
          lastCountryId,
          timezone,
          culture,
          geographyId: _.sample(geographiesId),
          ...auditFields,
        })
        personIds[name.toLowerCase()] = personId
      }
    )
  )

  // set admin's email/sms
  await knex('Person').where('userId', adminId).update({
    email: config.admin.email,
    cell: config.admin.cell,
  })

  await Promise.each(geography.countries, async country => {
    const countryData = countries[country.abbreviation]
    const siteDatas = countryData.sites
    if (siteDatas.length === 0) {
      return
    }

    // insert some routers with sims:\
    const routerIds = []
    await Promise.each(_.range(routerNumber), async i => {
      const siteData = siteDatas[i % siteDatas.length]
      const [routerId] = await knex('Device').insert({
        ...auditFields,
        name: `${siteData.shortName} Router`,
        shortName: `r${i}`,
        deviceTypeId: deviceTypeIdRouter,
        deviceApprovalId: deviceApprovalApproved,
        partnerId: siteData.partnerId,
        geographyId: siteData.geographyId,
        siteId: siteData.id,
        defaultReportableSiteId: i % 2 === 0 ? siteData.id : null,
        createdOn: new Date(+now - 3 * i * millisInHour),
        updatedOn: new Date(+now - i * millisInHour),
        lastPingOn: new Date(+now - (i * millisInHour) / 3),
        lastSeenOn: new Date(+now - (i * millisInHour) / 3),
      })
      routerIds.push(routerId)
    })

    // ... and 1-3 sims for some routers
    const sims = _.map(_.range(0, routerNumber, 2), i => {
      const routerId = routerIds[i]
      return {
        ...auditFields,
        deviceId: routerId,
        provider: i % 3 === 0 ? 'Glo' : 'Vodafone',
        serial: `SRL-${routerId}`,
        number: `+1 413 123 45${routerId}`,
      }
    })
    await knex('DeviceSim').insert(sims)

    // insert GeneXpert devices
    const devicesGeneXpert = []
    await Promise.each(_.range(deviceNumber), async i => {
      const siteData = siteDatas[i % siteDatas.length]
      const routerId = routerIds[i]
      const device = {
        ...auditFields,
        name: `${siteData.name} GeneXpert`,
        shortName: `GeneXpert #${i}`,
        deviceTypeId: deviceTypeGeneXpertId,
        deviceApprovalId: deviceApprovalApproved,
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
        defaultReportableSiteId: i % 2 === 0 ? siteData.id : null,
        // not all sites will have a router - we only added routers to some site
        deviceId: routerId || null,
        createdOn: subDays(now, _.random(0, 120)),
        updatedOn: new Date(+now - i * millisInHour),
        lastPingOn: new Date(+now - (i * millisInHour) / 3),
        lastSeenOn: new Date(+now - (i * millisInHour) / 3),
        hostId: _.times(8, () =>
          String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))
        ).join(''),
        serial: _.times(24, () =>
          String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))
        ).join(''),
      }

      ;[device.id] = await knex('Device').insert(device)
      devicesGeneXpert.push(device)

      // Create API Keys
      await knex('DeviceApiKey').insert({
        token: randomToken(),
        revoked: 0,
        partnerId: siteData.partnerId,
        geographyId: siteData.geographyId,
        siteId: siteData.id,
        deviceId: device.id,
        ...auditFields,
      })

      // Create Status Log
      await knex('DeviceApprovalLog').insert({
        deviceId: device.id,
        deviceApprovalId: deviceApprovalApproved,
        changedOn: auditFields.updatedOn,
        createdOn: auditFields.createdOn,
        createdBy: auditFields.createdBy,
      })

      // Create DeviceOperation
      const operationNumber = _.random(3, 11)
      await Promise.each(_.range(operationNumber), async j => {
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
    })

    // Insert Inventory Items
    await Promise.each(_.range(siteDatas.length), async i => {
      const siteData = siteDatas[i]
      // TB Cartridges
      await knex('InventoryItem').insert({
        consumableId: consumableGxTbCartridgeId,
        siteId: siteData.id,
        lotNumber: `${(i + 3) * (i + 1)}${['A', 'B'][i % 2]}-${
          (siteData.id + i) * consumableGxTbCartridgeId
        }`,
        expiresOn: new Date(
          new Date(
            now.getTime() +
              _.random(-millisInNormalYear / 2, millisInNormalYear * 2)
          ).setHours(0, 0, 0, 0)
        ),
        quantityOnHand: _.random(0, 1000),
        ...auditFields,
      })
      if (i % 5 === 0) {
        await knex('InventoryItem').insert({
          consumableId: consumableGxEbolaCartridgeId,
          siteId: siteData.id,
          lotNumber: `${(i + 7) * (i + 1)}${['Q', 'P'][i % 2]}-${
            (siteData.id + i) * consumableGxEbolaCartridgeId
          }`,
          expiresOn: new Date(
            new Date(
              now.getTime() +
                _.random(-millisInNormalYear / 2, millisInNormalYear * 2)
            ).setHours(0, 0, 0, 0)
          ),
          quantityOnHand: _.random(0, 1000),
          ...auditFields,
        })
      }
      if (i % 7 === 0) {
        await knex('InventoryItem').insert({
          consumableId: consumableGxHiv1VlCartridgeId,
          siteId: siteData.id,
          lotNumber: `${(i + 11) * (i + 1)}${['A', 'V'][i % 2]}-${
            (siteData.id + i) * consumableGxHiv1VlCartridgeId
          }`,
          expiresOn: new Date(
            new Date(
              now.getTime() +
                _.random(-millisInNormalYear / 2, millisInNormalYear * 2)
            ).setHours(0, 0, 0, 0)
          ),
          quantityOnHand: _.random(0, 1000),
          ...auditFields,
        })
      }
    })

    // only seed GeneXpert results for specific countries
    if (['Nigeria', 'United States', 'Myanmar'].indexOf(country.name) >= 0) {
      const {
        DBS: sampleTypeDBSId,
        Plasma: sampleTypePlasmaId,
      } = await allSampleTypeToId()

      // some TB samples:
      let samples = []
      await Promise.each(_.range(resultMtbNumber / 2), async i => {
        const siteData = siteDatas[i % siteDatas.length]
        const sample = {
          externalId: `SMP-TB-${i}`,
          collectedOn: calculateDateForResult(
            i,
            resultMtbNumber,
            millisInMinute
          ),
          sampleTypeId: sampleTypeDBSId,
          originSiteId: siteData.id,
        }

        ;[sample.id] = await knex('Sample').insert(sample)

        samples.push(sample)
      })

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
          category1: resultCategoryNotDetectedId,
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

      await Promise.each(_.range(resultMtbNumber), async i => {
        const device = devicesGeneXpert[i % devicesGeneXpert.length]
        const siteData = siteDatas.find(site => site.id === device.siteId)
        const sample = samples[i % samples.length]
        const randomDate = calculateDateForResult(i, resultMtbNumber, 6000)

        const rnd = _.random(0, 100)
        const rndModule = _.random(0, 3)
        const result = _.find(
          possibleResults,
          r => rnd >= r.minLikelihood && rnd <= r.maxLikelihood
        )
        resultData.resultText = result.resultText
        const [resultId] = await knex('Result').insert({
          ...auditFields,
          externalId: `UQTB-${i}`,
          assayId: assayGeneXpertMtbRifId,
          partnerId: partnerOneId,
          geographyId: siteData.geographyId,
          siteId: siteData.id,
          reportableSiteId: sample.siteOriginId || siteData.id,
          deviceId: device.id,
          longitude: -81.581222,
          latitude: 28.419348,
          resultSourceId: resultSourceDiagnosticId,
          resultTypeId: resultTypePatientId,
          sampleId: sample.id,
          sampleRunNumber: `${(i % 2) + 1}`,
          sampleGroup: `GRP-HIV-${i % 5}`,
          resultCategory1: result.category1,
          resultCategory2: result.category2,
          resultData: JSON.stringify(resultData),
          assayVersion: '4',
          startedOn: randomDate,
          endedOn: addMinutes(randomDate, 100),
          createdOn: addMinutes(randomDate, 120),
          updatedOn: addMinutes(randomDate, 180),
          consumableSerial: `${i}12`,
          consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
          consumableLot: `Lot ${i % 5}`,
          instrumentSerial: `S-1234-${i % 3}`,
          moduleName: `Module ${modules[rndModule]}`,
          moduleSerial: `M-1234-${i % 4}`,
          researchId: `R-ID-${i}`,
          patientData: JSON.stringify(
            getRandomTBPatientData(patientNumber, patients)
          ),
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

        await knex('ResultWorkflowLog').insert({
          resultId,
          resultWorkflowStatusId: ordered,
          operator: 'Marsha',
          changedOn: subHours(randomDate, 25),
          createdOn: subHours(randomDate, 26),
          createdBy: adminId,
        })

        const [lastLogId] = await knex('ResultWorkflowLog').insert({
          resultId,
          resultWorkflowStatusId:
            _.random(0, 100) < 90 ? deliverable : acknowledged,
          operator: 'John',
          changedOn: addHours(randomDate, 2),
          createdOn: addHours(randomDate, 1),
          createdBy: adminId,
        })

        await knex('Result')
          .where('id', resultId)
          .update({ resultWorkflowStatusLogId: lastLogId })

        await knex('DeviceLog').insert({
          deviceId: device.id,
          createdOn: addHours(randomDate, 1),
          senderIp: '0.0.0.0',
          source: 'seed data',
          rawMessage: JSON.stringify({
            type: {
              id: _.sample([
                deviceTypeGeneXpertId.name,
                deviceTypeQId.name,
                deviceTypeIdRouter.name,
              ]),
              site: {
                id: siteData.externalId,
              },
              result: {
                data: {
                  ...auditFields,
                  externalId: `UQTB-${i}`,
                  assayId: assayGeneXpertMtbRifId,
                  partnerId: partnerOneId,
                  geographyId: siteData.geographyId,
                  siteId: siteData.id,
                  reportableSiteId: sample.siteOriginId || siteData.id,
                  deviceId: device.id,
                  longitude: -81.581222,
                  latitude: 28.419348,
                  resultSourceId: resultSourceDiagnosticId,
                  resultTypeId: resultTypePatientId,
                  sampleId: sample.id,
                  sampleRunNumber: `${(i % 2) + 1}`,
                  sampleGroup: `GRP-HIV-${i % 5}`,
                  resultCategory1: result.category1,
                  resultCategory2: result.category2,
                  resultData,
                  assayVersion: '4',
                  startedOn: randomDate,
                  endedOn: addMinutes(randomDate, 100),
                  consumableSerial: `${i}12`,
                  consumableExpirationDate: new Date(
                    +now + 200 * i * millisInHour
                  ),
                  consumableLot: `Lot ${i % 5}`,
                  instrumentSerial: `S-1234-${i % 3}`,
                  moduleName: `Module ${modules[rndModule]}`,
                  moduleSerial: `M-1234-${i % 4}`,
                  researchId: `R-ID-${i}`,
                  patientData: JSON.stringify(
                    getRandomTBPatientData(patientNumber, patients)
                  ),
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
                },
              },
            },
          }),
          deviceConfigurationUpdated: 0,
          resultId,
        })
      })

      // some Ebola samples:
      samples = []
      await Promise.each(_.range(resultEbolaNumber / 2), async i => {
        const siteData = siteDatas[i % siteDatas.length]
        const sample = {
          externalId: `SMP-EB-${i}`,
          collectedOn: calculateDateForResult(
            i,
            resultEbolaNumber,
            millisInMinute
          ),
          sampleTypeId: sampleTypePlasmaId,
          originSiteId: siteData.id,
        }

        ;[sample.id] = await knex('Sample').insert(sample)

        samples.push(sample)
      })

      // Ebola results:
      possibleResults = [
        {
          resultText: 'Ebola GP NOT DETECTED|Ebola NP NOT DETECTED',
          category1: resultCategoryNotDetectedId,
          category2: resultCategoryNotDetectedId,
        },
        {
          resultText: 'Ebola GP DETECTED|Ebola NP NOT DETECTED',
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
        {
          resultText: 'ERROR',
          category1: resultCategoryErrorId,
          category2: null,
        },
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

      await Promise.each(_.range(resultEbolaNumber), async i => {
        const device = devicesGeneXpert[i % devicesGeneXpert.length]
        const siteData = siteDatas.find(site => site.id === device.siteId)
        const sample = samples[i % samples.length]
        const randomDate = calculateDateForResult(i, resultEbolaNumber, 6000)
        const rndModule = _.random(0, 3)

        let j = 0
        await Promise.each(possibleResults, async result => {
          j += 1
          if (_.random(5) === 0) {
            resultData.resultText = result.resultText
            const [resultId] = await knex('Result').insert({
              ...auditFields,
              externalId: `UQEB-${i}-${j}`,
              assayId: assayGeneXpertEbolaId,
              partnerId: partnerOneId,
              reportableSiteId: sample.originSiteId || siteData.id,
              geographyId: siteData.geographyId,
              siteId: siteData.id,
              deviceId: device.id,
              longitude: -81.581222,
              latitude: 28.419348,
              resultSourceId: resultSourceDiagnosticId,
              resultTypeId: resultTypePatientId,
              sampleId: sample.id,
              sampleRunNumber: `${(i % 2) + 1}`,
              resultCategory1: result.category1,
              sampleGroup: `GRP-HIV-${i % 5}`,
              resultCategory2: result.category2,
              resultData: JSON.stringify(resultData),
              assayVersion: '4',
              startedOn: randomDate,
              endedOn: addMinutes(randomDate, 100),
              createdOn: addMinutes(randomDate, 120),
              updatedOn: addMinutes(randomDate, 180),
              consumableSerial: `${i}12`,
              consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
              consumableLot: `Lot ${i % 5}`,
              instrumentSerial: `S-1234-${i % 3}`,
              moduleName: `Module ${modules[rndModule]}`,
              moduleSerial: `M-1234-${i % 4}`,
              researchId: `R-ID-${i}`,
              patientData: JSON.stringify(patients[_.random(patientNumber)]),
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

            await knex('ResultWorkflowLog').insert({
              resultId,
              resultWorkflowStatusId: ordered,
              operator: 'Bill',
              changedOn: subHours(randomDate, 34),
              createdOn: subHours(randomDate, 35),
              createdBy: adminId,
            })

            const [lastLogId] = await knex('ResultWorkflowLog').insert({
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

            await knex('Result')
              .where('id', resultId)
              .update({ resultWorkflowStatusLogId: lastLogId })
          }
        })
      })

      // some HIV VL samples:
      samples = []
      await Promise.each(_.range(resultHivVlNumber / 2), async i => {
        const siteData = siteDatas[i % siteDatas.length]
        const sample = {
          externalId: `SMP-HIV-${i}`,
          collectedOn: calculateDateForResult(
            i,
            resultHivVlNumber,
            millisInMinute
          ),
          sampleTypeId: sampleTypeDBSId,
          originSiteId: siteData.id,
        }

        ;[sample.id] = await knex('Sample').insert(sample)

        samples.push(sample)
      })

      // HIV VL Results for the GeneXpert:
      possibleResults = [
        {
          resultText: 'HIV-1 DETECTED {0} copies/mL (log {1})',
          category1: resultCategoryMoreThan1000,
          minLikelihood: 0,
          maxLikelihood: 40,
        },
        {
          resultText: 'HIV-1 DETECTED {0} copies/mL (log {1})',
          category1: resultCategoryLessThan1000,
          minLikelihood: 41,
          maxLikelihood: 70,
        },
        {
          resultText: 'HIV-1 DETECTED < 40 copies/mL (log 1.60)',
          category1: resultCategoryLessThan40,
          minLikelihood: 71,
          maxLikelihood: 80,
        },
        {
          resultText: 'HIV-1 NOT DETECTED',
          category1: resultCategoryNotDetectedId,
          minLikelihood: 81,
          maxLikelihood: 90,
        },
        {
          resultText: 'No Result',
          category1: resultCategoryNoResultId,
          minLikelihood: 91,
          maxLikelihood: 93,
        },
        {
          resultText: 'Error',
          category1: resultCategoryErrorId,
          minLikelihood: 94,
          maxLikelihood: 97,
        },
        {
          resultText: 'Invalid',
          category1: resultCategoryInvalidId,
          minLikelihood: 98,
          maxLikelihood: 100,
        },
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

      // make sure we have at least one result with these status
      const ensureResultIds = [acknowledged, validated, deliverable]
      await Promise.each(_.range(resultHivVlNumber), async i => {
        const device = devicesGeneXpert[i % devicesGeneXpert.length]
        const siteData = siteDatas.find(site => site.id === device.siteId)
        const sample = samples[i % samples.length]
        const randomDate = calculateDateForResult(i, resultHivVlNumber, 6000)

        const rnd = _.random(0, 100)
        const rndModule = _.random(0, 3)
        const result = _.find(
          possibleResults,
          r => rnd >= r.minLikelihood && rnd <= r.maxLikelihood
        )

        let copies = 0
        let log = 0
        if (result === possibleResults[0]) {
          copies = _.random(1001, 1000000)
          log = _.round(_.random(0.1, 9.9), 2)
        } else if (result === possibleResults[1]) {
          copies = _.random(50, 1000)
          log = _.round(_.random(0.1, 9.9), 2)
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
            ? deliverable
            : _.random(1) < 0.5
            ? validated
            : acknowledged

        const [resultId] = await knex('Result').insert({
          ...auditFields,
          externalId: `UQHIV-${i}`,
          assayId: assayGeneXpertHiv1VlId,
          partnerId: partnerOneId,
          geographyId: siteData.geographyId,
          reportableSiteId: sample.originSiteId || siteData.id,
          siteId: siteData.id,
          deviceId: device.id,
          longitude: -81.581222,
          latitude: 28.419348,
          resultSourceId: resultSourceDiagnosticId,
          resultTypeId: resultTypePatientId,
          sampleId: sample.id,
          sampleRunNumber: `${(i % 2) + 1}`,
          resultCategory1: result.category1,
          resultData: JSON.stringify(resultData),
          assayVersion: '4',
          startedOn: randomDate,
          endedOn: addMinutes(randomDate, 92),
          createdOn: addMinutes(randomDate, 100),
          updatedOn: addMinutes(randomDate, 120),
          consumableSerial: `${i}12`,
          consumableExpirationDate: new Date(+now + 200 * i * millisInHour),
          consumableLot: `Lot ${i % 5}`,
          instrumentSerial: `S-1234-${i % 3}`,
          moduleName: `Module ${modules[rndModule]}`,
          moduleSerial: `M-1234-${i % 4}`,
          researchId: `R-ID-${i}`,
          patientData: JSON.stringify(patients[_.random(patientNumber)]),
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

        const [lastLogId] = await knex('ResultWorkflowLog').insert({
          resultId,
          resultWorkflowStatusId: resultStatus,
          operator: 'Marsha',
          changedOn: subHours(randomDate, 2),
          createdOn: subHours(randomDate, 3),
          createdBy: adminId,
        })

        await knex('Result')
          .where('id', resultId)
          .update({ resultWorkflowStatusLogId: lastLogId })
      })

      // some HCV samples for GeneXpert
      samples = []
      await Promise.all(
        _.map(_.range(resultHcvNumber / 2), async i => {
          const sample = {
            externalId: `SMP-HCV-GX-${i}`,
            collectedOn: calculateDateForResult(
              i,
              resultHcvNumber,
              millisInMinute
            ),
            sampleTypeId: sampleTypeDBSId,
          }

          ;[sample.id] = await knex('Sample').insert(sample)

          samples.push(sample)
        })
      )

      possibleResults = [
        {
          resultText: 'HCV-1 DETECTED {0} copies/mL (log {1})',
          category1: resultCategoryDetectedId,
          minLikelihood: 0,
          maxLikelihood: 80,
        },
        {
          resultText: 'HCV-1 NOT DETECTED',
          category1: resultCategoryNotDetectedId,
          minLikelihood: 81,
          maxLikelihood: 90,
        },
        {
          resultText: 'No Result',
          category1: resultCategoryNoResultId,
          minLikelihood: 91,
          maxLikelihood: 93,
        },
        {
          resultText: 'Error',
          category1: resultCategoryErrorId,
          minLikelihood: 94,
          maxLikelihood: 97,
        },
        {
          resultText: 'Invalid',
          category1: resultCategoryInvalidId,
          minLikelihood: 98,
          maxLikelihood: 100,
        },
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

      await Promise.each(_.range(resultHcvNumber), async i => {
        const device = devicesGeneXpert[i % devicesGeneXpert.length]
        const siteData = siteDatas.find(site => site.id === device.siteId)
        const sample = samples[i % samples.length]
        const randomDate = calculateDateForResult(i, resultHcvNumber, 6000)

        const rnd = _.random(0, 100)
        const rndModule = _.random(0, 3)
        const result = _.find(
          possibleResults,
          r => rnd >= r.minLikelihood && rnd <= r.maxLikelihood
        )

        let copies = 0
        let log = 0
        if (result === possibleResults[0]) {
          copies = _.random(1001, 1000000)
          log = _.round(_.random(0.1, 9.9), 2)
        } else if (result === possibleResults[1]) {
          copies = _.random(50, 1000)
          log = _.round(_.random(0.1, 9.9), 2)
        } else {
          copies = null
          log = null
        }

        resultData.copies = copies
        resultData.log = log
        resultData.resultText = result.resultText
          .replace('{0}', copies)
          .replace('{1}', log)

        let j = 0
        await Promise.all(
          _.map(possibleResults, async result => {
            j += 1
            if (_.random(5) === 0) {
              const [resultId] = await knex('Result').insert({
                ...auditFields,
                externalId: `UQHCV-${i}-${j}`,
                assayId: assayGeneXpertHcvId,
                partnerId: partnerOneId,
                geographyId: siteData.geographyId,
                siteId: siteData.id,
                reportableSiteId: sample.originSiteId || siteData.id,
                deviceId: device.id,
                longitude: -81.581222,
                latitude: 28.419348,
                resultSourceId: resultSourceDiagnosticId,
                resultTypeId: resultTypePatientId,
                sampleId: sample.id,
                sampleRunNumber: `${(i % 2) + 1}`,
                resultCategory1: result.category1,
                sampleGroup: `GRP-HCV-${i % 5}`,
                resultCategory2: result.category2,
                resultData: JSON.stringify(resultData),
                assayVersion: '4',
                startedOn: randomDate,
                endedOn: addMinutes(randomDate, 100),
                createdOn: addMinutes(randomDate, 120),
                updatedOn: addMinutes(randomDate, 180),
                consumableSerial: `${i}12`,
                consumableExpirationDate: new Date(
                  +now + 200 * i * millisInHour
                ),
                consumableLot: `Lot ${i % 5}`,
                instrumentSerial: `S-1234-${i % 3}`,
                moduleName: `Module ${modules[rndModule]}`,
                moduleSerial: `M-1234-${i % 4}`,
                researchId: `R-ID-${i}`,
                patientData: JSON.stringify(patients[_.random(patientNumber)]),
                senderVersion: '4.7a',
                senderOperator: 'Marsha',
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

              await knex('ResultWorkflowLog').insert({
                resultId,
                resultWorkflowStatusId: ordered,
                operator: 'Bill',
                changedOn: subHours(randomDate, 34),
                createdOn: subHours(randomDate, 35),
                createdBy: adminId,
              })

              const [lastLogId] = await knex('ResultWorkflowLog').insert({
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

              await knex('Result')
                .where('id', resultId)
                .update({ resultWorkflowStatusLogId: lastLogId })
            }
          })
        )
      })
    } // end of seeding results for specific countries
  }) // end of 'await Promise.each(geography.countries'

  await upsertReports(knex)

  await upsertJobFunctionFixture(
    knex,
    jobFunctionsFixturePartnerOne,
    partnerOneId
  )
  await upsertJobFunctionFixture(
    knex,
    jobFunctionsFixturePartnerTwo,
    partnerTwoId
  )
  // Job Functions with permissions

  // crate jobs for users
  const [jobFunctionIdAdmin] = await knex('JobFunction')
    .where({ partnerId: partnerOneId, externalId: 'admin' })
    .pluck('id')
  const [jobFunctionIdManager] = await knex('JobFunction')
    .where({ partnerId: partnerOneId, externalId: 'manager' })
    .pluck('id')
  const [jobFunctionIdClinician] = await knex('JobFunction')
    .where({ partnerId: partnerOneId, externalId: 'clinician' })
    .pluck('id')
  const [jobFunctionIdPartnerTwo] = await knex('JobFunction')
    .where({ partnerId: partnerTwoId, externalId: 'labManager' })
    .pluck('id')

  const [jobIdAdmin] = await knex('Job').insert([
    {
      personId: personIds.admin,
      jobFunctionId: jobFunctionIdAdmin,
    },
    {
      personId: personIds.admin1,
      jobFunctionId: jobFunctionIdAdmin,
    },
    {
      personId: personIds.admin2,
      jobFunctionId: jobFunctionIdAdmin,
    },
    {
      personId: personIds.admin3,
      jobFunctionId: jobFunctionIdAdmin,
    },
    {
      personId: personIds.admin4,
      jobFunctionId: jobFunctionIdAdmin,
    },
    {
      personId: personIds.admin5,
      jobFunctionId: jobFunctionIdAdmin,
    },
    {
      personId: personIds.admin6,
      jobFunctionId: jobFunctionIdAdmin,
    },
  ])

  const [jobIdJason] = await knex('Job').insert({
    personId: personIds.jason,
    jobFunctionId: jobFunctionIdPartnerTwo,
  })

  const [jobIdSam] = await knex('Job').insert({
    personId: personIds.sam,
    jobFunctionId: jobFunctionIdAdmin,
  })

  const [jobIdBob] = await knex('Job').insert({
    personId: personIds.bob,
    jobFunctionId: jobFunctionIdManager,
  })
  const [jobIdFrank] = await knex('Job').insert({
    personId: personIds.frank,
    jobFunctionId: jobFunctionIdManager,
  })

  const [jobIdEd] = await knex('Job').insert({
    personId: personIds.ed,
    jobFunctionId: jobFunctionIdManager,
  })
  const [jobIdJim] = await knex('Job').insert({
    personId: personIds.jim,
    jobFunctionId: jobFunctionIdPartnerTwo,
  })
  const [jobIdNed] = await knex('Job').insert({
    personId: personIds.ned,
    jobFunctionId: jobFunctionIdClinician,
  })
  const [jobIdJon] = await knex('Job').insert({
    personId: personIds.jon,
    jobFunctionId: jobFunctionIdClinician,
  })
  const [jobIdSteve] = await knex('Job').insert({
    personId: personIds.steve,
    jobFunctionId: jobFunctionIdClinician,
  })
  const [jobIdFred] = await knex('Job').insert({
    personId: personIds.fred,
    jobFunctionId: jobFunctionIdClinician,
  })

  // Constrain jobs by context
  await knex('JobContext').insert([
    { jobId: jobIdAdmin, geographyId: countries.US.geographyId },
    { jobId: jobIdJason, geographyId: countries.US.geographyId },
    { jobId: jobIdSam, geographyId: countries.NG.geographyId },
    { jobId: jobIdEd, geographyId: countries.US.geographyId },
    { jobId: jobIdJim, geographyId: countries.US.geographyId },
    { jobId: jobIdJon, geographyId: countries.US.geographyId },
    { jobId: jobIdSteve, geographyId: countries.US.geographyId },
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
  await Promise.each(devices, async device => {
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

  const results = await knex('Result').select('id').limit(20)
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
        'externalId',
        'description',
        'descriptionI18nKey',
        'dashboards',
        'linkParams',
      ])
      widgetData.dashboards = JSON.stringify(
        widgetData.dashboards || { home: {} }
      )
      widgetData.linkParams = JSON.stringify(widgetData.linkParams || {})
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
      widgetIds[widget.externalId] = widgetId
    })
  )

  await knex('JobFunctionDashboardWidget').insert([
    { jobFunctionId: jobFunctionIdAdmin, widgetId: widgetIds.sitesTitle },
    { jobFunctionId: jobFunctionIdAdmin, widgetId: widgetIds.devicesTitle },
    { jobFunctionId: jobFunctionIdAdmin, widgetId: widgetIds.resultsTitle },
    { jobFunctionId: jobFunctionIdAdmin, widgetId: widgetIds.personTitle },
    { jobFunctionId: jobFunctionIdAdmin, widgetId: widgetIds.utilizationRate },
    { jobFunctionId: jobFunctionIdAdmin, widgetId: widgetIds.activeDevices },
    { jobFunctionId: jobFunctionIdAdmin, widgetId: widgetIds.stockouts },
    { jobFunctionId: jobFunctionIdAdmin, widgetId: widgetIds.deviceDaysActive },
    { jobFunctionId: jobFunctionIdAdmin, widgetId: widgetIds.moduleSwaps },
    { jobFunctionId: jobFunctionIdAdmin, widgetId: widgetIds.errorRate },
    { jobFunctionId: jobFunctionIdAdmin, widgetId: widgetIds.stockNotRecorded },
    { jobFunctionId: jobFunctionIdAdmin, widgetId: widgetIds.avgTimeToUpload },
    {
      jobFunctionId: jobFunctionIdAdmin,
      widgetId: widgetIds.percentageOfModulesFunctioning,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      widgetId: widgetIds.gxPositiveResultsNotified,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      widgetId: widgetIds.numberOfDevicesExperiencingServiceInterruption,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      widgetId: widgetIds.instrumentsReplaced,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      widgetId: widgetIds.dashboardWidgetTestsPerDayTitle,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      widgetId: widgetIds.dashboardWidgetValidResultsPc,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      widgetId: widgetIds.averageTimeToModuleReplacement,
    },

    { jobFunctionId: jobFunctionIdManager, widgetId: widgetIds.sitesTitle },
    { jobFunctionId: jobFunctionIdManager, widgetId: widgetIds.devicesTitle },
    { jobFunctionId: jobFunctionIdManager, widgetId: widgetIds.personTitle },
    {
      jobFunctionId: jobFunctionIdManager,
      widgetId: widgetIds.utilizationRate,
    },
    {
      jobFunctionId: jobFunctionIdManager,
      widgetId: widgetIds.instrumentsReplaced,
    },
    {
      jobFunctionId: jobFunctionIdManager,
      widgetId: widgetIds.activeDevices,
    },

    {
      jobFunctionId: jobFunctionIdManager,
      widgetId: widgetIds.errorRate,
    },
    {
      jobFunctionId: jobFunctionIdManager,
      widgetId: widgetIds.stockNotRecorded,
    },
    {
      jobFunctionId: jobFunctionIdManager,
      widgetId: widgetIds.averageTimeToModuleReplacement,
    },

    { jobFunctionId: jobFunctionIdPartnerTwo, widgetId: widgetIds.sitesTitle },
    {
      jobFunctionId: jobFunctionIdPartnerTwo,
      widgetId: widgetIds.devicesTitle,
    },
    {
      jobFunctionId: jobFunctionIdPartnerTwo,
      widgetId: widgetIds.personTitle,
    },
    {
      jobFunctionId: jobFunctionIdPartnerTwo,
      widgetId: widgetIds.utilizationRate,
    },
    {
      jobFunctionId: jobFunctionIdPartnerTwo,
      widgetId: widgetIds.instrumentsReplaced,
    },
    {
      jobFunctionId: jobFunctionIdPartnerTwo,
      widgetId: widgetIds.activeDevices,
    },

    {
      jobFunctionId: jobFunctionIdPartnerTwo,
      widgetId: widgetIds.errorRate,
    },
    {
      jobFunctionId: jobFunctionIdPartnerTwo,
      widgetId: widgetIds.stockNotRecorded,
    },
    {
      jobFunctionId: jobFunctionIdPartnerTwo,
      widgetId: widgetIds.averageTimeToModuleReplacement,
    },

    { jobFunctionId: jobFunctionIdClinician, widgetId: widgetIds.sitesTitle },
    { jobFunctionId: jobFunctionIdClinician, widgetId: widgetIds.devicesTitle },
    {
      jobFunctionId: jobFunctionIdClinician,
      widgetId: widgetIds.utilizationRate,
    },
    {
      jobFunctionId: jobFunctionIdClinician,
      widgetId: widgetIds.instrumentsReplaced,
    },
    {
      jobFunctionId: jobFunctionIdClinician,
      widgetId: widgetIds.activeDevices,
    },
    {
      jobFunctionId: jobFunctionIdClinician,
      widgetId: widgetIds.errorRate,
    },
    {
      jobFunctionId: jobFunctionIdClinician,
      widgetId: widgetIds.stockNotRecorded,
    },
    {
      jobFunctionId: jobFunctionIdClinician,
      widgetId: widgetIds.averageTimeToModuleReplacement,
    },
  ])

  const geneXpertHiv1VlFormSchema = JSON.stringify({
    fields: {
      hospitalNumber: {
        i18nLabel: 'hospitalNumber',
        control: {
          type: 'TextBox',
        },
        order: 1,
      },
      nameOfPatient: {
        i18nLabel: 'nameOfPatient',
        control: {
          type: 'TextBox',
        },
        order: 2,
      },
      surnameOfPatient: {
        i18nLabel: 'surnameOfPatient',
        control: {
          type: 'TextBox',
        },
        order: 3,
      },
      ward: {
        i18nLabel: 'ward',
        control: {
          type: 'TextBox',
        },
        order: 4,
      },
      timeSampleTaken: {
        i18nLabel: 'timeSampleTaken',
        control: {
          type: 'DateTime',
        },
        order: 5,
      },
      sampleType: {
        i18nLabel: 'sampleType',
        control: {
          type: 'DropDown',
          options: [
            {
              i18nText: 'studyOfSampleType',
              value: '1',
            },
            {
              i18nText: 'EQAOfSampleType',
              value: '2',
            },
            {
              i18nText: 'miscOfSampleType',
              value: '3',
            },
          ],
        },
        order: 6,
      },
    },
    sendChangesOn: 'change',
  })

  await knex('ResultForm').insert({
    partnerId: partnerOneId,
    assayId: assayGeneXpertHiv1VlId,
    formSchema: geneXpertHiv1VlFormSchema,
  })

  await knex('ResultForm').insert({
    partnerId: partnerOneId,
    assayId: assayGeneXpertHiv1QualId,
    formSchema: geneXpertHiv1VlFormSchema,
  })
}
