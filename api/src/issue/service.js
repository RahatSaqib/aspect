const _ = require('lodash')
const Promise = require('bluebird')
const Boom = require('@hapi/boom')
const { loadPlugin } = require('../plugin/registration')
const { issueCreated, issueTriggered, issueAcknowledged, issueResolved } = require('./actions')
const { actionConditionsMet } = require('./actionEvaluation')
const { getUser } = require('../auth/service')
const { parseDateOrDefault } = require('../shared/date')
const { issueTypeToId, issueStatusToId, issueEventStatusToId } = require('../shared/dictionary')
const logger = require('../shared/logger')

async function getIssueEventTriggerSubscriptions({ messageContext }) {
  return messageContext.run(async knex => {
    const actionParameters = await knex('IssueEventTrigger as iet')
      .join('IssueType as it', 'it.id', 'iet.issueTypeId')
      .join('IssueEventStatus as ies', 'ies.id', 'iet.issueEventStatusId')
      .distinct(
        'it.externalId as issueType',
        'ies.externalId as issueEventStatus',
        'iet.partnerId',
        'iet.triggerConditions',
        'iet.filterIssueCondition'
      )
      .then(items =>
        items.reduce((memo, { issueType, issueEventStatus, partnerId, triggerConditions, filterIssueCondition }) => {
          const { action } = JSON.parse(triggerConditions)
          if (action != null) {
            if (issueEventStatus === 'Triggered') {
              memo[action] = [
                ...(memo[action] || []),
                {
                  partnerId,
                  issueType,
                  triggerConditions,
                  filterIssueCondition,
                  issueEventStatus,
                },
              ]
            } else if (issueEventStatus === 'Resolved') {
              memo[action] = [
                ...(memo[action] || []),
                {
                  issueType,
                  filterIssueCondition,
                  issueEventStatus,
                },
              ]
            }
          }
          return memo
        }, {})
      )
    const actions = {}
    Object.keys(actionParameters).forEach(actionKey => {
      actions[actionKey] = onIssueEvent(actionParameters[actionKey])
    })
    return { actions }
  })
}

