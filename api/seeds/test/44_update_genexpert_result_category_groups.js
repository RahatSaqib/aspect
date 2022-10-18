const upsertResultCategoryGroups = require('../common/upsert_result_category_group')
const fixture = require('../fixtures/ResultCategoryGroupGeneXpert')

module.exports = require('../utils').seed(async knex => {
  const geneXpertAssayIdsInDatabase = await knex('DeviceType as dt')
    .join('Assay as a', 'a.deviceTypeId', 'dt.id')
    .where('dt.externalId', 'CepheidGeneXpert')
    .pluck('a.externalId')
  await upsertResultCategoryGroups(knex, fixture, geneXpertAssayIdsInDatabase)
}, __filename)
