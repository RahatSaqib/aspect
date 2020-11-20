module.exports = require('../utils').seed(seed, __filename)

const {
  seedIssueType,
  seedIssueEventTriggersForPartner,
  upsertNotificationTypes,
  upsertIssueResolutionTrigger,
} = require('../utils')

async function seed(knex) {
  const now = new Date()

  const { partnerId, userId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': 'admin' })
    .first('p.lastPartnerId as partnerId', 'p.userId')

  const issueTypeId = await seedIssueType(knex, 'UnusedModules', {
    userName: 'admin',
  })

  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['UnusedModules'],
  })

  const auditFields = {
    createdOn: now,
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
  }

  const issueType = await knex('IssueType').where({ id: issueTypeId }).first()

  const { jobFunctionAdminId } = await knex('JobFunction')
    .where({
      externalId: 'admin',
      partnerId,
    })
    .first('id as jobFunctionAdminId')

  await upsertNotificationTypes(knex, [
    {
      issueTypeId: issueType.id,
      messageTypeId: issueType.defaultMessageTypeId,
      partnerId,
      jobFunctionId: jobFunctionAdminId,
      level: 1,
      name: 'Modules Unused',
      ...auditFields,
    },
  ])

  await upsertIssueResolutionTrigger(knex, {
    issueTypeId: issueType.id,
    partnerId,
    resolutionConditions: JSON.stringify({
      evaluationMethod: 'plugin-function',
      evaluationParameter: 'resolveIssueUnusedModules', // The name of the function to evaluate if it should be resolved or not.
      evaluationFilterParameters: {
        minResults: 20,
        expectedUsedModules: 4
      }
    }),
    createdOn: now,
    updatedOn: now,
  })
}
module.exports = seed
