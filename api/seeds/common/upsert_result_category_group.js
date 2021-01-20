const Promise = require('bluebird')
const ReportCategoryGroupFixtureDefault = require('../fixtures/ResultCategoryGroup')
const {
  allAssayToId,
  allResultCategoryToId,
} = require('../../src/shared/dictionary')

module.exports = async function upsertResultCategoryGroups(knex, fixture = ReportCategoryGroupFixtureDefault) {
  const assayIds = {}
  const resultCategoryIds = {}

  const assays = await knex('Assay').select('id', 'externalId')
  const resultCategories = await knex('ResultCategory').select('id', 'externalId')
  assays.forEach(({ id, externalId }) => assayIds[externalId] = id)
  resultCategories.forEach(({ id, externalId }) => resultCategoryIds[externalId] = id )

  const groups = fixture.map(({
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
      assayExternalId: assayId,
      externalId,
      ...restProps,
    }
  }) 

  const whitelist = groups.map(g => g.externalId)

  // Delete
  await knex('ResultCategoryGroup').whereNotIn('externalId', whitelist).delete()

  await Promise.each(groups, async ({ externalId, assayExternalId, ...group }) => {
    if (!group.assayId) {
      console.warn(`Warning! ResultCategoryGroup upsert skipped as it references to an unexistant assay external id (${assayExternalId})`)
    } else {
      const resultCategoryGroupToUpdate = await knex('ResultCategoryGroup').where({ externalId }).first()

      if (resultCategoryGroupToUpdate) {
        // Update
        await knex('ResultCategoryGroup').where({ externalId }).update(group)
      } else {
        // Create
        await knex('ResultCategoryGroup').insert({ externalId, ...group })
      }
    }
  })
}
