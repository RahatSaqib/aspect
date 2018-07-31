const Promise = require('bluebird')

module.exports = require('../utils').seed(seed)

async function seed(knex) {
  const { id: partnerId } = await knex('Partner')
    .where('name', 'Myanmar')
    .first('id')

  const myanmarConsumableIssues = await knex('IssueCategory as ic')
    .join('IssueType as it', 'ic.id', 'it.issueCategoryId')
    .join('Issue as i', 'it.id', 'i.issueTypeId')
    .where(function() {
      this.whereNull('i.consumableId')
        .andWhere('i.partnerId', partnerId)
        .andWhere('ic.name', 'Reagent Health')
    })
    .pluck('i.id')

  const { id: consumableIdTb } = await knex('Consumable')
    .where('name', 'GeneXpert TB Cartridge')
    .first('id')

  await knex('Issue')
    .whereIn('id', myanmarConsumableIssues)
    .update({ consumableId: consumableIdTb })

  await knex('Partner')
    .where('id', partnerId)
    .update({
      partnerSettings: JSON.stringify({
        'dashboard.action.allowStockUpdateForConsumableIds': [consumableIdTb],
      }),
    })

  await knex('JobFunction')
    .where({
      name: 'Admin',
      partnerId,
    })
    .update({ isAdmin: true })

  const now = new Date()
  const { id: myanmarAdminId } = await knex('User as u')
    .where('u.name', 'myanmar_admin')
    .first('u.id')

  const roAlertTemplates = await knex('NotificationType as nt')
    .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .join('AlertTemplate as at', 'at.id', 'mt.alertTemplateId')
    .join('JobFunction as jf', 'nt.jobFunctionId', 'jf.id')
    .where({
      'nt.partnerId': partnerId,
      'jf.name': 'Regional Officer',
    })
    .andWhere('nt.name', 'like', 'RO %')
    .distinct(
      'nt.id as notificationTypeId',
      'mt.messageSeverityId',
      'mt.alertTemplateId',
      'mt.emailTemplateId',
      'mt.smsTemplateId',
      'mt.webhookTemplateId',
      'at.message'
    )

  await Promise.each(roAlertTemplates, async roAlertTemplate => {
    const newRoAlertTemplateId = await knex('AlertTemplate').insert({
      message: roAlertTemplate.message,
      hideWhenSiteFilterIsSelected: true,
      createdOn: now,
      createdBy: myanmarAdminId,
      updatedOn: now,
      updatedBy: myanmarAdminId,
    })

    const alertMessageIdsToUpdate = await knex('Notification as n')
      .join('AlertMessage as am', 'n.alertMessageId', 'am.id')
      .join('NotificationType as nt', 'n.notificationTypeId', 'nt.id')
      .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
      .join('JobFunction as jf', 'nt.jobFunctionId', 'jf.id')
      .where({
        'mt.alertTemplateId': roAlertTemplate.alertTemplateId,
        'nt.partnerId': partnerId,
        'jf.name': 'Regional Officer',
      })
      .andWhere('nt.name', 'like', 'RO %')
      .distinct('am.id')
      .pluck('am.id')

    await knex('AlertMessage')
      .whereIn('id', alertMessageIdsToUpdate)
      .update({ alertTemplateId: newRoAlertTemplateId })

    const {
      notificationTypeId,
      messageSeverityId,
      emailTemplateId,
      smsTemplateId,
      webhookTemplateId,
    } = roAlertTemplate

    const newMessageTypeId = await knex('MessageType').insert({
      messageSeverityId,
      alertTemplateId: newRoAlertTemplateId,
      emailTemplateId,
      smsTemplateId,
      webhookTemplateId,
    })

    await knex('NotificationType')
      .where({ id: notificationTypeId })
      .update({ messageTypeId: newMessageTypeId })
  })

  const roLuViewAlertTemplates = await knex('NotificationType as nt')
    .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .join('AlertTemplate as at', 'at.id', 'mt.alertTemplateId')
    .join('JobFunction as jf', 'nt.jobFunctionId', 'jf.id')
    .where({
      'nt.partnerId': partnerId,
      'jf.name': 'Regional Officer',
    })
    .andWhere('nt.name', 'like', 'LU %')
    .andWhere('nt.name', 'like', '% - RO View')
    .distinct(
      'nt.id as notificationTypeId',
      'mt.messageSeverityId',
      'mt.alertTemplateId',
      'mt.emailTemplateId',
      'mt.smsTemplateId',
      'mt.webhookTemplateId',
      'at.message'
    )

  await Promise.each(roLuViewAlertTemplates, async luRoViewAlertTemplate => {
    const newRoLuViewAlertTemplateId = await knex('AlertTemplate').insert({
      message: luRoViewAlertTemplate.message,
      hideWhenSiteFilterIsNotSelected: true,
      createdOn: now,
      createdBy: myanmarAdminId,
      updatedOn: now,
      updatedBy: myanmarAdminId,
    })

    const alertMessageIdsToUpdate = await knex('Notification as n')
      .join('AlertMessage as am', 'n.alertMessageId', 'am.id')
      .join('NotificationType as nt', 'n.notificationTypeId', 'nt.id')
      .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
      .join('JobFunction as jf', 'nt.jobFunctionId', 'jf.id')
      .where({
        'mt.alertTemplateId': luRoViewAlertTemplate.alertTemplateId,
        'nt.partnerId': partnerId,
        'jf.name': 'Regional Officer',
      })
      .andWhere('nt.name', 'like', 'LU %')
      .andWhere('nt.name', 'like', '% - RO View')
      .distinct('am.id')
      .pluck('am.id')

    await knex('AlertMessage')
      .whereIn('id', alertMessageIdsToUpdate)
      .update({ alertTemplateId: newRoLuViewAlertTemplateId })

    const {
      notificationTypeId,
      messageSeverityId,
      emailTemplateId,
      smsTemplateId,
      webhookTemplateId,
    } = luRoViewAlertTemplate

    const newMessageTypeId = await knex('MessageType').insert({
      messageSeverityId,
      alertTemplateId: newRoLuViewAlertTemplateId,
      emailTemplateId,
      smsTemplateId,
      webhookTemplateId,
    })

    await knex('NotificationType')
      .where({ id: notificationTypeId })
      .update({ messageTypeId: newMessageTypeId })
  })

  const [actionDashboardInventoryLevelUpdateFeatureId] = await knex(
    'Feature'
  ).insert({ module: 'actionDashboardInventoryLevelUpdate' })

  const myanmarJobFunctionIds = await knex('JobFunction as jf')
    .where('jf.partnerId', partnerId)
    .pluck('jf.id')

  await Promise.each(myanmarJobFunctionIds, async myanmarJobFunctionId => {
    await knex('JobFunctionFeature').insert({
      jobFunctionId: myanmarJobFunctionId,
      featureId: actionDashboardInventoryLevelUpdateFeatureId,
    })
  })
}
