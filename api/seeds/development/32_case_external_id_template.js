module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const { id: covidAssayTypeId } = await knex('AssayType').where('externalId', 'covid19').first('id')
  const covid19AssayIds = await knex('Assay').where('assayTypeId', covidAssayTypeId).pluck('id')
  await knex('PartnerAssay').whereIn('assayId', covid19AssayIds).update({
    reliableCaseExternalIdTemplate: '{{coalesce result.formData.caseId result.data.caseId result.patient.caseId}}',
  })
}
