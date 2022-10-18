const _ = require('lodash')
const Promise = require('bluebird')
const { assayTypeToId, resultSourceToId, resultCategoryToId } = require('../src/shared/dictionary')
const AssayTbLampResultDataSchema = require('./fixtures/AssayTbLampResultDataSchema.json')

async function upsertTbLampDeviceTypes(
  knex,
  partnerId,
  deviceTypeId,
  patientDataSchema,
  resultDataSchema = AssayTbLampResultDataSchema
) {
  const values = await Promise.all([
    resultCategoryToId('Positive'),
    resultCategoryToId('Negative'),
    resultCategoryToId('Inconclusive'),
    resultCategoryToId('Unknown'),
  ])

  const assayTbLamp = {
    name: 'TB LAMP',
    abbreviation: 'TB LAMP',
    i18nKey: 'assayTbLamp',
    externalId: 'assayTbLamp',
    assayTypeId: await assayTypeToId('TB G&D'),
    deviceTypeId,
    resultSourceId: await resultSourceToId('LIMS'),
    resultCategory1Label: 'MTB',
    resultCategory1i18nKey: 'resultCategoryMtb',
    resultDataSchema: JSON.stringify(resultDataSchema),
    patientDataSchema: JSON.stringify(patientDataSchema),
  }

  let { id: assayTbLampId } = (await knex('Assay').where('externalId', assayTbLamp.externalId).first('id')) || {}

  if (!assayTbLampId) {
    ;[assayTbLampId] = await knex('Assay').insert(assayTbLamp)
  } else {
    await knex('Assay').where('id', assayTbLampId).update(assayTbLamp)
  }
  const resultCategoryId = await knex('ResultCategoryAssay')
    .where({ assayId: assayTbLampId })
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
      assayId: assayTbLampId,
    })
  )

  await knex('PartnerAssay').insert({
    partnerId,
    assayId: assayTbLampId,
    canCreate: false,
    canDelete: false,
    canEdit: false,
  })
}

module.exports = {
  upsertTbLampDeviceTypes,
}
