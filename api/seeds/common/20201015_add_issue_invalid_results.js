module.exports = require('../utils').seed(seed, __filename)

const { seedIssueType, seedIssueEventTriggersForPartner, upsertNotificationTypes } = require('../utils')

async function seed(knex) {
  const { partnerId, userId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': 'admin' })
    .first('p.lastPartnerId as partnerId', 'p.id as personId', 'p.userId')

  const issueTypeModule = await seedIssueType(knex, 'TooManyInvalidResultsModule', {
    userName: 'admin',
  })
  const issueTypeLot = await seedIssueType(knex, 'TooManyInvalidResultsLot', {
    userName: 'admin',
  })

  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['TooManyInvalidResultsLot', 'TooManyInvalidResultsModule'],
  })
  const auditFields = {
    createdOn: new Date(),
    createdBy: userId,
    updatedOn: new Date(),
    updatedBy: userId,
  }

  const issueTypeTooManyInvalidResultsModule = await knex('IssueType').where({ id: issueTypeModule }).first()
  const issueTypeTooManyInvalidResultsLot = await knex('IssueType').where({ id: issueTypeLot }).first()
  const { jobFunctionAdminId } = await knex('JobFunction')
    .where({
      externalId: 'admin',
      partnerId,
    })
    .first('id as jobFunctionAdminId')
  await upsertNotificationTypes(knex, [
    {
      issueTypeId: issueTypeTooManyInvalidResultsModule.id,
      messageTypeId: issueTypeTooManyInvalidResultsModule.defaultMessageTypeId,
      partnerId,
      jobFunctionId: jobFunctionAdminId,
      level: 1,
      name: 'Too Many Invalid Results - Module',
      ...auditFields,
    },
    {
      issueTypeId: issueTypeTooManyInvalidResultsLot.id,
      messageTypeId: issueTypeTooManyInvalidResultsLot.defaultMessageTypeId,
      partnerId,
      jobFunctionId: jobFunctionAdminId,
      level: 1,
      name: 'Too Many Invalid Results - Lot',
      ...auditFields,
    },
  ])
}
module.exports = seed
