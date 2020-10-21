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
    .first('p.lastPartnerId as partnerId', 'p.userId')

  const issueTypeModule = await seedIssueType(
    knex,
    'ProbeCheckBackgroundErrorForAnalyteFailedModule',
    {
      userName: 'admin',
    }
  )
  const issueTypeLot = await seedIssueType(
    knex,
    'ProbeCheckBackgroundErrorForAnalyteFailedLot',
    {
      userName: 'admin',
    }
  )

  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: [
      'ProbeCheckBackgroundErrorForAnalyteFailedLot',
      'ProbeCheckBackgroundErrorForAnalyteFailedModule',
    ],
  })
  const auditFields = {
    createdOn: new Date(),
    createdBy: userId,
    updatedOn: new Date(),
    updatedBy: userId,
  }

  const probeCheckBackgroundErrorForAnalyteFailedModule = await knex(
    'IssueType'
  )
    .where({ id: issueTypeModule })
    .first()
  const probeCheckBackgroundErrorForAnalyteFailedLot = await knex('IssueType')
    .where({ id: issueTypeLot })
    .first()
  const { jobFunctionAdminId } = await knex('JobFunction')
    .where({
      externalId: 'admin',
      partnerId,
    })
    .first('id as jobFunctionAdminId')
  await upsertNotificationTypes(knex, [
    {
      issueTypeId: probeCheckBackgroundErrorForAnalyteFailedModule.id,
      messageTypeId:
        probeCheckBackgroundErrorForAnalyteFailedModule.defaultMessageTypeId,
      partnerId,
      jobFunctionId: jobFunctionAdminId,
      level: 1,
      name: 'Probe Check Background Error For Analyte Failed - Module',
      ...auditFields,
    },
    {
      issueTypeId: probeCheckBackgroundErrorForAnalyteFailedLot.id,
      messageTypeId:
        probeCheckBackgroundErrorForAnalyteFailedLot.defaultMessageTypeId,
      partnerId,
      jobFunctionId: jobFunctionAdminId,
      level: 1,
      name: 'Probe Check Background Error For Analyte Failed - Lot',
      ...auditFields,
    },
  ])
}
module.exports = seed
