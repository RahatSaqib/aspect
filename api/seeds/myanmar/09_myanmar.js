const { rowsAsObject } = require('../utils')

module.exports = require('../utils').seed(seed)

const geography = require('./fixtures/geography.json')
const _ = require('lodash')
const Promise = require('bluebird')

async function seed(knex) {
  // TODO: Check if seed file already ran

  await knex('AlertTemplate')
    .where({
      message:
        'Module {{issue.data.moduleName}} errors, conduct troubleshooting',
    })
    .update({
      message:
        'Possible module failure on module {{issue.data.moduleName}} contact engineer',
    })

  await knex('SmsTemplate')
    .where({
      message:
        'Module {{issue.data.moduleName}} errors, conduct troubleshooting',
    })
    .update({
      message:
        'Possible module failure on module {{issue.data.moduleName}} contact engineer',
    })

  await knex('EmailTemplate')
    .where({
      subject: 'Procedural Module Errors',
    })
    .update({
      subject: 'Possible module failure',
      body:
        'Possible module failure on module {{issue.data.moduleName}} contact engineer',
      htmlBody:
        'Possible module failure on module <em>{{issue.data.moduleName}}</em> contact engineer',
    })

  await knex('IssueEscalationTrigger')
    .update({
      escalationConditions: JSON.stringify({
        evaluationMethod: 'sql-script',
        evaluationParameter:
          './src/plugin/partner/Myanmar/sqlScripts/shouldEscalateL2NotificationAfter30Days.sql',
      }),
    })
    .whereRaw(
      'escalationConditions->>"$.evaluationParameter" LIKE "%/deviceOfflineLevel3ROEscalatedNetwork.sql"'
    )

  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Myanmar' })
    .first()

  await knex('IssueEscalationTrigger')
    .update({
      escalationConditions: JSON.stringify({
        evaluationMethod: 'sql-script',
        evaluationParameter:
          './src/plugin/partner/Myanmar/sqlScripts/shouldEscalateL2NotificationAfter7Days.sql',
      }),
    })
    .whereRaw(
      'escalationConditions->>"$.evaluationParameter" LIKE "%/deviceNoResultsLevel3ROEscalatedNoResults.sql"'
    )
    .andWhere('partnerId', partnerId)

  await knex('IssueResolutionTrigger')
    .update({
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'sql-script',
        evaluationParameter:
          './src/plugin/partner/Myanmar/sqlScripts/shouldResolveDeviceOffline.sql',
      }),
    })
    .whereRaw(
      'resolutionConditions->>"$.evaluationParameter" LIKE "%deviceOfflineResolveLUNetwork.sql"'
    )
    .andWhere('partnerId', partnerId)

  const deviceNoResultsIssueResolutionTrigger = await knex(
    'IssueResolutionTrigger as irt'
  )
    .join('Partner as p', 'irt.partnerId', 'p.id')
    .join('IssueType as it', 'irt.issueTypeId', 'it.id')
    .whereRaw(
      `irt.resolutionConditions->"$.evaluationParameter" = './src/plugin/partner/Myanmar/sqlScripts/shouldResolveDeviceNoResults.sql'`
    )
    .andWhere({
      'p.name': 'Myanmar',
      'it.externalId': 'DeviceNoResults',
    })
    .first()
  if (!deviceNoResultsIssueResolutionTrigger) {
    const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')
    const now = new Date()

    await knex('IssueResolutionTrigger').insert({
      issueTypeId: issueTypes.DeviceNoResults.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'sql-script',
        evaluationParameter:
          './src/plugin/partner/Myanmar/sqlScripts/shouldResolveDeviceNoResults.sql',
      }),
      createdOn: now,
      updatedOn: now,
    })
  }

  // SD-621 Ensure targets have updated values
  // TODO move Target updates to static utils
  await Promise.all(
    _.map(geography.countries[0].states, async state => {
      const geography = await knex('Geography')
        .join('State', 'Geography.stateId', 'State.id')
        .whereNotNull('stateId')
        .whereNull('lgaId')
        .where('State.name', state.name)
        .first('Geography.id')

      await Promise.all(
        _.map(state.targets, async (value, key) => {
          await knex('Target')
            .where({ geographyId: geography.id })
            .where({ targetToken: key })
            .update({ targetValue: value })
        })
      )
    })
  )

  // SD-589 Format Issue Dates
  await knex('AlertTemplate')
    .where({
      message: 'Stock-out expected {{issue.data.date}} - Order Stock.',
    })
    .update({
      message:
        'Stock-out expected {{formatDate issue.data.date}} - Order Stock.',
    })

  await knex('SmsTemplate')
    .where({
      message: 'Stock-out expected {{issue.data.date}} - Order Stock.',
    })
    .update({
      message:
        'Stock-out expected {{formatDate issue.data.date}} - Order Stock.',
    })

  await knex('EmailTemplate')
    .where({
      body: 'Stock-out expected {{issue.data.date}} - Order Stock.',
    })
    .update({
      body: 'Stock-out expected {{formatDate issue.data.date}} - Order Stock.',
      htmlBody:
        '<em>{{site.name}}:</em> Stock-out expected {{formatDate issue.data.date}} - Order Stock.',
    })

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
        hideWhenSiteFilterIsSelected: true,
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
        showWhenSiteFilterIsSelected: true,
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
