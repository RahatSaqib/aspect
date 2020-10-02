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
  await seedIssueType(knex, 'ProbesTooLow', {
    userName: 'admin',
  })

  //
  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['ProbesTooLow'],
  })
  const auditFields = {
    createdOn: new Date(),
    createdBy: userId,
    updatedOn: new Date(),
    updatedBy: userId,
  }
  const issueTypeProbesTooLow = await knex('IssueType')
    .where({ id: await issueTypeToId('ProbesTooLow') })
    .first()
  const { jobFunctionAdminId } = await knex('JobFunction')
    .where({
      externalId: 'admin',
      partnerId,
    })
    .first('id as jobFunctionAdminId')
  await upsertNotificationTypes(knex, [
    {
      issueTypeId: issueTypeProbesTooLow.id,
      messageTypeId: issueTypeProbesTooLow.defaultMessageTypeId,
      partnerId,
      jobFunctionId: jobFunctionAdminId,
      level: 1,
      name: 'Probes Too Low Alert',
      ...auditFields,
    },
  ])
}
module.exports = seed
