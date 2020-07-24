module.exports = require('../utils').seed(seed, __filename)

const {
  seedIssueTypeModuleReplaced,
  seedIssueEventTriggersForPartner,
} = require('../utils')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Zimbabwe' })
    .first('id')

  await seedIssueTypeModuleReplaced(knex, {
    userName: 'admin',
  })

  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['ModuleReplaced'],
  })
}
