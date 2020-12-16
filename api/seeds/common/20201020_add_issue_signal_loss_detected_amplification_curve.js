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

  const issueType = await seedIssueType(
    knex,
    'SignalLossDetectedInAmplificationCurve',
    {
      userName: 'admin',
    }
  )

  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['SignalLossDetectedInAmplificationCurve'],
  })
  const auditFields = {
    createdOn: new Date(),
    createdBy: userId,
    updatedOn: new Date(),
    updatedBy: userId,
  }

  const issueTypeObject = await knex('IssueType')
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
      issueTypeId: issueTypeObject.id,
      messageTypeId: issueTypeObject.defaultMessageTypeId,
      partnerId,
      jobFunctionId: jobFunctionAdminId,
      level: 1,
      name: 'Signal Loss Detected in the Amplification Curve ',
      ...auditFields,
    },
  ])
}
module.exports = seed
