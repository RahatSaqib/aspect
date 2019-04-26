module.exports = require('../utils').seed(seed)

const {
  deviceTypeCategoryToId,
  assayTypeToId,
  resultSourceToId,
  unitToId,
} = require('../../src/shared/dictionary')

async function seed(knex) {
  const labDeviceTypeCategoryId = await deviceTypeCategoryToId('Lab')

  const [deviceTypeBDMGITId] = await knex('DeviceType').insert({
    externalId: 'BDMGIT',
    name: 'BD MGIT',
    manufacturer: 'Becton Dickinson',
    deviceTypeCategoryId: labDeviceTypeCategoryId,
  })

  const [deviceTypeHainGenoScanId] = await knex('DeviceType').insert({
    externalId: 'HainGenoScan',
    name: 'Hain GenoScan',
    manufacturer: 'Hain Lifescience',
    deviceTypeCategoryId: labDeviceTypeCategoryId,
  })

  const patientDataSchema = JSON.stringify({
    name: {
      title: 'NAME OF PATIENT',
      type: 'string',
      order: 0,
    },
    age: {
      title: 'AGE',
      type: 'number',
      order: 1,
    },
    gender: {
      title: 'SEX',
      type: 'string',
      order: 2,
    },
    dateOfBirth: {
      title: 'DATE OF BIRTH',
      type: 'string',
      order: 3,
    },
    state: {
      title: 'PROVINCE',
      type: 'string',
      order: 4,
    },
    site: {
      title: 'SITE',
      type: 'string',
      order: 5,
    },
    focalPerson: {
      title: 'FOCAL PERSON',
      type: 'string',
      order: 6,
    },
    contactDetails: {
      title: 'CONTACT DETAILS',
      type: 'string',
      order: 7,
    },
    xpertMtbRifResult: {
      title: 'XPERT MTB RIF RESULT',
      type: 'string',
      order: 8,
    },
    dateStartedOnTreatment: {
      title: 'DATE STARTED ON TX',
      type: 'string',
      order: 9,
    },
    baselineCulture: {
      title: 'BASELINE CULTURE',
      type: 'string',
      order: 10,
    },
    lpaFl: {
      title: 'LPA FL',
      type: 'string',
      order: 5,
    },
    lpaSl: {
      title: 'LPA SL',
      type: 'string',
      order: 11,
    },
    mgitSire: {
      title: 'MGIT SIRE',
      type: 'string',
      order: 12,
    },
  })

  await knex('Assay').insert({
    name: 'BD MGIT First Line DST',
    abbreviation: 'MGIT 1ST DST',
    i18nKey: 'assayBdMgitFirstLineDst',
    externalId: 'assayBdMgitFirstLineDst',
    assayTypeId: await assayTypeToId('TB AST'),
    deviceTypeId: deviceTypeBDMGITId,
    resultSourceId: await resultSourceToId('DiagnosticDevice'),
    resultCategory1Label: 'Result',
    resultDataSchema: JSON.stringify({
      specimenNumber: {
        list: true,
        order: 1,
        type: 'string',
        title: 'Specimen Number',
      },
      dateInoculated: {
        list: false,
        order: 2,
        type: 'date',
        title: 'Date Inoculated',
      },
      dateFlaggedScanned: {
        list: false,
        order: 3,
        type: 'date',
        title: 'Date Flagged Positive/Scanned Out',
      },
      dateLjGrowth: {
        list: false,
        order: 4,
        type: 'date',
        title: 'Date LJ Growth',
      },
      ljGrowthClCOunt: {
        list: false,
        order: 5,
        type: 'number',
        title: 'CL Count',
      },
      ljGrowthZn: {
        list: false,
        order: 6,
        type: 'number',
        title: 'LJ Growth ZN',
      },
      mgitTurbidity: {
        list: false,
        order: 7,
        type: 'string',
        title: 'Turbidity',
      },
      mgitZn: {
        list: false,
        order: 8,
        type: 'string',
        title: 'MGIT ZN',
      },
      ba: {
        list: false,
        order: 9,
        type: 'string',
        title: 'B/A',
      },
      id: {
        list: true,
        order: 10,
        type: 'string',
        title: 'ID',
      },
      actionTaken: {
        list: false,
        order: 11,
        type: 'string',
        title: 'Action Taken',
      },
      doneBy: {
        list: false,
        order: 11,
        type: 'string',
        title: 'Done By',
      },
    }),
    patientDataSchema,
  })

  const [hainGenoScanAssayId] = await knex('Assay').insert({
    name: 'Hain GenoScan',
    abbreviation: 'GenoScan',
    i18nKey: 'assayHainGenoScan',
    externalId: 'assayHainGenoScan',
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
        title: 'Operator',
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
      // TODO: ZIMBABWE Find out which strips are available and create assays for each type of strip with the corect number of bands
      bandNI: {
        list: false,
        order: 37,
        type: 'number',
        title: 'Intensity of Band N on Strip',
      },
      bandNCo: {
        list: false,
        order: 38,
        type: 'number',
        title: 'Relative Intensity of Band N compared to CutOff',
      },
      bandNA: {
        list: false,
        order: 39,
        type: 'number',
        title: 'Integral (Area) of Band N on Strip',
      },
      bandNR: {
        list: false,
        order: 40,
        type: 'number',
        title: 'Relative Intensity of Band N',
      },
    }),
    patientDataSchema,
  })

  // TODO: ZIMBABWE Determine the standard set of consumables used in MGIT and GenoScan tests
  const piece = await unitToId('Piece')
  const [genoTypeTestSripId] = await knex('Consumable').insert({
    name: 'GenoType Test Strip',
    unit: piece,
    canExpire: 1,
    manufacturer: 'Hain Lifescience',
  })

  await knex('ConsumableAssay').insert([
    {
      assayId: hainGenoScanAssayId,
      consumableId: genoTypeTestSripId,
      quantity: 1,
    },
  ])
}
