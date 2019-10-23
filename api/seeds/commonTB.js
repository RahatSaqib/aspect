const {
  assayTypeToId,
  resultSourceToId,
  resultCategoryToId,
} = require('../src/shared/dictionary')
const _ = require('lodash')
const { addMinutes, addDays, format } = require('date-fns')
const AssayBdMgitAstResultDataSchema = require('./fixtures/AssayBdMgitAstResultDataSchema.json')
const AssayBdMgitGndResultDataSchema = require('./fixtures/AssayBdMgitGnd.json')
const MGITPatientDataSchema = require('./fixtures/MGITPatientDataSchema.json')

function getMGITResultFromTBPossitive(result, assaysMGIT, devicesMGIT) {
  const randomDateMgit = addDays(result.endedOn, _.random(5))
  const now = new Date()
  return _.omit(
    _.defaults(
      {
        assayId: _.sample(assaysMGIT),
        startedOn: randomDateMgit,
        endedOn: addMinutes(randomDateMgit, 100),
        createdOn: addMinutes(randomDateMgit, 120),
        updatedOn: addMinutes(randomDateMgit, 180),
        consumableSerial: `${_.random(100)}12`,
        consumableExpirationDate: new Date(+now + 200 * _.random(10)),
        deviceId: _.sample(devicesMGIT).id,
        resultData: JSON.stringify(result.resultData),
        externalId: `TBMGIT-${_.random(1000)}-${format(new Date(), 'tt')}-D`,
      },
      result
    ),
    'id'
  )
}
async function updateMGITAssays(
  knex,
  deviceTypeBDMGITId,
  patientDataSchema = MGITPatientDataSchema
) {
  const assayBdMgitAst = {
    name: 'BD MGIT AST',
    abbreviation: 'MGIT AST',
    i18nKey: 'assayBdMgitAst',
    externalId: 'assayBdMgitAst',
    assayTypeId: await assayTypeToId('TB AST'),
    deviceTypeId: deviceTypeBDMGITId,
    resultSourceId: await resultSourceToId('DiagnosticDevice'),
    resultCategory1Label: 'Result',
    resultDataSchema: AssayBdMgitAstResultDataSchema,
    patientDataSchema,
  }
  let { id: assayBdMgitAstId } =
    (await knex('Assay')
      .where('externalId', 'assayBdMgitAst')
      .first('id')) || {}
  if (!assayBdMgitAstId) {
    assayBdMgitAstId = await knex('Assay').insert({
      ...assayBdMgitAst,
      externalId: 'assayBdMgitAst',
    })
  } else {
    await knex('Assay')
      .where('id', assayBdMgitAstId)
      .update(assayBdMgitAst)
  }

  // assign categories to BD MGIT AST assay
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
    resultCategory1Label: 'Result',
    resultDataSchema: AssayBdMgitGndResultDataSchema,
    patientDataSchema,
  }
  let { id: assayBdMgitGndId } =
    (await knex('Assay')
      .where('externalId', 'assayBdMgitGnd')
      .first('id')) || {}
  if (!assayBdMgitGndId) {
    assayBdMgitGndId = await knex('Assay').insert({
      ...assayBdMgitGnd,
      externalId: 'assayBdMgitGnd',
    })
  } else {
    await knex('Assay')
      .where('id', assayBdMgitGndId)
      .update(assayBdMgitGnd)
  }
  // assign categories to BD MGIT GND assay
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
    resultCategoryId: await resultCategoryToId('Unknown'),
    assayId: assayBdMgitGndId,
  })
}

module.exports = {
  updateMGITAssays,
  getMGITResultFromTBPossitive,
}
