const Promise = require('bluebird')

const {
  seedIssueType,
  seedIssueEventTriggersForPartner,
  upsertNotificationTypes,
  upsertIssueResolutionTrigger,
  getPartnerByName
} = require('../utils')

module.exports = async (knex, externalId, jobFunctionsWhiteList, partnerName, adminName, resolutionConditions = null) => {
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

  const jobFunctionIds = await knex('JobFunction')
    .whereIn('externalId', jobFunctionsWhiteList)
    .where({
      partnerId,
    })
    .select('id')

  await Promise.each(jobFunctionIds, ({ id }) => upsertNotificationTypes(knex, [
    {
      issueTypeId: issueType.id,
      messageTypeId: issueType.defaultMessageTypeId,
      partnerId,
      jobFunctionId: id,
      level: 1,
      name: issueType.name,
      ...auditFields,
    },
  ]))


  // {
  //   evaluationMethod: 'plugin-function',
  //   evaluationParameter: 'resolveIssueUnusedModules', // The name of the function to evaluate if it should be resolved or not.
  //   evaluationFilterParameters: {
  //     minResults: 20,
  //     expectedUsedModules: 4
  //   }
  // }

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
