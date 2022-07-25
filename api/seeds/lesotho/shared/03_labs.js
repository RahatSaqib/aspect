const { ensureResultTreatmentStatuses, upsertAssayResultCategories } = require('../../common')
const { updateAssayResultCategoryTreatmentEmphasize } = require('../../utils')

module.exports = async function (knex) {
  await ensureResultTreatmentStatuses(knex)

  // MTB-Rif categories
  const { id: geneXpertMtbRifAssayId } = await knex('Assay').where('externalId', 'GxMtbRif').first('id')
  await upsertAssayResultCategories(knex, geneXpertMtbRifAssayId, [
    'Detected',
    'NotDetected',
    'Indeterminate',
    'Invalid',
    'NoResult',
    'Error',
  ])

  // MTB-Rif ULTRA categories
  const { id: geneXpertMtbRifUltraAssayId } = await knex('Assay').where('externalId', 'GxMtbRifUltra').first('id')
  await upsertAssayResultCategories(knex, geneXpertMtbRifUltraAssayId, [
    'Detected',
    'Trace Detected',
    'NotDetected',
    'Indeterminate',
    'Invalid',
    'NoResult',
    'Error',
  ])

  // HIV-VL categories
  const { id: geneXpertHivVlAssayId } = await knex('Assay').where('externalId', 'GxHiv1Vl').first('id')
  await upsertAssayResultCategories(knex, geneXpertHivVlAssayId, [
    'LessThan1000',
    'MoreThan1000',
    'NotDetected',
    'Invalid',
    'NoResult',
    'Error',
  ])

  // HIV-QUAL categories
  const { id: geneXpertHivQualAssayId } = await knex('Assay').where('externalId', 'GxHiv1Qual').first('id')
  await upsertAssayResultCategories(knex, geneXpertHivQualAssayId, [
    'Detected',
    'NotDetected',
    'Invalid',
    'NoResult',
    'Error',
  ])

  await updateAssayResultCategoryTreatmentEmphasize(knex)
}