function onIssueEvent(actionParametersList) {
  return async (action, { messageContext: context }) => {
    context.bindActionCreators({ issueCreated, issueTriggered, issueResolved })
    return context.transact(async knex => {
      return Promise.each(actionParametersList, async actionParameters => {
        logger.debug(['action', action], { reLabel: 'issues:onIssueEvent' })
        if (actionParameters.issueEventStatus === 'Triggered') {
          const { partnerId, issueType, triggerConditions, filterIssueCondition = null } = actionParameters
          const { suppressingConditions } = JSON.parse(triggerConditions)

          const shouldSuppressEventTriggering = !_.isNil(suppressingConditions)
            ? await actionConditionsMet(
                knex,
                action,
                partnerId,
                _.merge(suppressingConditions, {
                  evaluationFilterParameters: { issueType },
                }) || {}
              )
            : false
          if (!shouldSuppressEventTriggering) {
            const shouldTriggerEvent = await actionConditionsMet(
              knex,
              action,
              partnerId,
              JSON.parse(triggerConditions).conditions
            )
            logger.debug(
              {
                action_type: action.type,
                shouldTriggerEvent,
                issueEventStatus: actionParameters.issueEventStatus,
              },
              { reLabel: 'issues:onIssueEvent' }
            )
            if (shouldTriggerEvent) {
              const now = new Date()
              const openIssue = await findOpenIssue(knex, issueType, action, JSON.parse(filterIssueCondition))
              logger.debug(
                {
                  action_type: action.type,
                  shouldTriggerEvent,
                  issueEventStatus: actionParameters.issueEventStatus,
                  openIssue,
                },
                { reLabel: 'issues:onIssueEvent' }
              )
              let issue = null
              if (openIssue) {
                // ----------------------
                // check special usecase
                const { type, options = {} } = action
                if (type === 'INVENTORY_STOCKOUT') {
                  // get new value for daysDue
                  const { daysDue: daysDueNew } = options
                  // get stringified json of saved action.options from last time
                  const { data } = openIssue
                  if (data) {
                    const d = JSON.parse(data)
                    // get old value for daysDue
                    const { daysDue: daysDueOld } = d || {}
                    // if new and old values are 0 - exit because it means we already triggered issue after StockLevel = 0
                    // (i.e. daysDueOld is already 0) and no need to re-trigger it and update Issue table with new value of
                    // 'data' column with today's date (which is used then to refresh message in AlertMessage table).
                    // This is what customer requested to not happen, see jira ticket SD-804 for details
                    if (daysDueOld === 0 && daysDueNew === 0) {
                      return
                    }
                  }
                }
                // ----------------------
                issue = await mergeActionData(knex, openIssue, action)
              } else {
                logger.debug(
                  {
                    action_type: action.type,
                    shouldTriggerEvent,
                    openIssue,
                    issueEventStatus: actionParameters.issueEventStatus,
                    willCreateIssue: true,
                  },
                  { reLabel: 'issues:onIssueEvent' }
                )
                issue = await createNewIssue(knex, issueType, action)
                if (issue != null) {
                  context.issueCreated(issue.id)
                }
              }

              await knex('IssueEvent').insert({
                issueId: issue == null ? null : issue.id,
                issueEventStatusId: await issueEventStatusToId('Triggered'),
                data: JSON.stringify(action),
                createdOn: now,
              })

              if (issue != null) {
                context.issueTriggered(issue.id)
              }
            }
          }
        } else if (actionParameters.issueEventStatus === 'Resolved') {
          const { issueType, filterIssueCondition } = actionParameters
          const now = new Date()
          const issue = await findOpenIssue(knex, issueType, action, filterIssueCondition)
          const hasTrigger =
            issue != null &&
            issue.partnerId &&
            (await hasIssueEventTrigger(knex, {
              partnerId: issue.partnerId,
              issueType,
              action,
              issueEventStatus: 'Resolved',
            }))
          logger.debug(
            {
              action_type: action.type,
              openIssue: issue,
              issueEventStatus: actionParameters.issueEventStatus,
              hasTrigger,
            },
            { reLabel: 'issues:onIssueEvent' }
          )
          if (hasTrigger) {
            await knex('Issue')
              .where({ id: issue.id })
              .update({
                issueStatusId: await issueStatusToId('Resolved'),
                updatedOn: now,
              })
            logger.debug(
              {
                action_type: action.type,
                openIssue: issue,
                issueEventStatus: actionParameters.issueEventStatus,
                issueResolved: true,
              },
              { reLabel: 'issues:onIssueEvent' }
            )
            context.issueResolved(issue.id)
            await knex('IssueEvent').insert({
              issueId: issue.id,
              issueEventStatusId: await issueEventStatusToId('Resolved'),
              data: JSON.stringify(action),
              createdOn: now,
            })
          }
        }
      })
    })
  }
}

async function findOpenIssue(knex, issueType, action, filterIssueCondition = {}) {
  const evaluationFunction = _.get(filterIssueCondition, 'evaluationFunction')
  const findOpenIssue = knex('Issue as i')
    .join('IssueType as it', 'i.issueTypeId', 'it.id')
    .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .where({ 'it.externalId': issueType })
    .whereNotIn('is.externalId', ['Inactive', 'Resolved'])
    .orderBy('i.updatedOn', 'desc')

  if (action.deviceId) {
    findOpenIssue.where({ 'i.deviceId': action.deviceId })
  } else if (action.resultId) {
    findOpenIssue.where({ 'i.resultId': action.resultId })
  } else if (action.siteId) {
    findOpenIssue.where({ 'i.siteId': action.siteId })
  } else if (action.geographyId) {
    findOpenIssue.where({ 'i.geographyId': action.geographyId })
  } else if (action.partnerId) {
    findOpenIssue.where({ 'i.partnerId': action.partnerId })
  }

  if (_.get(action, 'options.data') && evaluationFunction) {
    const filterFunctions = await getIssueFilter(knex, action.partnerId, action.deviceId)
    if (filterFunctions[evaluationFunction])
      findOpenIssue.modify(filterFunctions[evaluationFunction], action.options.data)
  }
  return findOpenIssue.first('i.id', 'i.partnerId', 'i.data')
}

async function getIssueFilter(knex, partnerId, deviceId) {
  let plugin
  if (partnerId) {
    ;({ plugin } = await knex('Partner').where({ id: partnerId }).first('plugin'))
  } else if (deviceId) {
    ;({ plugin } = await knex('Device as d')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .where({ 'd.id': deviceId })
      .first('dt.plugin'))
  }
  return loadPlugin([plugin], 'filtersOpenIssues')
}

