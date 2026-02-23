const _ = require('lodash')
const Boom = require('@hapi/boom')
const { issueAcknowledged } = require('./actions')
const { getUser } = require('../auth/service')

async function updateIssueStatus(request) {
  const {
    auth,
    params,
    payload,
    plugins: { messageContext },
  } = request
  const now = new Date()
  const { issueId } = params
  const { issueStatusExternalId } = payload
  const { id: currentUserId, personId } = await getUser(auth.credentials.name)
  let issueStatusId = null
  let issueStatusSeverityExternalId = 'High'

  if (issueStatusExternalId !== 'Acknowledged') {
    throw Boom.badRequest('Can only acknowledge issue from UI')
  }

  messageContext.bindActionCreators({ issueAcknowledged })
  await messageContext.transact(async knex => {
    // only allow acknowledge if issue active and current user
    // is a assigned a notification that can acknowledge
    const notification = await knex('Notification as n')
      .join('NotificationType as nt', 'nt.id', 'n.notificationTypeId')
      .join('Issue as i', 'i.id', 'n.issueId')
      .join('IssueStatus as is', 'is.id', 'i.issueStatusId')
      .where({
        'i.id': issueId,
        'n.personId': personId,
        'nt.canAcknowledge': 1,
        'is.externalId': 'Active',
      })
      .first('n.id')
    if (notification == null) {
      throw Boom.forbidden('No Active Issue to Acknowledge')
    }

    ;({ issueStatusId, issueStatusSeverityExternalId } = await knex('IssueStatus as is')
      .join('IssueStatusSeverity as iss', 'is.issueStatusSeverityId', 'iss.id')
      .where('is.externalId', issueStatusExternalId)
      .first('is.id as issueStatusId', 'iss.externalId as issueStatusSeverityExternalId'))

    await knex('Issue').where({ id: issueId }).update({
      issueStatusId,
      updatedOn: now,
    })

    await knex('IssueStatusLog').insert({
      issueId,
      issueStatusId,
      createdOn: now,
      changedOn: now,
      createdBy: currentUserId,
    })
    messageContext.issueAcknowledged(issueId)
  })

  return {
    ok: true,
    data: {
      issueId,
      issueStatusExternalId,
      issueStatusSeverityExternalId,
      createdOn: now,
      changedOn: now,
    },
  }
}

function getAllActions() {
  return {
    ..._.omit(require('../alert/actions'), ['types']),
    ..._.omit(require('../case/actions'), ['types']),
    ..._.omit(require('../device/actions'), ['types']),
    ..._.omit(require('../deviceApiRaw/actions'), ['types']),
    ..._.omit(require('../email/actions'), ['types']),
    ..._.omit(require('../fact/actions'), ['types']),
    ..._.omit(require('./actions'), ['types']), // i.e. ../issue/actions.js
    ..._.omit(require('../logger/actions'), ['types']),
    ..._.omit(require('../notification/actions'), ['types']),
    ..._.omit(require('../pushNotification/actions'), ['types']),
    ..._.omit(require('../sms/actions'), ['types']),
    ..._.omit(require('../webhook/actions'), ['types']),
  }
}

/**
 *
 * Triggers requested issue (registered in the system) by running corresponding action
 *
 * see 'api/test/issue/trigger.spec.js' for pattern how to make api calls
 */
