module.exports = require('../utils').seed(seed, __filename)
const { issueTypeToId } = require('../../src/shared/dictionary')
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

  //
  await seedIssueType(knex, 'ProbesTooLowModule', {
    userName: 'admin',
  })
  await seedIssueType(knex, 'ProbesTooLowLot', {
    userName: 'admin',
  })

  //
  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['ProbesTooLowLot', 'ProbesTooLowModule'],
  })
  const auditFields = {
    createdOn: new Date(),
    createdBy: userId,
    updatedOn: new Date(),
    updatedBy: userId,
  }
  const issueTypeProbesTooLowModule = await knex('IssueType')
    .where({ id: await issueTypeToId('ProbesTooLowModule') })
    .first()
  const issueTypeProbesTooLowLot = await knex('IssueType')
    .where({ id: await issueTypeToId('ProbesTooLowLot') })
    .first()
  const { jobFunctionAdminId } = await knex('JobFunction')
    .where({
      externalId: 'admin',
      partnerId,
    })
    .first('id as jobFunctionAdminId')
  await upsertNotificationTypes(knex, [
    {
      issueTypeId: issueTypeProbesTooLowModule.id,
      messageTypeId: issueTypeProbesTooLowModule.defaultMessageTypeId,
      partnerId,
      jobFunctionId: jobFunctionAdminId,
      level: 1,
      name: 'Probes Too Low Alert',
      ...auditFields,
    },
    {
      issueTypeId: issueTypeProbesTooLowLot.id,
      messageTypeId: issueTypeProbesTooLowLot.defaultMessageTypeId,
      partnerId,
      jobFunctionId: jobFunctionAdminId,
      level: 1,
      name: 'Probes Too Low Alert',
      ...auditFields,
    },
  ])
}
module.exports = seed