async function createNewIssue(knex, issueType, action) {
  const now = new Date()
  const issueTypeId = await issueTypeToId(issueType)
  if (issueTypeId == null) {
    // Issue not configured for this deployment
    return null
  }
  const issueStatusId = await issueStatusToId('Active')
  const { consumableId = null } = action

  const issueContext = await lookupIssueContext(action, knex)

  const issue = {
    issueStatusId,
    issueTypeId,
    consumableId,
    level: 1,
    createdOn: now,
    updatedOn: now,
    ..._.pick(issueContext, ['deviceId', 'siteId', 'geographyId', 'partnerId']),
    ..._.pick(action, ['resultId', 'deviceId', 'siteId', 'geographyId', 'partnerId']),
  }
  // Now that we know partnerId, check to see if we have a trigger
  const hasTrigger =
    issue != null &&
    issue.partnerId &&
    (await hasIssueEventTrigger(knex, {
      partnerId: issue.partnerId,
      issueType,
      action,
      issueEventStatus: 'Triggered',
    }))
  if (!hasTrigger) {
    return null
  }

  // populate remaining fields
  if (_.get(action, 'options.dueOn') != null) {
    issue.dueOn = parseDateOrDefault(action.options.dueOn)
  }
  issue.data = JSON.stringify(getActionData(action))

  // Everything is fine, create new issue
  const [issueId] = await knex('Issue').insert(issue)
  issue.id = issueId

  await knex('IssueStatusLog').insert({
    issueId,
    issueStatusId,
    createdOn: now,
    changedOn: now,
  })

  return issue
}

async function lookupIssueContext({ resultId, deviceId, siteId, consumableId }, knex) {
  if (resultId) {
    return knex('Result').where({ id: resultId }).first('deviceId', 'siteId', 'geographyId', 'partnerId')
  }
  if (deviceId) {
    return knex('Device as d')
      .leftJoin('Site as s', 's.id', 'd.siteId')
      .where({ 'd.id': deviceId })
      .first('d.partnerId', 'd.siteId', knex.raw('coalesce(d.geographyId, s.geographyId) as geographyId'))
  }
  if (siteId) {
    if (consumableId != null) {
      return knex('InventoryItem as ii')
        .innerJoin('Site as s', 'ii.siteId', 's.id')
        .innerJoin('Consumable as c', 'ii.consumableId', 'c.id')
        .leftJoin('PartnerConsumable as pc', function () {
          this.on('pc.consumableId', 'c.id').andOn('pc.partnerId', 's.partnerId')
        })
        .where('s.id', siteId)
        .andWhere('ii.consumableId', consumableId)
        .first('s.geographyId', knex.raw('COALESCE(pc.partnerId, s.partnerId) as partnerId'))
    }
    return knex('Site').where({ id: siteId }).first('geographyId', 'partnerId')
  }
  return Promise.resolve({})
}

async function hasIssueEventTrigger(knex, { partnerId, issueType, issueEventStatus, action }) {
  const issueTypeId = await issueTypeToId(issueType)
  const issueEventStatusId = await issueEventStatusToId(issueEventStatus)
  const issueEventTrigger = await knex('IssueEventTrigger')
    .where({ partnerId, issueTypeId, issueEventStatusId })
    .first('triggerConditions')
  if (issueEventTrigger == null) {
    return false
  }
  const conditions = JSON.parse(issueEventTrigger.triggerConditions)
  return conditions.action === action.type
}

async function mergeActionData(knex, issue, action) {
  const issueUpdates = {}
  if (_.get(action, 'options.dueOn') != null) {
    issueUpdates.dueOn = parseDateOrDefault(action.options.dueOn)
  }

  const actionData = getActionData(action)
  if (!_.isEmpty(actionData)) {
    const existingData = issue.data == null ? {} : JSON.parse(issue.data)
    issueUpdates.data = JSON.stringify(_.merge(existingData, actionData))
  }

  if (!_.isEmpty(issueUpdates)) {
    issueUpdates.updatedOn = new Date()
    await knex('Issue').where({ id: issue.id }).update(issueUpdates)
  }
  return _.merge({}, issue, issueUpdates)
}

function getActionData(action) {
  const actionData = {}
  if (action.options != null) {
    // include any keys in options in issue data that is not recorded elsewhere,
    // with preference to keys in data plain object
    _.merge(actionData, _.omit(action.options, ['dueOn', 'data']), action.options.data)
  }
  return actionData
}

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
    ..._.omit(require('../patient/actions'), ['types']),
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
  getAllActions,
  getIssueEventTriggerSubscriptions,
  triggerIssue,
  findOpenIssue,
  updateIssueStatus,
  createNewIssue,
}
