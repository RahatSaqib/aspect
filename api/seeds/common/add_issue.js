const Promise = require('bluebird')

const {
  seedIssueType,
  seedIssueEventTriggersForPartner,
  upsertNotificationTypes,
  upsertIssueResolutionTrigger,
  getPartnerByName,
} = require('../utils')

module.exports = async (
  knex,
  externalId,
  jobFunctionsToNotify,
  partnerName,
  adminName,
  resolutionConditions = null
) => {
  const now = new Date()
  const { id: partnerId } = await getPartnerByName(knex, partnerName)
  const { userId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': adminName, 'p.lastPartnerId': partnerId })
    .first('p.userId')

  const issueTypeId = await seedIssueType(knex, externalId, {
    userName: adminName,
  })

  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: [externalId],
  })

  const auditFields = {
    createdOn: now,
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
  }

  const issueType = await knex('IssueType').where({ id: issueTypeId }).first()

  if (jobFunctionsToNotify && jobFunctionsToNotify.length > 0) {
    const jobFunctionIds = await knex('JobFunction')
      .whereIn('externalId', jobFunctionsToNotify)
      .where({
        partnerId,
      })
      .select('id')
    await Promise.each(jobFunctionIds, async ({ id: jobFunctionId }) =>
      upsertNotificationTypes(knex, [
        {
          issueTypeId: issueType.id,
          messageTypeId: issueType.defaultMessageTypeId,
          partnerId,
          jobFunctionId,
          level: 1,
          name: issueType.name,
          ...auditFields,
        },
      ])
    )
  }

  if (resolutionConditions) {
    await upsertIssueResolutionTrigger(knex, {
      issueTypeId: issueType.id,
      partnerId,
      resolutionConditions: JSON.stringify(resolutionConditions),
      createdOn: now,
      updatedOn: now,
    })
  }
}
