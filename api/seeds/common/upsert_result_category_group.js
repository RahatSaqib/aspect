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
    resultCategory1Id = false,
    resultCategory2Id = false,
    assayId,
    externalId,
    ...restProps
  }) => {
    if (!resultCategory1Id && !resultCategory2Id)
      throw new Error(`No result categories assigned for group ${externalId}`)

    return {
      resultCategory1Id: resultCategoryIds[resultCategory1Id],
      resultCategory2Id: resultCategoryIds[resultCategory2Id],
      assayId: assayIds[assayId],
      externalId,
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
