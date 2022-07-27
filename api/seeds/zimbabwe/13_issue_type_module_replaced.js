module.exports = require('../utils').seed(seed, __filename)

const { seedIssueType, seedIssueEventTriggersForPartner } = require('../utils')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ name: 'Zimbabwe' }).first('id')

  await seedIssueType(knex, 'ModuleReplaced', {
    userName: 'admin',
  })

  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['ModuleReplaced'],
  })
}
