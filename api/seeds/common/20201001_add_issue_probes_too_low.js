module.exports = require('../utils').seed(seed, __filename)

const { seedIssueType, seedIssueEventTriggersForPartner, upsertNotificationTypes } = require('../utils')

async function seed(knex) {
  const { partnerId, userId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': 'admin' })
    .first('p.lastPartnerId as partnerId', 'p.id as personId', 'p.userId')

  const issueTypeModule = await seedIssueType(knex, 'ProbeCheckTooLowModule', {
    userName: 'admin',
  })
  const issueTypeLot = await seedIssueType(knex, 'ProbeCheckTooLowLot', {
    userName: 'admin',
  })

  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['ProbeCheckTooLowLot', 'ProbeCheckTooLowModule'],
  })
  const auditFields = {
    createdOn: new Date(),
    createdBy: userId,
    updatedOn: new Date(),
    updatedBy: userId,
  }

  const issueTypeProbeCheckTooLowModule = await knex('IssueType').where({ id: issueTypeModule }).first()
  const issueTypeProbeCheckTooLowLot = await knex('IssueType').where({ id: issueTypeLot }).first()
  const { jobFunctionSuperAdminId } = await knex('JobFunction')
    .where({
      externalId: 'superAdmin',
      partnerId,
    })
    .first('id as jobFunctionSuperAdminId')
  await upsertNotificationTypes(knex, [
    {
      issueTypeId: issueTypeProbeCheckTooLowModule.id,
      messageTypeId: issueTypeProbeCheckTooLowModule.defaultMessageTypeId,
      partnerId,
      jobFunctionId: jobFunctionSuperAdminId,
      level: 1,
      name: 'Probe Check Too Low - Module',
      ...auditFields,
    },
    {
      issueTypeId: issueTypeProbeCheckTooLowLot.id,
      messageTypeId: issueTypeProbeCheckTooLowLot.defaultMessageTypeId,
      partnerId,
      jobFunctionId: jobFunctionSuperAdminId,
      level: 1,
      name: 'Probe Check Too Low - Lot',
      ...auditFields,
    },
  ])
}
module.exports = seed
