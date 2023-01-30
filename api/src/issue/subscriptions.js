const _ = require('lodash')
const Promise = require('bluebird')
const { issueCreated, issueTriggered, issueResolved } = require('./actions')
const { actionConditionsMet } = require('./actionEvaluation')
const { parseDateOrDefault } = require('../shared/date')
const { issueStatusToId, issueEventStatusToId } = require('../shared/dictionary')
const logger = require('../shared/logger')
const { createNewIssue, findOpenIssue, getActionData, hasIssueEventTrigger } = require('./common/db')

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
                  context.issueCreated(issue.id, issue.issueTypeId)
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

module.exports = {
  getIssueEventTriggerSubscriptions,
}
