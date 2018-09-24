const Promise = require('bluebird')
const _ = require('lodash')
const { issueEscalated, escalateIssues } = require('./actions')
const { conditionsMet } = require('./evaluation')
const {
  issueEventStatusToId,
  issueTypeToId,
  messageStatusToId,
} = require('../shared/dictionary')
const { createAlertMessageFromTemplate } = require('../alert/service')

async function onIssueCreated({ issueId }, { messageContext: context }) {
  // Trigger escalation logic for level 1 as soon as issue is created,
  // higher levels handled in escalateIssues in escalations.js
  // escalation should be idempotent (as should response to other actions)
  // so it's OK if this is "at least once"
  // This also allows one message listener between created and escalated
  // if logic is shared and avoids potential race condition.
  context.bindActionCreators({ issueEscalated })
  context.issueEscalated(issueId, 1)
}

async function onIssueTriggered({ issueId }, { messageContext: context }) {
  // Check issue escalation logic for specific issue when triggered so we
  // do not need to wait for for next scheduled check.
  context.bindActionCreators({ escalateIssues })
  context.escalateIssues(issueId)
}

function onEscalateIssues() {
  return async (action, { messageContext: context }) => {
    context.bindActionCreators({ issueEscalated })
    context.transact(async knex => {
      const openIssuesToCheck = await findOpenIssuesToCheckForEscalation(
        knex,
        action.issueId
      )
      if (_.isEmpty(openIssuesToCheck)) {
        return Promise.resolve()
      }
      return Promise.each(openIssuesToCheck, async issueEscalationTrigger => {
        const shouldEscalate = await conditionsMet(
          knex,
          issueEscalationTrigger,
          issueEscalationTrigger.conditions
        )
        if (shouldEscalate) {
          await knex('Issue')
            .where('id', issueEscalationTrigger.id)
            .update({ level: issueEscalationTrigger.escalateToLevel })
          context.issueEscalated(
            issueEscalationTrigger.id,
            issueEscalationTrigger.escalateToLevel
          )
        } else {
          // update alert messages for some issue types
          const { id: issueId, issueTypeId, siteId } = issueEscalationTrigger
          await updateAlertMessages(knex, { issueId, issueTypeId, siteId })
        }
      })
    })
  }
}

async function updateAlertMessages(knex, { issueId, issueTypeId }) {
  // if issueType does not need to update alert message - exit
  // (later add here condition for DataCategoryLow* issue types which should update percentage in alert message)
  const issueTypeIdStockout = await issueTypeToId('InventoryStockout')
  if (issueTypeId !== issueTypeIdStockout) {
    return
  }

  const messageStatusId = await messageStatusToId('Sent')

  await knex('Notification as n')
    .innerJoin('NotificationType as nt', 'n.notificationTypeId', 'nt.id')
    .where('nt.issueTypeId', issueTypeId)
    .where('n.issueId', issueId)
    .select('n.alertMessageId')
    .map(async ({ alertMessageId }) => {
      // generate actual message
      const message = await createAlertMessageFromTemplate(knex, alertMessageId)
      await knex('AlertMessage')
        .where({ id: alertMessageId, messageStatusId }) // update only for Sent message status
        .whereNot('message', message) // update only if message text changed
        .update({
          message,
          updatedOn: new Date(),
        })
    })
}

async function findOpenIssuesToCheckForEscalation(knex, issueId) {
  const resolvedIssueEventStatusId = await issueEventStatusToId('Resolved')
  const triggeredIssueEventStatusId = await issueEventStatusToId('Triggered')
  return knex('Issue as i')
    .leftJoin('IssueEvent as resolvedIssueEvent', function() {
      this.on('i.id', 'resolvedIssueEvent.issueId').on(
        'resolvedIssueEvent.issueEventStatusId',
        knex.raw(resolvedIssueEventStatusId)
      )
    })
    .join('IssueEvent as triggeredIssueEvent', function() {
      this.on('i.id', 'triggeredIssueEvent.issueId').on(
        'triggeredIssueEvent.issueEventStatusId',
        knex.raw(triggeredIssueEventStatusId)
      )
    })
    .join('IssueEscalationTrigger as iet', function() {
      this.on('i.issueTypeId', 'iet.issueTypeId')
        .on('i.partnerId', 'iet.partnerId')
        .on('i.level', '<', 'iet.escalateToLevel')
    })
    .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .where(function() {
      this.whereNotIn('is.externalId', ['Inactive', 'Resolved'])
      if (issueId) {
        this.andWhere('i.id', issueId)
      }
    })
    .andWhere(function() {
      this.whereNull('resolvedIssueEvent.id')
    })
    .groupBy('i.id', 'iet.id')
    .orderBy(['i.createdOn', 'iet.escalateToLevel'], 'asc')
    .select(
      'i.*',
      'iet.escalateToLevel',
      'iet.escalationConditions as conditions',
      knex.raw('max(triggeredIssueEvent.createdOn) as triggeredOn')
    )
    .map(issueEscalationTrigger =>
      Object.assign({}, issueEscalationTrigger, {
        conditions: JSON.parse(issueEscalationTrigger.conditions),
      })
    )
}

module.exports = {
  onIssueCreated,
  onIssueTriggered,
  onEscalateIssues,
}
