module.exports = require('../utils').seed(seed, __filename)

const { seedIssueEventTriggersForPartner } = require('../utils')

const { issueCategoryToId } = require('../../src/shared/dictionary')

const { updateDashboardWidgetQueries } = require('../utils_myanmar')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ name: 'Myanmar' }).first()

  if (partnerId) return
  await insertModuleReplacedIssue(knex)
  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['DeviceMaintenance', 'ModuleReplaced'],
  })
  await updateDashboardWidgetQueries(knex)
}

async function insertModuleReplacedIssue(knex) {
  const issueCategoryDeviceHealthId = await issueCategoryToId('DeviceHealth')
  await knex('IssueType').insert({
    name: 'Module Replaced',
    externalId: 'ModuleReplaced',
    i18nKey: 'issueTypeModuleReplaced',
    issueCategoryId: issueCategoryDeviceHealthId,
  })
}
