module.exports = require('../utils').seed(seed, __filename)

const {
  seedIssueType,
  seedIssueEventTriggersForPartner,
  upsertIssueResolutionTrigger,
} = require('../utils')

const { issueTypeToId } = require('../../src/shared/dictionary')

async function seed(knex) {
  const { partnerId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': 'admin' })
    .first('p.lastPartnerId as partnerId')

  await seedIssueType(knex, 'ModuleDisabled', {
    userName: 'admin',
  })

  await seedIssueType(knex, 'ModuleReplaced', {
    userName: 'admin',
  })

  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['ModuleDisabled', 'ModuleReplaced'],
  })
  const now = new Date()
  await upsertIssueResolutionTrigger(knex, {
    issueTypeId: await issueTypeToId('ModuleDisabled'),
    partnerId,
    resolutionConditions: JSON.stringify({
      evaluationMethod: 'plugin-function',
      evaluationParameter: 'resolveIssueModuleDisabled',
    }),
    createdOn: now,
    updatedOn: now,
  })
}
module.exports = seed
