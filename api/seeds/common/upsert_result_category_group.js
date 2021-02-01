const Promise = require('bluebird')
const groupBy = require('lodash/groupBy')
const ResultCategoryGroupFixtureDefault = require('../fixtures/ResultCategoryGroup')

const validateFixture = (fixture) => {
  const byExternalId = groupBy(fixture, 'externalId')
  let duplicatedExternalIds = []
  Object.keys(byExternalId).forEach(externalId => {
    if (byExternalId[externalId].length > 1)
      duplicatedExternalIds.push(externalId)
  })
  if (duplicatedExternalIds.length > 0)
    throw new Error(`Some result category groups external ids where specified more than one time: ${duplicatedExternalIds.join(', ')}`)
}

module.exports = async function upsertResultCategoryGroups(
  knex,
  fixture = ResultCategoryGroupFixtureDefault
) {
  validateFixture(fixture)

  const assayIds = {}
  const resultCategoryIds = {}

  const assays = await knex('Assay').select('id', 'externalId')
  const resultCategories = await knex('ResultCategory').select(
    'id',
    'externalId'
  )
  assays.forEach(({ id, externalId }) => {
    assayIds[externalId] = id
  })
  resultCategories.forEach(({ id, externalId }) => {
    resultCategoryIds[externalId] = id
  })

  const groups = fixture.map(
    ({
      resultCategory1ExternalId = null,
      resultCategory2ExternalId = null,
      assayExternalId,
      externalId,
      ...restProps
    }) => {
      if (!resultCategory1ExternalId && !resultCategory2ExternalId)
        throw new Error(`No result categories assigned for group ${externalId}`)

      return {
        resultCategory1Id: resultCategoryIds[resultCategory1ExternalId],
        resultCategory2Id: resultCategoryIds[resultCategory2ExternalId],
        assayId: assayIds[assayExternalId],
        assayExternalId,
        externalId,
        ...restProps,
      }
    }
  )

  const whitelist = groups.map(g => g.externalId)

  // Delete
  await knex('ResultCategoryGroup').whereNotIn('externalId', whitelist).delete()

  await Promise.each(
    groups,
    async ({ externalId, assayExternalId, ...group }) => {
      if (!group.assayId) {
        console.warn(
          `Warning! ResultCategoryGroup upsert skipped as it references to an non-existant assay external id (${assayExternalId})`
        )
      } else {
        const resultCategoryGroupToUpdate = await knex('ResultCategoryGroup')
          .where({ externalId })
          .first()

        if (resultCategoryGroupToUpdate) {
          // Update
          await knex('ResultCategoryGroup').where({ externalId }).update(group)
        } else {
          // Create
          await knex('ResultCategoryGroup').insert({ externalId, ...group })
        }
      }
    }
  )
}
