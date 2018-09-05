const { rowsAsObject } = require('../utils')
const { getPermissionModules } = require('../utils')

module.exports = require('../utils').seed(seed)

const geography = require('./fixtures/geography.json')
const _ = require('lodash')
const Promise = require('bluebird')

async function seed(knex) {
  const alertTemplateWithHideFlag = await knex('AlertTemplate')
    .where('hideWhenSiteFilterIsSelected', 1)
    .orWhere('hideWhenSiteFilterIsNotSelected', 1)
    .first()

  if (alertTemplateWithHideFlag) {
    return
  }

  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')

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

  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Myanmar' })
    .first()

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
    .andWhere('partnerId', partnerId)

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

  await knex('PartnerConsumable').insert({
    partnerId,
    consumableId: consumableIdTb,
    allowStockUpdateFromActionDashboard: true,
  })

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

  const { id: actionDashboardInventoryLevelUpdateFeatureId } = await knex(
    'Feature as f'
  )
    .where('f.module', 'actionDashboardInventoryLevelUpdate')
    .first()

  const myanmarJobFunctions = await knex('JobFunction as jf')
    .where('jf.partnerId', partnerId)
    .select()

  const modules = await getPermissionModules(knex)

  await Promise.each(myanmarJobFunctions, async myanmarJobFunction => {
    await knex('JobFunctionFeature').insert({
      jobFunctionId: myanmarJobFunction.id,
      featureId: actionDashboardInventoryLevelUpdateFeatureId,
    })
    await knex('JobFunctionPermission').insert({
      jobFunctionId: myanmarJobFunction.id,
      permissionId:
        myanmarJobFunction.name === 'Admin'
          ? modules.actionDashboard.admin
          : modules.actionDashboard.edit,
    })
  })

  // turn off email/sms
  await knex('MessageType').update({
    emailTemplateId: null,
    smsTemplateId: null,
  })

  await knex('IssueResolutionTrigger').insert([
    {
      issueTypeId: issueTypes.ModuleFailureError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveModuleFailureError',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.ModuleTemperatureError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveModuleTemperatureError',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.MachineTemperatureError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveMachineTemperatureError',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.ModulePowerError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveModulePowerError',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.MachinePowerError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveMachinePowerError',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.ModuleProceduralError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveModuleProceduralError',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.MachineProceduralError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveMachineProceduralError',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.ModuleUnknownError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveModuleUnknownError',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.MachineUnknownError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveMachineUnknownError',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.issueStatusInventoryStockout.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveIssueStockout',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.issueStatusInventoryStockExpiring.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveIssueStockExpiring',
      }),
      createdOn: now,
      updatedOn: now,
    },
  ])
}
