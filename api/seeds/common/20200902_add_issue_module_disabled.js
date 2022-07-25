const { seedIssueType, seedIssueEventTriggersForPartner, upsertIssueResolutionTrigger } = require('../utils')

module.exports = async (knex, partnerData) => {
  const { id: partnerId } = await knex('Partner').where({ name: partnerData.partnerName }).first()

  await seedIssueType(knex, 'ModuleDisabled', {
    userName: partnerData.adminUserName || 'admin',
  })

  await seedIssueType(knex, 'ModuleReplaced', {
    userName: partnerData.adminUserName || 'admin',
  })

  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['ModuleDisabled', 'ModuleReplaced'],
  })
  const now = new Date()
  const { id: issueTypeId } = await knex('IssueType').where('externalId', 'ModuleDisabled').first('id')
  await upsertIssueResolutionTrigger(knex, {
    issueTypeId,
    partnerId,
    resolutionConditions: JSON.stringify({
      evaluationMethod: 'plugin-function',
      evaluationParameter: 'resolveIssueModuleDisabled',
    }),
    createdOn: now,
    updatedOn: now,
  })
}
