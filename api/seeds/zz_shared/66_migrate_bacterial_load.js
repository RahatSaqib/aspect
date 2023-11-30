const {
  bacterialLoadMapping,
} = require('../../src/plugin/deviceType/GxConnect/resultCategories/resultCategoriesMapping')

module.exports = require('../utils').seed(async knex => {
  const assayIds = await knex('Assay').whereIn('externalId', ['GxMtbRif', 'GxMtbRifUltra']).pluck('id')

  // We are sorting the bacterial load by length to prevent conflicts when matching the bacterial load levels
  const bacterialLoadKeys = Object.keys(bacterialLoadMapping).sort(function (a, b) {
    return b.length - a.length
  })

  const caseQuery = bacterialLoadKeys
    .map(key => `WHEN resultData->>"$.resultText" LIKE '%${key}%' THEN '${bacterialLoadMapping[key]}'`)
    .join(' ')

  await knex('Result')
    .update({
      resultData: knex.raw(`JSON_SET(resultData, "$.bacterialLoad", CASE ${caseQuery} END)`),
    })
    .where(qb => {
      // Optimization: Identify rows to be updated
      bacterialLoadKeys.forEach(key => qb.orWhereLike(knex.raw('resultData->>"$.resultText"'), `%${key}%`))
    })
    .whereIn('assayId', assayIds)
}, __filename)