async function triggerIssue(request) {
  const {
    payload: { data = {}, issueType },
    plugins: { messageContext },
  } = request

  // bind all actions defined for subscriptions in api/src/subscriptions.js
  messageContext.bindActionCreators({
    ...getAllActions(),
  })

  let triggered = false

  // eslint-disable-next-line default-case
  switch (issueType.toLowerCase()) {
    case 'DeviceOffline'.toLowerCase(): {
      const { deviceId, lastSeenOn, lastPingOn } = data
      await messageContext.deviceOffline(deviceId, { lastSeenOn, lastPingOn })
      triggered = true
      break
    }
    case 'DeviceNoResults'.toLowerCase(): {
      const { deviceId, lastResultOn } = data
      await messageContext.deviceNoResults(deviceId, { lastResultOn })
      triggered = true
      break
    }
    case 'InventoryStockExpiring'.toLowerCase(): {
      const { siteId, consumableId, dueDays, totalWasted } = data
      if (totalWasted > 0) {
        await messageContext.inventoryStockExpiring(siteId, consumableId, dueDays, totalWasted)
        triggered = true
      }
      break
    }
    case 'InventoryStockout'.toLowerCase(): {
      const { siteId, consumableId, dueDays, days } = data
      if (days < dueDays) {
        await messageContext.inventoryStockout(siteId, consumableId, days)
        triggered = true
      }
      break
    }
    case 'NewResultsAvailable'.toLowerCase(): {
      await messageContext.factNewResultsAvailableCheck()
      triggered = true
      break
    }
    case 'ResultReceived': {
      break
    }
    case 'DeviceMaintenance'.toLowerCase(): {
      const { deviceId, dueOn, maintenanceData } = data
      await messageContext.deviceMaintenance(deviceId, {
        dueOn,
        data: maintenanceData,
      })
      triggered = true
      break
    }
    case 'ModuleFailureError'.toLowerCase(): {
      const { deviceId, options } = data
      await messageContext.resultModuleFailureError(deviceId, options)
      triggered = true
      break
    }
    case 'ModuleTemperatureError'.toLowerCase(): {
      const { deviceId, options } = data
      await messageContext.resultModuleTemperatureError(deviceId, options)
      triggered = true
      break
    }
    case 'ModulePowerError'.toLowerCase(): {
      const { deviceId, options } = data
      await messageContext.resultModulePowerError(deviceId, options)
      triggered = true
      break
    }
    case 'MachineTemperatureError'.toLowerCase(): {
      const { deviceId } = data
      await messageContext.resultMachineTemperatureError(deviceId)
      triggered = true
      break
    }
    case 'MachinePowerError'.toLowerCase(): {
      const { deviceId } = data
      await messageContext.resultMachinePowerError(deviceId)
      triggered = true
      break
    }
    case 'ModuleProceduralError'.toLowerCase(): {
      const { deviceId, options } = data
      await messageContext.resultModuleProceduralError(deviceId, options)
      triggered = true
      break
    }
    case 'MachineProceduralError'.toLowerCase(): {
      const { deviceId } = data
      await messageContext.resultMachineProceduralError(deviceId)
      triggered = true
      break
    }
    case 'StockLevelUpdate'.toLowerCase(): {
      break
    }
    case 'ReagentHealthError'.toLowerCase(): {
      break
    }
    case 'MachineGenericError'.toLowerCase(): {
      break
    }
    case 'ModuleGenericError'.toLowerCase(): {
      break
    }
    case 'ModuleReplaced'.toLowerCase(): {
      const { resultId, deviceId, options } = data
      await messageContext.resultModuleReplaced(resultId, deviceId, options)
      triggered = true
      break
    }
    case 'ModuleDisabled'.toLowerCase(): {
      const { deviceId, disabledOn, moduleSerialNumber } = data
      await messageContext.deviceModuleDisabled(deviceId, moduleSerialNumber, disabledOn)
      triggered = true
      break
    }
    case 'ModuleUnknownError'.toLowerCase(): {
      const { deviceId, options } = data
      await messageContext.resultModuleUnknownError(deviceId, options)
      triggered = true
      break
    }
    case 'MachineUnknownError'.toLowerCase(): {
      const { deviceId } = data
      await messageContext.resultMachineUnknownError(deviceId)
      triggered = true
      break
    }
    case 'DataCategoryLowForHivStatus'.toLowerCase(): {
      break
    }
    case 'DataCategoryLowForPreviouslyTreated'.toLowerCase(): {
      break
    }
    case 'DataCategoryLowForMicroscopyResult'.toLowerCase(): {
      break
    }
    case 'DataCategoryLowForOther'.toLowerCase(): {
      break
    }
    case 'ResultUploaded'.toLowerCase(): {
      break
    }
    case 'ResultDataEntered'.toLowerCase(): {
      break
    }
    case 'InstrumentReplaced'.toLowerCase(): {
      const { device, options } = data
      await messageContext.deviceInstrumentReplaced(device, options)
      triggered = true
      break
    }
    case 'DeviceExpectedBackOnline'.toLowerCase(): {
      const { deviceId, maintenanceDueOn } = data
      await messageContext.deviceExpectedBackOnline(deviceId, maintenanceDueOn)
      triggered = true
      break
    }
  }

  return {
    ok: true,
    data: {
      issueType,
      triggered,
    },
  }
}

module.exports = {
  triggerIssue,
  updateIssueStatus,
}
