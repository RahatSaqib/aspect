const Promise = require('bluebird')
const _ = require('lodash')
const { issueEscalated, escalateIssues } = require('./actions')
const { issueConditionsMet } = require('./issueEvaluation')
const { issueEventStatusToId } = require('../shared/dictionary')
const { alertMessageUpdateAfterIssueDataChanged } = require('../alert/actions')

async function onIssueTriggered({ issueId }, { messageContext: context }) {
  // Check issue escalation logic for specific issue when triggered so we
  // do not need to wait for for next scheduled check.
  context.bindActionCreators({ escalateIssues })
  context.escalateIssues(issueId)
}

async function onEscalateIssues(action, { messageContext: context }) {
  context.bindActionCreators({
    issueEscalated,
    alertMessageUpdateAfterIssueDataChanged,
  })
  return context.transact(async knex => {
    const openIssuesToCheck = await findOpenIssuesToCheckForEscalation(knex, action.issueId)
    if (_.isEmpty(openIssuesToCheck)) {
      return Promise.resolve()
    }
    return Promise.each(openIssuesToCheck, async issueEscalationTrigger => {
      const shouldEscalate = await issueConditionsMet(knex, issueEscalationTrigger, issueEscalationTrigger.conditions)
      if (shouldEscalate) {
        await knex('Issue')
          .where('id', issueEscalationTrigger.id)
          .update({ level: issueEscalationTrigger.escalateToLevel })
        context.issueEscalated(issueEscalationTrigger.id, issueEscalationTrigger.escalateToLevel)
      } else {
        context.alertMessageUpdateAfterIssueDataChanged(issueEscalationTrigger.id)
      }
    })
  })
}

async function findOpenIssuesToCheckForEscalation(knex, issueId) {
  const resolvedIssueEventStatusId = await issueEventStatusToId('Resolved')
  const triggeredIssueEventStatusId = await issueEventStatusToId('Triggered')
  return knex('Issue as i')
    .leftJoin('IssueEvent as resolvedIssueEvent', function () {
      this.on('i.id', 'resolvedIssueEvent.issueId').on(
        'resolvedIssueEvent.issueEventStatusId',
        knex.raw(resolvedIssueEventStatusId)
      )
    })
    .join('IssueEvent as triggeredIssueEvent', function () {
      this.on('i.id', 'triggeredIssueEvent.issueId').on(
        'triggeredIssueEvent.issueEventStatusId',
        knex.raw(triggeredIssueEventStatusId)
      )
    })
    .join('IssueEscalationTrigger as iet', function () {
      this.on('i.issueTypeId', 'iet.issueTypeId')
        .on('i.partnerId', 'iet.partnerId')
        .on('i.level', '<', 'iet.escalateToLevel')
    })
    .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .where(function () {
      this.whereNotIn('is.externalId', ['Inactive', 'Resolved'])
      if (issueId) {
        this.andWhere('i.id', issueId)
      }
    })
    .andWhere(function () {
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
    .then(items =>
      items.map(issueEscalationTrigger => ({
        ...issueEscalationTrigger,
        conditions: JSON.parse(issueEscalationTrigger.conditions),
      }))
    )
}

module.exports = {
  onIssueTriggered,
  onEscalateIssues,
}
