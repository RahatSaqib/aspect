module.exports = require('../utils').seed(seed)

const {
  updateDashboardWidgetQueries,
  seedIssueEventTriggersForPartner,
} = require('../utils')

const { issueCategoryToId } = require('../../src/shared/dictionary')

async function seed(knex) {
  const moduleReplacedIssueType = await knex('IssueType')
    .where('externalId', 'ModuleReplaced')
    .first('id')

  if (moduleReplacedIssueType) {
    return
  }

  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Myanmar' })
    .first()

  await insertModuleReplacedIssue(knex)
  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['DeviceMaintenance', 'ModuleReplaced'],
  })
  await removeChildrenDashboardTarget(knex)
  await updateDashboardWidgetQueries(knex)
  await turnOffEmailSms(knex)
}

async function removeChildrenDashboardTarget(knex) {
  const { id: childrenWidgetId } = await knex('DashboardWidget')
    .where('title', 'Children')
    .first('id')

  await knex('JobFunctionDashboardWidget')
    .where('widgetId', childrenWidgetId)
    .delete()

  await knex('DashboardWidgetTarget')
    .where('targetToken', 'Children')
    .delete()

  await knex('DashboardWidget')
    .where('id', childrenWidgetId)
    .delete()

  await knex('Target')
    .where('targetToken', 'Children')
    .delete()
}

async function turnOffEmailSms(knex) {
  // turn off email/sms
  await knex('MessageType').update({
    emailTemplateId: null,
    smsTemplateId: null,
  })
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
