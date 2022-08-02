module.exports = require('../utils').seed(seed, __filename)

const { seedIssueType, seedIssueEventTriggersForPartner, upsertNotificationTypes } = require('../utils')

async function seed(knex) {
  const { partnerId, userId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': 'admin' })
    .first('p.lastPartnerId as partnerId', 'p.id as personId', 'p.userId')

  const issueTypeModule = await seedIssueType(knex, 'SignalLossDetectedInAmplificationCurveModule', {
    userName: 'admin',
  })
  const issueTypeLot = await seedIssueType(knex, 'SignalLossDetectedInAmplificationCurveLot', {
    userName: 'admin',
  })

  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['SignalLossDetectedInAmplificationCurveLot', 'SignalLossDetectedInAmplificationCurveModule'],
  })
  const auditFields = {
    createdOn: new Date(),
    createdBy: userId,
    updatedOn: new Date(),
    updatedBy: userId,
  }

  const issueTypeModuleObject = await knex('IssueType').where({ id: issueTypeModule }).first()
  const issueTypeLotObject = await knex('IssueType').where({ id: issueTypeLot }).first()
  const { jobFunctionAdminId } = await knex('JobFunction')
    .where({
      externalId: 'admin',
      partnerId,
    })
    .first('id as jobFunctionAdminId')
  await upsertNotificationTypes(knex, [
    {
      issueTypeId: issueTypeModuleObject.id,
      messageTypeId: issueTypeModuleObject.defaultMessageTypeId,
      partnerId,
      jobFunctionId: jobFunctionAdminId,
      level: 1,
      name: 'Signal Loss Detected in the Amplification Curve - Module',
      ...auditFields,
    },
    {
      issueTypeId: issueTypeLotObject.id,
      messageTypeId: issueTypeLotObject.defaultMessageTypeId,
      partnerId,
      jobFunctionId: jobFunctionAdminId,
      level: 1,
      name: 'Signal Loss Detected in the Amplification Curve - Lot',
      ...auditFields,
    },
  ])
}
module.exports = seed
