module.exports = require('../utils').seed(seed, __filename)

const {
  seedIssueType,
  seedIssueEventTriggersForPartner,
  upsertNotificationTypes,
} = require('../utils')

async function seed(knex) {
  const { partnerId, userId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': 'admin' })
    .first('p.lastPartnerId as partnerId', 'p.id as personId', 'p.userId')

  const issueType = await seedIssueType(knex, 'TooManyInvalidResults', {
    userName: 'admin',
  })

  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['TooManyInvalidResults'],
  })
  const auditFields = {
    createdOn: new Date(),
    createdBy: userId,
    updatedOn: new Date(),
    updatedBy: userId,
  }

  const issueTypeTooManyInvalidResults = await knex('IssueType')
    .where({ id: issueType })
    .first()
  const { jobFunctionAdminId } = await knex('JobFunction')
    .where({
      externalId: 'admin',
      partnerId,
    })
    .first('id as jobFunctionAdminId')
  await upsertNotificationTypes(knex, [
    {
      issueTypeId: issueTypeTooManyInvalidResults.id,
      messageTypeId: issueTypeTooManyInvalidResults.defaultMessageTypeId,
      partnerId,
      jobFunctionId: jobFunctionAdminId,
      level: 1,
      name: 'Too Many Invalid Results',
      ...auditFields,
    },
  ])
}
module.exports = seed
