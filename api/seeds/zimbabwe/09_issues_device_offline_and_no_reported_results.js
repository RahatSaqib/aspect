module.exports = require('../utils').seed(seed, __filename)

const { seedIssueEventTriggersForPartner } = require('../utils')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where('name', 'Zimbabwe').first('id')
  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['DeviceOffline', 'DeviceNoResults', 'NewResultsAvailable'],
  })
}
