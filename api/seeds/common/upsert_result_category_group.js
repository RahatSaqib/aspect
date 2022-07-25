const Promise = require('bluebird')
const groupBy = require('lodash/groupBy')
const omit = require('lodash/omit')

const validateFixture = fixture => {
  const byExternalId = groupBy(fixture, 'externalId')
  const duplicatedExternalIds = []
  Object.keys(byExternalId).forEach(externalId => {
    if (byExternalId[externalId].length > 1) duplicatedExternalIds.push(externalId)
  })
  if (duplicatedExternalIds.length > 0)
    throw new Error(
      `Some result category groups external ids where specified more than one time: ${duplicatedExternalIds.join(', ')}`
    )
}

module.exports = async function upsertResultCategoryGroups(knex, fixture, assayWhitelist = []) {
  validateFixture(fixture)

  const assayIds = {}
  const resultCategoryIds = {}

  const assays = await knex('Assay').select('id', 'externalId')

  if (assayWhitelist.length === 0) assayWhitelist = assays.map(a => a.externalId)

  const resultCategories = await knex('ResultCategory').select('id', 'externalId')
  assays.forEach(({ id, externalId }) => {
    assayIds[externalId] = id
  })
  resultCategories.forEach(({ id, externalId }) => {
    resultCategoryIds[externalId] = id
  })

  if (assayWhitelist.length > 0) fixture = fixture.filter(g => assayWhitelist.includes(g.assayExternalId))

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

  await Promise.each(groups, async group => {
    group = omit(group, ['assayExternalId'])
    const resultCategoryGroupToUpdate = await knex('ResultCategoryGroup')
      .where({ externalId: group.externalId })
      .first()

    if (resultCategoryGroupToUpdate) {
      // Update
      await knex('ResultCategoryGroup').where({ externalId: group.externalId }).update(group)
    } else {
      // Create
      await knex('ResultCategoryGroup').insert(group)
    }
  })
}
