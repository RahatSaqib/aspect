module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const {
  seedIssueType,
  seedIssueEventTriggersForPartner,
  upsertIssueEscalationTrigger,
  upsertIssueResolutionTrigger,
} = require('../utils')
const { issueTypeToId } = require('../../src/shared/dictionary')

async function seed(knex) {
  const { partnerId, userId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': 'admin' })
    .first('p.lastPartnerId as partnerId', 'p.id as personId', 'p.userId')
  const now = new Date()
  const auditFields = {
    createdOn: now,
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
  }
  const auditDates = _.pick(auditFields, ['createdOn', 'updatedOn'])

  //
  await seedIssueType(knex, 'InstrumentReplaced', {
    userName: 'admin',
  })

  //
  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['InstrumentReplaced'],
  })

  //
  const issueTypeId = await issueTypeToId('InstrumentReplaced')
  await upsertIssueEscalationTrigger(knex, [
    {
      issueTypeId,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 7 }, // escalate to level 2 in 1 week
      }),
      ...auditDates,
    },
    {
      issueTypeId,
      partnerId,
      escalateToLevel: 3,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 14 }, // escalate to level 3 in 2 weeks
      }),
      ...auditDates,
    },
  ])

  //
  await upsertIssueResolutionTrigger(knex, {
    issueTypeId,
    partnerId,
    resolutionConditions: JSON.stringify({
      evaluationMethod: 'plugin-function',
      evaluationParameter: 'resolveIssueInstrumentReplaced',
    }),
    createdOn: now,
    updatedOn: now,
  })
}
module.exports = seed
