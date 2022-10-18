const { upsertMGITDeviceTypeAndAssays } = require('../../commonTB')
const { deviceTypeCategoryToId, assayTypeToId, resultSourceToId } = require('../../../src/shared/dictionary')
const patientDataSchema = require('../../fixtures/MGITPatientDataSchema')
const AssayBdMgitAstResultDataSchema = require('../../fixtures/AssayBdMgitAstResultDataSchema.json')
const AssayBdMgitGndResultDataSchema = require('../../fixtures/AssayBdMgitGndResultDataSchema.json')
const upsertConsumables = require('../../common/upsert_consumables')

async function upsertMGITDevices(knex) {
  const labDeviceTypeCategoryId = await deviceTypeCategoryToId('Lab')
  const informationSystemDeviceTypeCategoryId = await deviceTypeCategoryToId('Information System')

  // MGIT
  const assayBdMgitAstResultDataSchema = {
    ...AssayBdMgitAstResultDataSchema,
    dateLjGrowth: {
      list: false,
      order: 18,
      type: 'date',
      title: 'Date LJ Growth',
    },
    ljGrowthClCount: {
      list: false,
      order: 19,
      type: 'number',
      title: 'CL Count',
    },
    ljGrowthZn: {
      list: false,
      order: 20,
      type: 'number',
      title: 'LJ Growth ZN',
    },
    mgitTurbidity: {
      list: false,
      order: 21,
      type: 'string',
      title: 'Turbidity',
    },
    ba: {
      list: false,
      order: 22,
      type: 'string',
      title: 'B/A',
    },
    actionTaken: {
      list: false,
      order: 23,
      type: 'string',
      title: 'Action Taken',
    },
    doneBy: {
      list: false,
      order: 24,
      type: 'string',
      title: 'Done By',
    },
  }
  const assayBdMgitGndResultDataSchema = {
    ...AssayBdMgitGndResultDataSchema,
    dateInoculated: {
      list: false,
      order: 12,
      type: 'date',
      title: 'Date Inoculated',
    },
    dateFlaggedScanned: {
      list: false,
      order: 13,
      type: 'date',
      title: 'Date Flagged Positive/Scanned Out',
    },
    dateLjGrowth: {
      list: false,
      order: 14,
      type: 'date',
      title: 'Date LJ Growth',
    },
    ljGrowthClCount: {
      list: false,
      order: 15,
      type: 'number',
      title: 'CL Count',
    },
    ljGrowthZn: {
      list: false,
      order: 16,
      type: 'number',
      title: 'LJ Growth ZN',
    },
    mgitTurbidity: {
      list: false,
      order: 17,
      type: 'string',
      title: 'Turbidity',
    },
    ba: {
      list: false,
      order: 18,
      type: 'string',
      title: 'B/A',
    },
    actionTaken: {
      list: false,
      order: 19,
      type: 'string',
      title: 'Action Taken',
    },
    doneBy: {
      list: false,
      order: 20,
      type: 'string',
      title: 'Done By',
    },
  }
  await upsertMGITDeviceTypeAndAssays(
    knex,
    patientDataSchema,
    assayBdMgitGndResultDataSchema,
    assayBdMgitAstResultDataSchema
  )

  // Senaite
  const { id: deviceTypeSenaiteLimsId } =
    (await knex('DeviceType').where('externalId', 'SenaiteLims').first('id')) || {}
  const existingDeviceType = await knex('DeviceType')
    .where({
      externalId: 'SenaiteLims',
    })
    .first('id')
  if (existingDeviceType) return

  if (!deviceTypeSenaiteLimsId) {
    await knex('DeviceType').insert({
      externalId: 'SenaiteLims',
      name: 'Senaite LIMS',
      manufacturer: 'Senaite',
      deviceTypeCategoryId: informationSystemDeviceTypeCategoryId,
    })
  }

  // Hain GenoScan
  let { id: deviceTypeHainGenoScanId } =
    (await knex('DeviceType').where('externalId', 'HainGenoScan').first('id')) || {}
  if (!deviceTypeHainGenoScanId) {
    ;[deviceTypeHainGenoScanId] = await knex('DeviceType').insert({
      externalId: 'HainGenoScan',
      name: 'Hain GenoScan',
      manufacturer: 'Hain Lifescience',
      deviceTypeCategoryId: labDeviceTypeCategoryId,
    })
  }

  // TODO: ZIMBABWE Determine the standard set of consumables used in MGIT and GenoScan tests
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

  let { id: assayGenoTypeMTBCV1Id } = (await knex('Assay').where('externalId', 'assayGenoTypeMTBCV1').first('id')) || {}
  if (!assayGenoTypeMTBCV1Id) {
    ;[assayGenoTypeMTBCV1Id] = await knex('Assay').insert({
      ...assayGenoTypeMTBCV1,
      externalId: 'assayGenoTypeMTBCV1',
    })

    await upsertConsumables(knex, true, ['assayGenoTypeMTBCV1'])
  } else {
    await knex('Assay').where('id', assayGenoTypeMTBCV1Id).update(assayGenoTypeMTBCV1)
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
    (await knex('Assay').where('externalId', 'assayGenoTypeMTBDRplusV2').first('id')) || {}
  if (!assayGenoTypeMTBDRplusV2Id) {
    ;[assayGenoTypeMTBDRplusV2Id] = await knex('Assay').insert({
      ...assayGenoTypeMTBDRplusV2,
      externalId: 'assayGenoTypeMTBDRplusV2',
    })
    await upsertConsumables(knex, true, ['assayGenoTypeMTBDRplusV2'])
  } else {
    await knex('Assay').where('id', assayGenoTypeMTBDRplusV2Id).update(assayGenoTypeMTBDRplusV2)
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
    (await knex('Assay').where('externalId', 'assayGenoTypeMTBDRslV1').first('id')) || {}
  if (!assayGenoTypeMTBDRslV1Id) {
    ;[assayGenoTypeMTBDRslV1Id] = await knex('Assay').insert({
      ...assayGenoTypeMTBDRslV1,
      externalId: 'assayGenoTypeMTBDRslV1',
    })
    await upsertConsumables(knex, true, ['assayGenoTypeMTBDRslV1'])
  } else {
    await knex('Assay').where('id', assayGenoTypeMTBDRslV1Id).update(assayGenoTypeMTBDRslV1)
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
    (await knex('Assay').where('externalId', 'assayGenoTypeMTBDRslV2').first('id')) || {}
  if (!assayGenoTypeMTBDRslV2Id) {
    ;[assayGenoTypeMTBDRslV2Id] = await knex('Assay').insert({
      ...assayGenoTypeMTBDRslV2,
      externalId: 'assayGenoTypeMTBDRslV2',
    })
    await upsertConsumables(knex, true, ['assayGenoTypeMTBDRslV2'])
  } else {
    await knex('Assay').where('id', assayGenoTypeMTBDRslV2Id).update(assayGenoTypeMTBDRslV2)
  }
}
module.exports = upsertMGITDevices
