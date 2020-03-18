const _ = require('lodash')
const Promise = require('bluebird')
const {
  assayTypeToId,
  resultSourceToId,
  deviceTypeCategoryToId,
  resultCategoryToId,
} = require('../src/shared/dictionary')
const { updateAssayResultCategoryTreatmentEmphasize } = require('./utils')
const AssayCovidPatientDataSchema = require('./fixtures/AssayCovidPatientDataSchema.json')
const AssayCovidResultDataSchema = require('./fixtures/AssayCovidResultDataSchema.json')

async function upsertCovidAssay(
  knex,
  patientDataSchema = AssayCovidPatientDataSchema,
  resultDataSchema = AssayCovidResultDataSchema
) {
  const deviceTypeCovidId = await knex('DeviceType').insert({
    deviceTypeCategoryId: await deviceTypeCategoryToId('Lab'),
    externalId: 'GenericCovid19',
    name: 'COVID-19 Diagnostic',
    manufacturer: 'Generic',
  })

  const assayGenericCovid19 = {
    name: 'COVID-19',
    abbreviation: 'COVID-19',
    i18nKey: 'assayGenericCovid19',
    externalId: 'assayGenericCovid19',
    assayTypeId: await assayTypeToId('Generic COVID-19 Test'),
    deviceTypeId: deviceTypeCovidId,
    resultSourceId: await resultSourceToId('EnteredByHand'),
    resultCategory1Label: 'COVID-19',
    resultCategory1i18nKey: 'resultCategoryCovid19',
    resultDataSchema: JSON.stringify(resultDataSchema),
    patientDataSchema: JSON.stringify(patientDataSchema),
  }

  let { id: assayCovidId } =
    (await knex('Assay')
      .where('externalId', 'assayGenericCovid19')
      .first('id')) || {}

  if (!assayCovidId) {
    assayCovidId = await knex('Assay').insert(assayGenericCovid19)
  } else {
    await knex('Assay')
      .where('id', assayCovidId)
      .update(assayGenericCovid19)
  }

  const values = await Promise.all([
    resultCategoryToId('Positive'),
    resultCategoryToId('Negative'),
    resultCategoryToId('Inconclusive'),
    resultCategoryToId('Unknown'),
  ])

  const resultCategoryId = await knex('ResultCategoryAssay')
    .where({ assayId: assayCovidId })
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
      assayId: assayCovidId,
    })
  )

  await updateAssayResultCategoryTreatmentEmphasize(knex)
}

module.exports = {
  upsertCovidAssay,
}
