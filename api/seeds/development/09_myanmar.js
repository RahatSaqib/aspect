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

  const { id: regionalOfficerJobFunctionId } = await knex('JobFunction as jf')
    .where({
      'jf.name': 'Regional Officer',
      'jf.partnerId': partnerId,
    })
    .first('jf.id')

  const roAlertTemplateIds = await knex('NotificationType as nt')
    .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .join('AlertTemplate as at', 'at.id', 'mt.alertTemplateId')
    .where({
      'nt.partnerId': partnerId,
      'nt.jobFunctionId': regionalOfficerJobFunctionId,
    })
    .andWhere('nt.name', 'like', 'RO %')
    .distinct('at.id')
    .pluck('at.id')

  await knex('AlertTemplate')
    .whereIn('id', roAlertTemplateIds)
    .update({
      templateSettings: JSON.stringify({
        onlyShowWhenSiteFilterIsNotSelected: true,
      }),
      updatedOn: now,
      updatedBy: myanmarAdminId,
    })

  const luRoViewAlertTemplates = await knex('NotificationType as nt')
    .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .join('AlertTemplate as at', 'at.id', 'mt.alertTemplateId')
    .where({
      'nt.partnerId': partnerId,
      'nt.jobFunctionId': regionalOfficerJobFunctionId,
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

  await Promise.each(luRoViewAlertTemplates, async luRoViewAlertTemplate => {
    const alertTemplateId = await knex('AlertTemplate').insert({
      message: luRoViewAlertTemplate.message,
      templateSettings: JSON.stringify({
        onlyShowWhenSiteFilterIsSelected: true,
      }),
      createdOn: now,
      createdBy: myanmarAdminId,
      updatedOn: now,
      updatedBy: myanmarAdminId,
    })

    const alertMessageIdsToUpdate = await knex('Notification as n')
      .join('AlertMessage as am', 'n.alertMessageId', 'am.id')
      .join('NotificationType as nt', 'n.notificationTypeId', 'nt.id')
      .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
      .where('mt.alertTemplateId', luRoViewAlertTemplate.alertTemplateId)
      .andWhere('nt.jobFunctionId', regionalOfficerJobFunctionId)
      .andWhere('nt.name', 'like', 'LU %')
      .andWhere('nt.name', 'like', '% - RO View')
      .distinct('am.id')
      .pluck('am.id')

    await knex('AlertMessage')
      .whereIn('id', alertMessageIdsToUpdate)
      .update({ alertTemplateId })

    const {
      notificationTypeId,
      messageSeverityId,
      emailTemplateId,
      smsTemplateId,
      webhookTemplateId,
    } = luRoViewAlertTemplate
    const messageTypeId = await knex('MessageType').insert({
      messageSeverityId,
      alertTemplateId,
      emailTemplateId,
      smsTemplateId,
      webhookTemplateId,
    })
    await knex('NotificationType')
      .where({ id: notificationTypeId })
      .update({ messageTypeId })
  })
}
