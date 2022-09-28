module.exports = require('../utils').seed(seed, __filename)

const {
  deviceTypeCategoryToId,
  assayTypeToId,
  resultSourceToId,
  resultCategoryToId,
} = require('../../src/shared/dictionary')
const { updateAssayResultCategoryTreatmentEmphasize } = require('../utils')
const { upsertMGITDeviceTypeAndAssays, upsertCultureAssays } = require('../commonTB')

async function seed(knex) {
  const informationSystemDeviceTypeCategoryId = await deviceTypeCategoryToId('Information System')

  let { id: deviceTypeNTRLDatabaseId } =
    (await knex('DeviceType').where('externalId', 'NTRLDatabase').first('id')) || {}

  if (deviceTypeNTRLDatabaseId) return
  ;[deviceTypeNTRLDatabaseId] = await knex('DeviceType').insert({
    externalId: 'PhilippinesNtrl',
    name: 'Philippines NTRL Database',
    manufacturer: 'NTRL',
    deviceTypeCategoryId: informationSystemDeviceTypeCategoryId,
  })

  const ntrlDatabaseGenericCultureResultDataSchema = {
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

  await upsertCultureAssays(knex, deviceTypeNTRLDatabaseId, {}, ntrlDatabaseGenericCultureResultDataSchema, {})

  const assayLpa = {
    name: 'LPA',
    abbreviation: 'LPA',
    i18nKey: 'assayLPA',
    externalId: 'assayLPA',
    assayTypeId: await assayTypeToId('GenoType Test Strip'),
    deviceTypeId: deviceTypeNTRLDatabaseId,
    resultSourceId: await resultSourceToId('LIMS'),
    resultCategory1Label: 'MTB',
    resultCategory1i18nKey: 'resultCategoryMtb',
    resultCategory2Label: 'Resistance',
    resultCategory2i18nKey: 'resultCategoryResistance',
  }

  let { id: assayLpaId } = (await knex('Assay').where('externalId', 'assayLpa').first('id')) || {}
  if (!assayLpaId) {
    ;[assayLpaId] = await knex('Assay').insert(assayLpa)
  } else {
    await knex('Assay').where('id', assayLpaId).update(assayLpa)
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
  }

  let { id: assaySmearId } = (await knex('Assay').where('externalId', 'assaySmear').first('id')) || {}
  if (!assaySmearId) {
    ;[assaySmearId] = await knex('Assay').insert(assaySmear)
  } else {
    await knex('Assay').where('id', assaySmearId).update(assaySmear)
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
