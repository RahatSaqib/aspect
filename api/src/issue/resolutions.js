const Promise = require('bluebird')
const _ = require('lodash')
const { issueResolved } = require('./actions')
const { conditionsMet } = require('./evaluation')

function onResolveIssues() {
  return async (action, { messageContext: context }) => {
    context.bindActionCreators({ issueResolved })
    context.transact(async knex => {
      const openIssuesToCheck = await findOpenIssuesToCheckForResolution(
        knex,
        action.issueId
      )
      if (_.isEmpty(openIssuesToCheck)) {
        return Promise.resolve()
      }
      return Promise.each(openIssuesToCheck, async issueResolutionTrigger => {
        const shouldResolve = await conditionsMet(
          knex,
          issueResolutionTrigger,
          issueResolutionTrigger.conditions
        )
        if (shouldResolve) {
          context.issueResolved(issueResolutionTrigger.id)
        }
      })
    })
  }
}

async function findOpenIssuesToCheckForResolution(knex, issueId) {
  const resolvedIssueEventStatus = await knex('IssueEventStatus')
    .where('externalId', 'Resolved')
    .first()
  const triggeredIssueEventStatus = await knex('IssueEventStatus')
    .where('externalId', 'Triggered')
    .first()
  return knex('Issue as i')
    .leftJoin('IssueEvent as resolvedIssueEvent', function() {
      this.on('i.id', 'resolvedIssueEvent.issueId').on(
        'resolvedIssueEvent.issueEventStatusId',
        knex.raw(resolvedIssueEventStatus.id)
      )
    })
    .join('IssueEvent as triggeredIssueEvent', function() {
      this.on('i.id', 'triggeredIssueEvent.issueId').on(
        'triggeredIssueEvent.issueEventStatusId',
        knex.raw(triggeredIssueEventStatus.id)
      )
    })
    .join('IssueResolutionTrigger as irt', function() {
      this.on('i.issueTypeId', 'irt.issueTypeId').on(
        'i.partnerId',
        'irt.partnerId'
      )
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
    .groupBy('i.id', 'irt.id')
    .orderBy(['i.createdOn'], 'asc')
    .select(
      'i.*',
      'irt.resolutionConditions as conditions',
      knex.raw('max(triggeredIssueEvent.createdOn) as triggeredOn')
    )
    .map(issueResolutionTrigger =>
      Object.assign({}, issueResolutionTrigger, {
        conditions: JSON.parse(issueResolutionTrigger.conditions),
      })
    )
}

module.exports = {
  onResolveIssues,
}
