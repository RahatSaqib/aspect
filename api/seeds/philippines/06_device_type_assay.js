module.exports = require('../utils').seed(seed, __filename)

const {
  deviceTypeCategoryToId,
  assayTypeToId,
  resultSourceToId,
  resultCategoryToId,
} = require('../../src/shared/dictionary')

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
        },
        dateInoculated: {
          title: 'Date Inoculated',
          type: 'date',
        },
        inoculatedBy: {
          title: 'Inoculated by Med Tech',
          type: 'string',
        },
        idResult: {
          title: 'ID Result',
          type: 'string',
        },
        streptomycin: {
          title: 'Streptomycin',
          type: 'string',
        },
        isoniazid: {
          title: 'Isoniazid',
          type: 'string',
        },
        rifampicin: {
          title: 'Rifampicin',
          type: 'string',
        },
        ethambutol: {
          title: 'Ethambutol',
          type: 'string',
        },
        pyrazinamide: {
          title: 'Pyrazinamide',
          type: 'string',
        },
        kanamycin: {
          title: 'Kanamycin',
          type: 'string',
        },
        levofloxacin: {
          title: 'Levofloxacin',
          type: 'string',
        },
        amikacin: {
          title: 'Amikacin',
          type: 'string',
        },
        capreomycin: {
          title: 'Capreomycin',
          type: 'string',
        },
        methodUsed: {
          title: 'Method Used',
          type: 'string',
        },
        otherMethodUsed: {
          title: 'Other Method',
          type: 'string',
        },
        remarks: {
          title: 'Remarks',
          type: 'string',
        },
        dateRead: {
          title: 'Date Read',
          type: 'date',
        },
        readBy: {
          title: 'Read by Med Tech',
          type: 'string',
        },
        labTech: {
          title: 'Lab Tech',
          type: 'string',
        },
        encodedBy: {
          title: 'Encoded By',
          type: 'string',
        },
        reviewedBy: {
          title: 'Reviewed By',
          type: 'string',
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
          },
          growthUnits: {
            title: 'Growth Units',
            type: 'number',
          },
          antibioticConcentration: {
            title: 'Concentration',
            type: 'number',
          },
          antibioticConcentrationUnits: {
            title: 'Units',
            type: 'string',
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
          },
          growthUnits: {
            title: 'Growth Units',
            type: 'number',
          },
          antibioticConcentration: {
            title: 'Concentration',
            type: 'number',
          },
          antibioticConcentrationUnits: {
            title: 'Units',
            type: 'string',
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
          },
          growthUnits: {
            title: 'Growth Units',
            type: 'number',
          },
          antibioticConcentration: {
            title: 'Concentration',
            type: 'number',
          },
          antibioticConcentrationUnits: {
            title: 'Units',
            type: 'string',
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
          },
          growthUnits: {
            title: 'Growth Units',
            type: 'number',
          },
          antibioticConcentration: {
            title: 'Concentration',
            type: 'number',
          },
          antibioticConcentrationUnits: {
            title: 'Units',
            type: 'string',
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
          },
          growthUnits: {
            title: 'Growth Units',
            type: 'number',
          },
          antibioticConcentration: {
            title: 'Concentration',
            type: 'number',
          },
          antibioticConcentrationUnits: {
            title: 'Units',
            type: 'string',
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
          },
          growthUnits: {
            title: 'Growth Units',
            type: 'number',
          },
          antibioticConcentration: {
            title: 'Concentration',
            type: 'number',
          },
          antibioticConcentrationUnits: {
            title: 'Units',
            type: 'string',
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
    resultCategoryId: await resultCategoryToId('NotDetected'),
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
    resultCategoryId: await resultCategoryToId('NotDetected'),
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
          },
          medTech: {
            title: 'Med Tech',
            type: 'string',
          },
          resultStatus: {
            title: 'Result Status',
            type: 'string',
          },
          dstStatus: {
            title: 'DST Status',
            type: 'string',
          },
          datCollected1: {
            title: 'Date Collected 1',
            type: 'date',
          },
          result1: {
            title: 'Result 1',
            type: 'string',
          },
          grade1: {
            title: 'Grade 1',
            type: 'string',
          },
          datCollected2: {
            title: 'Date Collected 2',
            type: 'date',
          },
          result2: {
            title: 'Result 2',
            type: 'string',
          },
          grade2: {
            title: 'Grade 2',
            type: 'string',
          },
          finalResult: {
            title: 'Final Result',
            type: 'string',
          },
          remarks: {
            title: 'Remarks',
            type: 'string',
          },
          dateReleased: {
            title: 'Date Released',
            type: 'date',
          },
          encodedBy: {
            title: 'Encoded By',
            type: 'string',
          },
          labTech: {
            title: 'Lab Tech',
            type: 'string',
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
            title: 'Center',
            type: 'string',
          },
          lpaKit: {
            title: 'LPA Kit Used',
            type: 'string',
          },
          lpaKitOther: {
            title: 'Other Kit Used',
            type: 'string',
          },
          mtbComplex: {
            title: 'MTB Complex',
            type: 'string',
          },
          rifampicin: {
            title: 'Rifampicin (R)',
            type: 'string',
          },
          isoniazid: {
            title: 'Isoniazid (H)',
            type: 'string',
          },
          ethmabutol: {
            title: 'Ethmabutol (E)',
            type: 'string',
          },
          fluoroquinolones: {
            title: 'Fluoroquinolones (FQ)',
            type: 'string',
          },
          aminoglycoside: {
            title: 'Aminoglycoside/CP (SLI)',
            type: 'string',
          },
          remarks: {
            title: 'Remarks',
            type: 'string',
          },
          dateReleased: {
            title: 'Date Released',
            type: 'date',
          },
          performedBy: {
            title: 'Performed By',
            type: 'string',
          },
          reviewedBy: {
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
          labNo: {
            title: 'Lab No',
            type: 'string',
          },
          smearMethod: {
            title: 'Smear Method',
            type: 'string',
          },
          dateCollected1: {
            title: 'Date Collected 1',
            type: 'date',
          },
          dateCollected2: {
            title: 'Date Collected 2',
            type: 'date',
          },
          smearResult1: {
            title: 'Smear Result 1',
            type: 'string',
          },
          smearResult2: {
            title: 'Smear Result 2',
            type: 'string',
          },
          finalResult: {
            title: 'Final Result',
            type: 'string',
          },
          dateReleased: {
            title: 'Date Released',
            type: 'date',
          },
          encodedBy: {
            title: 'Encoded By',
            type: 'string',
          },
          laboratoryTechnician: {
            title: 'Laboratory Technician',
            type: 'string',
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
}
