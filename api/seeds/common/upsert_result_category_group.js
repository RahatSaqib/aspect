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

  // Only include the category groups from an existing assay
  fixture = fixture.filter(g => assayIds[g.assayExternalId])

  // Only include the category groups from the whitelist
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

  const rows = groups.map(group => omit(group, ['assayExternalId']))
  await knex('ResultCategoryGroup').insert(rows).onConflict('externalId').merge()
}
