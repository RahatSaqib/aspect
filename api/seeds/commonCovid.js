const _ = require('lodash')
const Promise = require('bluebird')
const {
  assayTypeToId,
  resultSourceToId,
  resultCategoryToId,
} = require('../src/shared/dictionary')
const AssayCovidResultDataSchema = require('./fixtures/AssayCovidResultDataSchema.json')
const AssayCovidPatientDataSchema = require('./fixtures/AssayCovidPatientDataSchema.json')

async function upsertCovidAssay(
  knex,
  patientDataSchema = AssayCovidPatientDataSchema,
  resultDataSchema = AssayCovidResultDataSchema
) {
  const { id: deviceTypeCategoryLab } = await knex('DeviceTypeCategory')
    .where('externalId', 'lab')
    .first('id')

  const [deviceTypeCovidId] = await knex('DeviceType').insert({
    externalId: 'genericCovid19',
    name: 'COVID-19 Device',
    manufacturer: 'Generic',
    deviceTypeCategoryId: deviceTypeCategoryLab,
  })

  // TODO: assay type

  // TODO: SCHEMAS

  const assayGenericCovid19 = {
    name: 'COVID-19',
    abbreviation: 'COVID-19',
    i18nKey: 'assayGenericCovid19',
    externalId: 'assayGenericCovid19',
    assayTypeId: await assayTypeToId('genericCovid19'),
    deviceTypeId: deviceTypeCovidId,
    resultSourceId: await resultSourceToId('EnteredByHand'),
    resultCategory1Label: 'COVID-19',
    resultDataSchema: JSON.stringify(resultDataSchema),
    patientDataSchema: JSON.stringify(patientDataSchema),
  }
  let { id: assayCovidId } =
    (await knex('Assay')
      .where('externalId', 'assayGenericCovid19')
      .first('id')) || {}
  if (!assayCovidId) {
    assayCovidId = await knex('Assay').insert({
      ...assayGenericCovid19,
      externalId: 'assayGenericCovid19',
    })
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
}

module.exports = {
  upsertCovidAssay,
}
