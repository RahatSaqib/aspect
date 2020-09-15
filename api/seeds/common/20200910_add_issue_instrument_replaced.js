module.exports = require('../utils').seed(seed, __filename)

const { seedIssueType, seedIssueEventTriggersForPartner } = require('../utils')

async function seed(knex) {
  const { partnerId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': 'admin' })
    .first('p.lastPartnerId as partnerId', 'p.id as personId', 'p.userId')

  //
  await seedIssueType(knex, 'InstrumentReplaced', {
    userName: 'admin',
  })

  //
  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['InstrumentReplaced'],
  })
}
module.exports = seed
