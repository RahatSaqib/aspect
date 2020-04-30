module.exports = require('../utils').seed(seed, __filename)
const _ = require('lodash')
const Promise = require('bluebird')
const { getUniqueId } = require('../utils')

async function seed(knex) {
  const results = await knex('Result').whereNull('caseId')
  const cases = []
  await Promise.each(results, async result => {
    if (_.random(100) <= 50) {
      const caseExternalId = `CASE-${getUniqueId()}-ID`
      const caseId = await knex('Case').insert({
        externalId: caseExternalId,
        partnerId: result.partnerId,
      })
      cases.push(caseId)
      if (_.random(100) <= 50) {
        result.caseId = _.sample(cases)
      } else {
        result.caseId = caseId
      }
      await knex('Result')
        .update({ id: result.id, caseId: result.caseId })
        .where({ id: result.id })
    }
  })
}
