const Promise = require('bluebird')
const _ = require('lodash')
const { issueEscalated, escalateIssues } = require('./actions')
const { issueConditionsMet } = require('./issueEvaluation')
const { issueEventStatusToId } = require('../shared/dictionary')
const { alertMessageUpdateAfterIssueDataChanged } = require('../alert/actions')

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
    context.bindActionCreators({
      issueEscalated,
      alertMessageUpdateAfterIssueDataChanged,
    })
    context.transact(async knex => {
      const openIssuesToCheck = await findOpenIssuesToCheckForEscalation(
        knex,
        action.issueId
      )
      if (_.isEmpty(openIssuesToCheck)) {
        return Promise.resolve()
      }
      return Promise.each(openIssuesToCheck, async issueEscalationTrigger => {
        const shouldEscalate = await issueConditionsMet(
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
          context.alertMessageUpdateAfterIssueDataChanged(
            issueEscalationTrigger.id
          )
        }
      })
    })
  }
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
