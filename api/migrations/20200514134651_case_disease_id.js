module.exports = require('../src/db').migration(up, down)

const Promise = require('bluebird')

async function up(knex) {
  await knex.schema.alterTable('Case', async tblCase => {
    tblCase.integer('diseaseId').unsigned()
    tblCase.dropUnique(['externalId', 'partnerId'])
    tblCase.unique(['externalId', 'partnerId', 'diseaseId'], 'case_unique')
  })

  const caseDiseases = await knex('Case as c')
    .leftJoin('Result as r', 'c.id', 'r.caseId')
    .leftJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .whereNotNull('at.diseaseId')
    .groupBy('c.id')
    .select('c.id', knex.raw('MAX(at.diseaseId) AS diseaseId'))

  if (caseDiseases.length > 0) {
    const { id: defaultDiseaseId } = await knex('Disease').where('externalId', 'tb').first('id')
    await Promise.each(caseDiseases, async caseDisease =>
      knex('Case')
        .where('id', caseDisease.id)
        .update({ diseaseId: caseDisease.diseaseId || defaultDiseaseId })
    )
  }

  await knex.schema.alterTable('Case', async tblCase => {
    tblCase.integer('diseaseId').unsigned().index().references('id').inTable('Disease').notNullable().alter()
  })

  await knex.schema.alterTable('PartnerDisease', async tblPartnerDisease => {
    tblPartnerDisease.string('caseExternalIdTemplate')
  })
}

async function down(knex) {
  await knex.schema.alterTable('Case', tblCase => {
    tblCase.dropForeign('diseaseId')
  })
  await knex.schema.alterTable('Case', tblCase => {
    tblCase.dropUnique(['externalId', 'partnerId', 'diseaseId'], 'case_unique')
    tblCase.dropColumn('diseaseId')
    tblCase.unique(['externalId', 'partnerId'])
  })

  await knex.schema.alterTable('PartnerDisease', async tblPartnerDisease => {
    tblPartnerDisease.dropColumn('caseExternalIdTemplate')
  })
}
