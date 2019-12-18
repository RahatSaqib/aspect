module.exports = require('../utils').seed(seed, __filename)

const {
  deviceTypeCategoryToId,
  assayTypeToId,
  resultSourceToId,
  resultCategoryToId,
} = require('../../src/shared/dictionary')
const { updateAssayResultCategoryTreatmentEmphasize } = require('../utils')

async function seed(knex) {
  const labDeviceTypeCategoryId = await deviceTypeCategoryToId('Lab')
  const informationSystemDeviceTypeCategoryId = await deviceTypeCategoryToId(
    'Information System'
  )

  let { id: deviceTypeNTRLDatabaseId } =
    (await knex('DeviceType')
      .where('externalId', 'NTRLDatabase')
      .first('id')) || {}

  if (deviceTypeNTRLDatabaseId) return

  deviceTypeNTRLDatabaseId = await knex('DeviceType').insert({
    externalId: 'PhilippinesNtrl',
    name: 'Philippines NTRL Database',
    manufacturer: 'NTRL',
    deviceTypeCategoryId: informationSystemDeviceTypeCategoryId,
  })

  let { id: deviceTypeBDMGITId } =
    (await knex('DeviceType')
      .where('externalId', 'BDMGIT')
      .first('id')) || {}

  if (!deviceTypeBDMGITId) {
    ;[deviceTypeBDMGITId] = await knex('DeviceType').insert({
      externalId: 'BDMGIT',
      name: 'BD MGIT',
      manufacturer: 'Becton Dickinson',
      deviceTypeCategoryId: labDeviceTypeCategoryId,
    })
  }

  const patientDataSchema = JSON.stringify(
    require('./fixtures/dataSchemas/patientDataSchema.json')
  )

  const ntrlDatabaseDstResultDataSchema = {
    encodedResult: {
      list: false,
      order: 0,
      type: 'object',
      title: 'Encoded Result',
      properties: {
        testRequested: {
          title: 'Test Requested',
          type: 'string',
          order: 0,
        },
        dateInoculated: {
          title: 'Date Inoculated',
          type: 'date',
          order: 1,
        },
        inoculatedBy: {
          title: 'Inoculated by Med Tech',
          type: 'string',
          order: 2,
        },
        idResult: {
          title: 'ID Result',
          type: 'string',
          order: 3,
        },
        streptomycin: {
          title: 'Streptomycin',
          type: 'string',
          order: 4,
        },
        isoniazid: {
          title: 'Isoniazid',
          type: 'string',
          order: 5,
        },
        rifampicin: {
          title: 'Rifampicin',
          type: 'string',
          order: 6,
        },
        ethambutol: {
          title: 'Ethambutol',
          type: 'string',
          order: 7,
        },
        pyrazinamide: {
          title: 'Pyrazinamide',
          type: 'string',
          order: 8,
        },
        kanamycin: {
          title: 'Kanamycin',
          type: 'string',
          order: 9,
        },
        levofloxacin: {
          title: 'Levofloxacin',
          type: 'string',
          order: 10,
        },
        amikacin: {
          title: 'Amikacin',
          type: 'string',
          order: 11,
        },
        capreomycin: {
          title: 'Capreomycin',
          type: 'string',
          order: 12,
        },
        methodUsed: {
          title: 'Method Used',
          type: 'string',
          order: 13,
        },
        otherMethodUsed: {
          title: 'Other Method',
          type: 'string',
          order: 14,
        },
        remarks: {
          title: 'Remarks',
          type: 'string',
          order: 15,
        },
        dateRead: {
          title: 'Date Read',
          type: 'date',
          order: 16,
        },
        dateReleased: {
          title: 'Date Released',
          type: 'date',
          order: 17,
        },
        readBy: {
          title: 'Read by Med Tech',
          type: 'string',
          order: 18,
        },
        labTech: {
          title: 'Lab Tech',
          type: 'string',
          order: 19,
        },
        encodedBy: {
          title: 'Encoded By',
          type: 'string',
          order: 20,
        },
        reviewedBy: {
          title: 'Reviewed By',
          type: 'string',
          order: 21,
        },
      },
    },
  }

  const mgitResultDataSchema = {
    protocolLength: {
      list: false,
      order: 1,
      type: 'number',
      title: 'Protocol Length',
    },
    instrumentLocation: {
      list: false,
      order: 2,
      type: 'string',
      title: 'Specimen Instrument Location',
    },
    isolateNumber: {
      list: false,
      order: 3,
      type: 'number',
      title: 'Isolate Number',
    },
    senderName: {
      list: false,
      order: 4,
      type: 'string',
      title: 'Sender Name',
    },
    instrumentType: {
      list: false,
      order: 5,
      type: 'string',
      title: 'Instrument Type',
    },
    instrumentNumber: {
      list: false,
      order: 6,
      type: 'string',
      title: 'Instrument Number',
    },
    versionNumber: {
      list: false,
      order: 7,
      type: 'string',
      title: 'Version Number',
    },
    testId: {
      list: false,
      order: 8,
      type: 'string',
      title: 'Test ID',
    },
    resultTypeCode: {
      list: false,
      order: 9,
      type: 'string',
      title: 'Result Type Code',
    },
    preliminaryFinalStatus: {
      list: false,
      order: 10,
      type: 'string',
      title: 'Preliminary/Final',
    },
    dateInoculated: {
      list: false,
      order: 11,
      type: 'date',
      title: 'Date Inoculated',
    },
    dateFlaggedScanned: {
      list: false,
      order: 12,
      type: 'date',
      title: 'Date Flagged Positive/Scanned Out',
    },
    dateLjGrowth: {
      list: false,
      order: 13,
      type: 'date',
      title: 'Date LJ Growth',
    },
    ljGrowthClCount: {
      list: false,
      order: 14,
      type: 'number',
      title: 'CL Count',
    },
    ljGrowthZn: {
      list: false,
      order: 15,
      type: 'number',
      title: 'LJ Growth ZN',
    },
    mgitTurbidity: {
      list: false,
      order: 16,
      type: 'string',
      title: 'Turbidity',
    },
    ba: {
      list: false,
      order: 17,
      type: 'string',
      title: 'B/A',
    },
    actionTaken: {
      list: false,
      order: 18,
      type: 'string',
      title: 'Action Taken',
    },
    doneBy: {
      list: false,
      order: 19,
      type: 'string',
      title: 'Done By',
    },
  }

  const assayBdMgitAst = {
    name: 'BD MGIT AST',
    abbreviation: 'MGIT AST',
    i18nKey: 'assayBdMgitAst',
    externalId: 'assayBdMgitAst',
    assayTypeId: await assayTypeToId('TB AST'),
    deviceTypeId: deviceTypeBDMGITId,
    resultSourceId: await resultSourceToId('DiagnosticDevice'),
    resultCategory1Label: 'MTB',
    resultCategory1i18nKey: 'resultCategoryMTB',
    resultCategory2Label: 'Resistance',
    resultCategory2i18nKey: 'resultCategoryResistance',
    resultDataSchema: JSON.stringify({
      ...ntrlDatabaseDstResultDataSchema,
      ...mgitResultDataSchema,
      EMB: {
        list: false,
        order: 20,
        type: 'object',
        title: 'EMB',
        properties: {
          sirStatus: {
            title: 'SIR Status',
            type: 'string',
            order: 0,
          },
          growthUnits: {
            title: 'Growth Units',
            type: 'number',
            order: 1,
          },
          antibioticConcentration: {
            title: 'Concentration',
            type: 'number',
            order: 2,
          },
          antibioticConcentrationUnits: {
            title: 'Units',
            type: 'string',
            order: 3,
          },
        },
      },
      RIF: {
        list: false,
        order: 21,
        type: 'object',
        title: 'RIF',
        properties: {
          sirStatus: {
            title: 'SIR Status',
            type: 'string',
            order: 0,
          },
          growthUnits: {
            title: 'Growth Units',
            type: 'number',
            order: 1,
          },
          antibioticConcentration: {
            title: 'Concentration',
            type: 'number',
            order: 2,
          },
          antibioticConcentrationUnits: {
            title: 'Units',
            type: 'string',
            order: 3,
          },
        },
      },
      S: {
        list: false,
        order: 22,
        type: 'object',
        title: 'S',
        properties: {
          sirStatus: {
            title: 'SIR Status',
            type: 'string',
            order: 0,
          },
          growthUnits: {
            title: 'Growth Units',
            type: 'number',
            order: 1,
          },
          antibioticConcentration: {
            title: 'Concentration',
            type: 'number',
            order: 2,
          },
          antibioticConcentrationUnits: {
            title: 'Units',
            type: 'string',
            order: 3,
          },
        },
      },
      EM: {
        list: false,
        order: 23,
        type: 'object',
        title: 'EM',
        properties: {
          sirStatus: {
            title: 'SIR Status',
            type: 'string',
            order: 0,
          },
          growthUnits: {
            title: 'Growth Units',
            type: 'number',
            order: 1,
          },
          antibioticConcentration: {
            title: 'Concentration',
            type: 'number',
            order: 2,
          },
          antibioticConcentrationUnits: {
            title: 'Units',
            type: 'string',
            order: 3,
          },
        },
      },
      RA: {
        list: false,
        order: 24,
        type: 'object',
        title: 'RA',
        properties: {
          sirStatus: {
            title: 'SIR Status',
            type: 'string',
            order: 0,
          },
          growthUnits: {
            title: 'Growth Units',
            type: 'number',
            order: 1,
          },
          antibioticConcentration: {
            title: 'Concentration',
            type: 'number',
            order: 2,
          },
          antibioticConcentrationUnits: {
            title: 'Units',
            type: 'string',
            order: 3,
          },
        },
      },
      INH: {
        list: false,
        order: 25,
        type: 'object',
        title: 'INH',
        properties: {
          sirStatus: {
            title: 'SIR Status',
            type: 'string',
            order: 0,
          },
          growthUnits: {
            title: 'Growth Units',
            type: 'number',
            order: 1,
          },
          antibioticConcentration: {
            title: 'Concentration',
            type: 'number',
            order: 2,
          },
          antibioticConcentrationUnits: {
            title: 'Units',
            type: 'string',
            order: 3,
          },
        },
      },
    }),
    patientDataSchema,
  }

  let { id: assayBdMgitAstId } =
    (await knex('Assay')
      .where('externalId', 'assayBdMgitAst')
      .first('id')) || {}
  if (!assayBdMgitAstId) {
    assayBdMgitAstId = await knex('Assay').insert(assayBdMgitAst)
  } else {
    await knex('Assay')
      .where('id', assayBdMgitAstId)
      .update(assayBdMgitAst)
  }

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Detected'),
    assayId: assayBdMgitAstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('PositiveMTB'),
    assayId: assayBdMgitAstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('NotDetected'),
    assayId: assayBdMgitAstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('PositiveMOTT'),
    assayId: assayBdMgitAstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Success'),
    assayId: assayBdMgitAstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Missing'),
    assayId: assayBdMgitAstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Error'),
    assayId: assayBdMgitAstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Contaminated'),
    assayId: assayBdMgitAstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Invalid'),
    assayId: assayBdMgitAstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Unknown'),
    assayId: assayBdMgitAstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Susceptible'),
    assayId: assayBdMgitAstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Resistant'),
    assayId: assayBdMgitAstId,
  })

  const assayBdMgitGnd = {
    name: 'BD MGIT GND',
    abbreviation: 'MGIT GND',
    i18nKey: 'assayBdMgitGnd',
    externalId: 'assayBdMgitGnd',
    assayTypeId: await assayTypeToId('TB G&D'),
    deviceTypeId: deviceTypeBDMGITId,
    resultSourceId: await resultSourceToId('DiagnosticDevice'),
    resultCategory1Label: 'MTB',
    resultCategory1i18nKey: 'resultCategoryMTB',
    resultCategory2Label: 'Resistance',
    resultCategory2i18nKey: 'resultCategoryResistance',
    resultDataSchema: JSON.stringify({
      ...ntrlDatabaseDstResultDataSchema,
      ...mgitResultDataSchema,
    }),
    patientDataSchema,
  }

  let { id: assayBdMgitGndId } =
    (await knex('Assay')
      .where('externalId', 'assayBdMgitGnd')
      .first('id')) || {}
  if (!assayBdMgitGndId) {
    assayBdMgitGndId = await knex('Assay').insert(assayBdMgitGnd)
  } else {
    await knex('Assay')
      .where('id', assayBdMgitGndId)
      .update(assayBdMgitGnd)
  }

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Detected'),
    assayId: assayBdMgitGndId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('PositiveMTB'),
    assayId: assayBdMgitGndId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('NotDetected'),
    assayId: assayBdMgitGndId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('PositiveMOTT'),
    assayId: assayBdMgitGndId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Success'),
    assayId: assayBdMgitGndId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Missing'),
    assayId: assayBdMgitGndId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Error'),
    assayId: assayBdMgitGndId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Contaminated'),
    assayId: assayBdMgitGndId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Invalid'),
    assayId: assayBdMgitGndId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Unknown'),
    assayId: assayBdMgitGndId,
  })

  const assayGenericDst = {
    name: 'TB DST',
    abbreviation: 'GENERIC DST',
    i18nKey: 'assayGenericDst',
    externalId: 'assayGenericDst',
    assayTypeId: await assayTypeToId('TB AST'),
    deviceTypeId: deviceTypeNTRLDatabaseId,
    resultSourceId: await resultSourceToId('LIMS'),
    resultCategory1Label: 'MTB',
    resultCategory1i18nKey: 'resultCategoryMTB',
    resultCategory2Label: 'Resistance',
    resultCategory2i18nKey: 'resultCategoryResistance',
    resultDataSchema: JSON.stringify(ntrlDatabaseDstResultDataSchema),
    patientDataSchema,
  }

  let { id: assayGenericDstId } =
    (await knex('Assay')
      .where('externalId', 'assayGenericDst')
      .first('id')) || {}
  if (!assayGenericDstId) {
    assayGenericDstId = await knex('Assay').insert(assayGenericDst)
  } else {
    await knex('Assay')
      .where('id', assayGenericDstId)
      .update(assayGenericDst)
  }

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Detected'),
    assayId: assayGenericDstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('PositiveMTB'),
    assayId: assayGenericDstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('NotDetected'),
    assayId: assayGenericDstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('PositiveMOTT'),
    assayId: assayGenericDstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Success'),
    assayId: assayGenericDstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Missing'),
    assayId: assayGenericDstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Error'),
    assayId: assayGenericDstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Contaminated'),
    assayId: assayGenericDstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Invalid'),
    assayId: assayGenericDstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Unknown'),
    assayId: assayGenericDstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Susceptible'),
    assayId: assayGenericDstId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Resistant'),
    assayId: assayGenericDstId,
  })

  const assayCulture = {
    name: 'Culture',
    abbreviation: 'CULTURE',
    i18nKey: 'assayCulture',
    externalId: 'assayCulture',
    assayTypeId: await assayTypeToId('TB G&D'),
    deviceTypeId: deviceTypeNTRLDatabaseId,
    resultSourceId: await resultSourceToId('LIMS'),
    resultCategory1Label: 'Culture Result',
    resultCategory1i18nKey: 'resultCategoryCultureResult',
    resultCategory2Label: 'Final Result',
    resultCategory2i18nKey: 'resultCategoryFinalResult',
    resultDataSchema: JSON.stringify({
      encodedResult: {
        list: false,
        order: 0,
        type: 'object',
        title: 'Encoded Result',
        properties: {
          dateInoculated: {
            title: 'Date Inoculated',
            type: 'date',
            order: 0,
          },
          medTech: {
            title: 'Med Tech',
            type: 'string',
            order: 1,
          },
          resultStatus: {
            title: 'Result Status',
            type: 'string',
            order: 2,
          },
          dstStatus: {
            title: 'DST Status',
            type: 'string',
            order: 3,
          },
          result1: {
            title: 'Result 1',
            type: 'string',
            order: 4,
          },
          grade1: {
            title: 'Grade 1',
            type: 'string',
            order: 5,
          },
          result2: {
            title: 'Result 2',
            type: 'string',
            order: 6,
          },
          grade2: {
            title: 'Grade 2',
            type: 'string',
            order: 7,
          },
          finalResult: {
            title: 'Final Result',
            type: 'string',
            order: 8,
          },
          remarks: {
            title: 'Remarks',
            type: 'string',
            order: 9,
          },
          dateReleased: {
            title: 'Date Released',
            type: 'date',
            order: 10,
          },
          encodedBy: {
            title: 'Encoded By',
            type: 'string',
            order: 11,
          },
          labTech: {
            title: 'Lab Tech',
            type: 'string',
            order: 12,
          },
        },
      },
    }),
    patientDataSchema,
  }

  let { id: assayCultureId } =
    (await knex('Assay')
      .where('externalId', 'assayCulture')
      .first('id')) || {}
  if (!assayCultureId) {
    assayCultureId = await knex('Assay').insert(assayCulture)
  } else {
    await knex('Assay')
      .where('id', assayCultureId)
      .update(assayCulture)
  }

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('PositiveMTB'),
    assayId: assayCultureId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('NotDetected'),
    assayId: assayCultureId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('PositiveMOTT'),
    assayId: assayCultureId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Contaminated'),
    assayId: assayCultureId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Invalid'),
    assayId: assayCultureId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Missing'),
    assayId: assayCultureId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Unknown'),
    assayId: assayCultureId,
  })

  const assayLpa = {
    name: 'LPA',
    abbreviation: 'LPA',
    i18nKey: 'assayLPA',
    externalId: 'assayLPA',
    assayTypeId: await assayTypeToId('GenoType Test Strip'),
    deviceTypeId: deviceTypeNTRLDatabaseId,
    resultSourceId: await resultSourceToId('LIMS'),
    resultCategory1Label: 'MTB',
    resultCategory1i18nKey: 'resultCategoryMTB',
    resultCategory2Label: 'Resistance',
    resultCategory2i18nKey: 'resultCategoryResistance',
    resultDataSchema: JSON.stringify({
      encodedResult: {
        list: false,
        order: 0,
        type: 'object',
        title: 'Encoded Result',
        properties: {
          center: {
            order: 0,
            title: 'Center',
            type: 'string',
          },
          lpaKit: {
            order: 1,
            title: 'LPA Kit Used',
            type: 'string',
          },
          lpaKitOther: {
            order: 2,
            title: 'Other Kit Used',
            type: 'string',
          },
          mtbComplex: {
            order: 3,
            title: 'MTB Complex',
            type: 'string',
          },
          rifampicin: {
            order: 4,
            title: 'Rifampicin (R)',
            type: 'string',
          },
          isoniazid: {
            order: 5,
            title: 'Isoniazid (H)',
            type: 'string',
          },
          ethambutol: {
            order: 6,
            title: 'Ethambutol (E)',
            type: 'string',
          },
          fluoroquinolones: {
            order: 7,
            title: 'Fluoroquinolones (FQ)',
            type: 'string',
          },
          aminoglycoside: {
            order: 8,
            title: 'Aminoglycoside/CP (SLI)',
            type: 'string',
          },
          remarks: {
            order: 9,
            title: 'Remarks',
            type: 'string',
          },
          dateReleased: {
            order: 10,
            title: 'Date Released',
            type: 'date',
          },
          performedBy: {
            order: 11,
            title: 'Performed By',
            type: 'string',
          },
          reviewedBy: {
            order: 12,
            title: 'Reviewed By',
            type: 'string',
          },
        },
      },
    }),
    patientDataSchema,
  }

  let { id: assayLpaId } =
    (await knex('Assay')
      .where('externalId', 'assayLpa')
      .first('id')) || {}
  if (!assayLpaId) {
    assayLpaId = await knex('Assay').insert(assayLpa)
  } else {
    await knex('Assay')
      .where('id', assayLpaId)
      .update(assayLpa)
  }

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('PositiveMTB'),
    assayId: assayLpaId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('NotDetected'),
    assayId: assayLpaId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Resistant'),
    assayId: assayLpaId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Susceptible'),
    assayId: assayLpaId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Invalid'),
    assayId: assayLpaId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Missing'),
    assayId: assayLpaId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Unknown'),
    assayId: assayLpaId,
  })

  const assaySmear = {
    name: 'Smear',
    abbreviation: 'SMEAR',
    i18nKey: 'assaySmear',
    externalId: 'assaySmear',
    assayTypeId: await assayTypeToId('Microscopy'),
    deviceTypeId: deviceTypeNTRLDatabaseId,
    resultSourceId: await resultSourceToId('LIMS'),
    resultCategory1Label: 'Smear Result',
    resultCategory1i18nKey: 'resultCategorySmearResult',
    resultCategory2Label: 'Final Result',
    resultCategory2i18nKey: 'resultCategoryFinalResult',
    resultDataSchema: JSON.stringify({
      encodedResult: {
        list: false,
        order: 0,
        type: 'object',
        title: 'Encoded Result',
        properties: {
          smearMethod: {
            title: 'Smear Method',
            type: 'string',
            order: 0,
          },
          smearResult1: {
            title: 'Smear Result 1',
            type: 'string',
            order: 1,
          },
          smearResult2: {
            title: 'Smear Result 2',
            type: 'string',
            order: 2,
          },
          finalResult: {
            title: 'Final Result',
            type: 'string',
            order: 3,
          },
          dateReleased: {
            title: 'Date Released',
            type: 'date',
            order: 4,
          },
          encodedBy: {
            title: 'Encoded By',
            type: 'string',
            order: 5,
          },
          laboratoryTechnician: {
            title: 'Laboratory Technician',
            type: 'string',
            order: 6,
          },
        },
      },
    }),
    patientDataSchema,
  }

  let { id: assaySmearId } =
    (await knex('Assay')
      .where('externalId', 'assaySmear')
      .first('id')) || {}
  if (!assaySmearId) {
    assaySmearId = await knex('Assay').insert(assaySmear)
  } else {
    await knex('Assay')
      .where('id', assaySmearId)
      .update(assaySmear)
  }

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Detected'),
    assayId: assaySmearId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Positive1'),
    assayId: assaySmearId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Positive2'),
    assayId: assaySmearId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Positive3'),
    assayId: assaySmearId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('NotDetected'),
    assayId: assaySmearId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Invalid'),
    assayId: assaySmearId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Missing'),
    assayId: assaySmearId,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: await resultCategoryToId('Unknown'),
    assayId: assaySmearId,
  })

  await updateAssayResultCategoryTreatmentEmphasize(knex)
}
