const _ = require('lodash')
const { addMinutes, addDays, format } = require('date-fns')
const Promise = require('bluebird')
const {
  assayTypeToId,
  assayToId,
  resultSourceToId,
  resultCategoryToId,
} = require('../src/shared/dictionary')
const AssayBdMgitAstResultDataSchema = require('./fixtures/AssayBdMgitAstResultDataSchema.json')
const AssayBdMgitGndResultDataSchema = require('./fixtures/AssayBdMgitGnd.json')
const MGITPatientDataSchema = require('./fixtures/MGITPatientDataSchema.json')

async function getMGITResultFromTBPossitive(result, assaysMGIT, devicesMGIT) {
  const randomDateMgit = addDays(result.endedOn, _.random(5))
  const now = new Date()
  const assay = _.sample(assaysMGIT)
  const assayId = await assayToId('assayBdMgitAst')
  return _.defaults(
    {
      assayId: _.sample(assaysMGIT).id,
      startedOn: randomDateMgit,
      endedOn: addMinutes(randomDateMgit, 100),
      createdOn: addMinutes(randomDateMgit, 120),
      updatedOn: addMinutes(randomDateMgit, 180),
      consumableSerial: `${_.random(100)}12`,
      consumableExpirationDate: new Date(+now + 200 * _.random(10)),
      deviceId: _.sample(devicesMGIT).id,
      resultData: JSON.stringify(getNewMgitResultData(assayId === assay)),
      externalId: `TBMGIT-${_.random(1000)}-${format(new Date(), 'TT')}-D`,
    },
    _.omit(result, ['treatmentStatusExternalId', 'id'])
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
    resultDataSchema: JSON.stringify({ AssayBdMgitAstResultDataSchema }),
    patientDataSchema: JSON.stringify({ patientDataSchema }),
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

  const values = await Promise.all([
    resultCategoryToId('Detected'),
    resultCategoryToId('NotDetected'),
    resultCategoryToId('Success'),
    resultCategoryToId('Missing'),
    resultCategoryToId('Error'),
    resultCategoryToId('Unknown'),
    resultCategoryToId('Susceptible'),
    resultCategoryToId('Resistant'),
  ])
  const resultCategoryId = await knex('ResultCategoryAssay')
    .where({ assayId: assayBdMgitAstId })
    .select('resultCategoryId')

  const categoriesToInsert = _.filter(
    values,
    elem =>
      !_.includes(
        _.map(resultCategoryId, category => category.resultCategoryId),
        elem
      )
  )

  await Promise.each(categoriesToInsert, elem =>
    knex('ResultCategoryAssay').insert({
      resultCategoryId: elem,
      assayId: assayBdMgitAstId,
    })
  )

  const assayBdMgitGnd = {
    name: 'BD MGIT GND',
    abbreviation: 'MGIT GND',
    i18nKey: 'assayBdMgitGnd',
    externalId: 'assayBdMgitGnd',
    assayTypeId: await assayTypeToId('TB G&D'),
    deviceTypeId: deviceTypeBDMGITId,
    resultSourceId: await resultSourceToId('DiagnosticDevice'),
    resultCategory1Label: 'Result',
    resultDataSchema: JSON.stringify({ AssayBdMgitGndResultDataSchema }),
    patientDataSchema: JSON.stringify({ patientDataSchema }),
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
  values.splice(-2, 2)
  const resultCategoryBdMgitGndId = await knex('ResultCategoryAssay')
    .where({ assayId: assayBdMgitGndId })
    .select('resultCategoryId')
  const valuesToInsert = _.filter(
    values,
    elem =>
      !_.includes(
        _.map(resultCategoryBdMgitGndId, category => category.resultCategoryId),
        elem
      )
  )
  await Promise.each(valuesToInsert, elem =>
    knex('ResultCategoryAssay').insert({
      resultCategoryId: elem,
      assayId: assayBdMgitGndId,
    })
  )
}

function getNewMgitResultData(isAST) {
  return {
    EMB: {
      sirStatus: _.sample(['susceptible', 'resistant']),
      growthUnits: _.random(1, 1300),
      antibioticConcentration: `${_.random(1, 10)}.00`,
      antibioticConcentrationUnits: 'ug/ml',
    },
    RIF: {
      sirStatus: _.sample(['susceptible', 'resistant']),
      growthUnits: _.random(1, 1300),
      antibioticConcentration: `${_.random(1, 10)}.00`,
      antibioticConcentrationUnits: 'ug/ml',
    },
    S: {
      sirStatus: _.sample(['susceptible', 'resistant']),
      growthUnits: _.random(1, 1300),
      antibioticConcentration: `${_.random(1, 10)}.00`,
      antibioticConcentrationUnits: 'ug/ml',
    },
    EM: {
      sirStatus: _.sample(['susceptible', 'resistant']),
      growthUnits: _.random(1, 1300),
      antibioticConcentration: `${_.random(1, 10)}.00`,
      antibioticConcentrationUnits: 'ug/ml',
    },
    RA: {
      sirStatus: _.sample(['susceptible', 'resistant']),
      growthUnits: _.random(1, 1300),
      antibioticConcentration: `${_.random(1, 10)}.00`,
      antibioticConcentrationUnits: 'ug/ml',
    },
    INH: {
      sirStatus: _.sample(['susceptible', 'resistant']),
      growthUnits: _.random(1, 1300),
      antibioticConcentration: `${_.random(1, 10)}.00`,
      antibioticConcentrationUnits: 'ug/ml',
    },
    protocolLength: 42,
    instrumentLocation: 'B/A03',
    isolateNumber: '1',
    senderName: '7 Loveton Circle',
    instrumentType: 'MGIT960',
    instrumentNumber: '13',
    versionNumber: 'V1.00',
    testId: !isAST ? 'MGIT_960_GND' : 'MGIT_960_AST',
    resultTypeCode: !isAST ? 'GND_MGIT' : 'AST_MGIT',
    preliminaryFinalStatus: 'P',
  }
}
module.exports = {
  updateMGITAssays,
  getMGITResultFromTBPossitive,
}
