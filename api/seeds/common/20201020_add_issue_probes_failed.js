module.exports = require('../utils').seed(seed, __filename)

const { seedIssueType, seedIssueEventTriggersForPartner, upsertNotificationTypes } = require('../utils')

async function seed(knex) {
  const { partnerId, userId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': 'admin' })
    .first('p.lastPartnerId as partnerId', 'p.userId')

  const issueTypeModule = await seedIssueType(knex, 'ProbeCheckFailedModule', {
    userName: 'admin',
  })
  const issueTypeLot = await seedIssueType(knex, 'ProbeCheckFailedLot', {
    userName: 'admin',
  })

  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['ProbeCheckFailedLot', 'ProbeCheckFailedModule'],
  })
  const auditFields = {
    createdOn: new Date(),
    createdBy: userId,
    updatedOn: new Date(),
    updatedBy: userId,
  }

  const issueTypeProbeCheckFailedModule = await knex('IssueType').where({ id: issueTypeModule }).first()
  const issueTypeProbeCheckFailedLot = await knex('IssueType').where({ id: issueTypeLot }).first()
  const { jobFunctionAdminId } = await knex('JobFunction')
    .where({
      externalId: 'admin',
      partnerId,
    })
    .first('id as jobFunctionAdminId')
  await upsertNotificationTypes(knex, [
    {
      issueTypeId: issueTypeProbeCheckFailedModule.id,
      messageTypeId: issueTypeProbeCheckFailedModule.defaultMessageTypeId,
      partnerId,
      jobFunctionId: jobFunctionAdminId,
      level: 1,
      name: 'Probe Check Failed - Module',
      ...auditFields,
    },
    {
      issueTypeId: issueTypeProbeCheckFailedLot.id,
      messageTypeId: issueTypeProbeCheckFailedLot.defaultMessageTypeId,
      partnerId,
      jobFunctionId: jobFunctionAdminId,
      level: 1,
      name: 'Probe Check Failed - Lot',
      ...auditFields,
    },
  ])
}
module.exports = seed
