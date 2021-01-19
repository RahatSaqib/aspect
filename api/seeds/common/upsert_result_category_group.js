const Promise = require('bluebird')
const ReportCategoryGroupFixture = require('../fixtures/ResultCategoryGroup')
const {
  allAssayToId,
  allResultCategoryToId,
} = require('../../src/shared/dictionary')

module.exports = async function upsertResultCategoryGroups(knex) {
  const assayIds = await allAssayToId()
  const resultCategoryIds = await allResultCategoryToId()

  const groups = ReportCategoryGroupFixture.map(({
    resultCategory1Id,
    resultCategory2Id,
    assayId,
    ...restProps
  }) => {
    return {
      resultCategory1Id: resultCategoryIds[resultCategory1Id],
      resultCategory2Id: resultCategoryIds[resultCategory2Id],
      assayId: assayIds[assayId],
      ...restProps,
    }
  }) 

  const whitelist = groups.map(g => g.externalId)

  // Delete
  await knex('ResultCategoryGroup').whereNotIn('externalId', whitelist).delete()

  await Promise.each(groups, async ({ externalId, ...group }) => {
      const resultCategoryGroupToUpdate = await knex('ResultCategoryGroup').where({ externalId }).first()

      if (resultCategoryGroupToUpdate) {
        // Update
        await knex('ResultCategoryGroup').where({ externalId }).update(group)
      } else {
        // Create
        await knex('ResultCategoryGroup').insert({ externalId, ...group })
      }
    })
}
