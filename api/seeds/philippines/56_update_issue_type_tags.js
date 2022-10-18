module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  await knex('IssueType').whereIn('externalId', ['NewResultsAvailable', 'ResultReceived']).update({ hasTag: 0 })
}
