module.exports = require('../utils').seed(seed, __filename)

const { seedIssueType, seedIssueEventTriggersForPartner, upsertNotificationTypes } = require('../utils')

async function seed(knex) {
  const { partnerId, userId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': 'admin' })
    .first('p.lastPartnerId as partnerId', 'p.userId')

  const issueTypeModule = await seedIssueType(knex, 'ProbeCheckTooHighModule', {
    userName: 'admin',
  })
  const issueTypeLot = await seedIssueType(knex, 'ProbeCheckTooHighLot', {
    userName: 'admin',
  })

  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['ProbeCheckTooHighLot', 'ProbeCheckTooHighModule'],
  })
  const auditFields = {
    createdOn: new Date(),
    createdBy: userId,
    updatedOn: new Date(),
    updatedBy: userId,
  }

  const issueTypeProbeCheckTooHighModule = await knex('IssueType').where({ id: issueTypeModule }).first()
  const issueTypeProbeCheckTooHighLot = await knex('IssueType').where({ id: issueTypeLot }).first()
  const { jobFunctionSuperAdminId } = await knex('JobFunction')
    .where({
      externalId: 'superAdmin',
      partnerId,
    })
    .first('id as jobFunctionSuperAdminId')
  await upsertNotificationTypes(knex, [
    {
      issueTypeId: issueTypeProbeCheckTooHighModule.id,
      messageTypeId: issueTypeProbeCheckTooHighModule.defaultMessageTypeId,
      partnerId,
      jobFunctionId: jobFunctionSuperAdminId,
      level: 1,
      name: 'Probe Check Too High - Module',
      ...auditFields,
    },
    {
      issueTypeId: issueTypeProbeCheckTooHighLot.id,
      messageTypeId: issueTypeProbeCheckTooHighLot.defaultMessageTypeId,
      partnerId,
      jobFunctionId: jobFunctionSuperAdminId,
      level: 1,
      name: 'Probe Check Too High - Lot',
      ...auditFields,
    },
  ])
}
module.exports = seed
