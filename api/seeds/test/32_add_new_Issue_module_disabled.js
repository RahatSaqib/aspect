module.exports = require('../utils').seed(seed, __filename)

const { seedIssueType, seedIssueEventTriggersForPartner } = require('../utils')

async function seed(knex) {
  const { partnerId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': 'admin' })
    .first('p.lastPartnerId as partnerId')

  await seedIssueType(knex, 'ModuleDisabled', {
    userName: 'admin',
  })

  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['ModuleDisabled'],
  })
}
