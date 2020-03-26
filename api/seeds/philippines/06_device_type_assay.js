module.exports = require('../utils').seed(seed, __filename)

const {
  deviceTypeCategoryToId,
  assayTypeToId,
  resultSourceToId,
  resultCategoryToId,
} = require('../../src/shared/dictionary')
const AssayBdMgitAstResultDataSchema = require('../fixtures/AssayBdMgitAstResultDataSchema.json')
const AssayBdMgitGndResultDataSchema = require('../fixtures/AssayBdMgitGnd.json')
const { updateAssayResultCategoryTreatmentEmphasize } = require('../utils')
const { updateMGITAssays, updateCultureAssays } = require('../commonTB')

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

  const patientDataSchema = require('./fixtures/dataSchemas/patientDataSchema.json')

  const ntrlDatabaseCultureResultDataSchema = {
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
        methodUsed1: {
          title: 'Culture Method',
          type: 'string',
          order: 4,
        },
        result1: {
          title: 'Result 1',
          type: 'string',
          order: 5,
        },
        grade1: {
          title: 'Grade 1',
          type: 'string',
          order: 6,
        },
        methodUsed2: {
          title: 'Culture Method 2',
          type: 'string',
          order: 7,
        },
        result2: {
          title: 'Result 2',
          type: 'string',
          order: 8,
        },
        grade2: {
          title: 'Grade 2',
          type: 'string',
          order: 9,
        },
        result3: {
          title: 'Result 3',
          type: 'string',
          order: 10,
        },
        grade3: {
          title: 'Grade 3',
          type: 'string',
          order: 11,
        },
        finalResult: {
          title: 'Final Result',
          type: 'string',
          order: 12,
        },
        remarks: {
          title: 'Remarks',
          type: 'string',
          order: 13,
        },
        dateReleased: {
          title: 'Date Released',
          type: 'date',
          order: 14,
        },
        encodedBy: {
          title: 'Encoded By',
          type: 'string',
          order: 15,
        },
        labTech: {
          title: 'Lab Tech',
          type: 'string',
          order: 16,
        },
        validatedBy: {
          title: 'Validated By',
          type: 'string',
          order: 17,
        },
        notedBy: {
          title: 'Noted By',
          type: 'string',
          order: 18,
        },
      },
    },
  }

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
        ofloxacin: {
          title: 'Ofloxacin',
          type: 'string',
          order: 13,
        },
        methodUsed: {
          title: 'Method Used',
          type: 'string',
          order: 14,
        },
        otherMethodUsed: {
          title: 'Other Method',
          type: 'string',
          order: 15,
        },
        remarks: {
          title: 'Remarks',
          type: 'string',
          order: 16,
        },
        dateRead: {
          title: 'Date Read',
          type: 'date',
          order: 17,
        },
        dateReleased: {
          title: 'Date Released',
          type: 'date',
          order: 18,
        },
        readBy: {
          title: 'Read by Med Tech',
          type: 'string',
          order: 19,
        },
        labTech: {
          title: 'Lab Tech',
          type: 'string',
          order: 20,
        },
        encodedBy: {
          title: 'Encoded By',
          type: 'string',
          order: 21,
        },
        reviewedBy: {
          title: 'Reviewed By',
          type: 'string',
          order: 22,
        },
        notedBy: {
          title: 'Noted By',
          type: 'string',
          order: 23,
        },
      },
    },
  }

  await updateMGITAssays(
    knex,
    deviceTypeBDMGITId,
    patientDataSchema,
    {
      ...ntrlDatabaseDstResultDataSchema,
      ...AssayBdMgitAstResultDataSchema,
    },
    {
      ...ntrlDatabaseCultureResultDataSchema,
      ...AssayBdMgitGndResultDataSchema,
    }
  )
  await updateCultureAssays(
    knex,
    deviceTypeNTRLDatabaseId,
    ntrlDatabaseDstResultDataSchema,
    ntrlDatabaseCultureResultDataSchema,
    patientDataSchema
  )

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
    patientDataSchema: JSON.stringify(patientDataSchema),
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
          smearDateCollected1: {
            title: 'Smear Date Collected 1',
            type: 'date',
            order: 1,
          },
          smearResult1: {
            title: 'Smear Result 1',
            type: 'string',
            order: 2,
          },
          smearDateCollected2: {
            title: 'Smear Date Collected 2',
            type: 'date',
            order: 3,
          },
          smearResult2: {
            title: 'Smear Result 2',
            type: 'string',
            order: 4,
          },
          smearDateCollected3: {
            title: 'Smear Date Collected 3',
            type: 'date',
            order: 5,
          },
          smearResult3: {
            title: 'Smear Result 3',
            type: 'string',
            order: 6,
          },
          finalResult: {
            title: 'Final Result',
            type: 'string',
            order: 7,
          },
          comments: {
            title: 'Comments',
            type: 'string',
            order: 8,
          },
          dateReleased: {
            title: 'Date Released',
            type: 'date',
            order: 9,
          },
          encodedBy: {
            title: 'Encoded By',
            type: 'string',
            order: 10,
          },
          validatedBy: {
            title: 'Validated By',
            type: 'string',
            order: 11,
          },
          notedBy: {
            title: 'Noted By',
            type: 'string',
            order: 12,
          },
          laboratoryTechnician: {
            title: 'Laboratory Technician',
            type: 'string',
            order: 13,
          },
        },
      },
    }),
    patientDataSchema: JSON.stringify(patientDataSchema),
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
