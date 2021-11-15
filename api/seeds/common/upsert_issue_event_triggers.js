const Promise = require('bluebird')
const _ = require('lodash')
const { upsertSingle } = require('../utils')
const {
  data: IssueEventTrigger,
} = require('../fixtures/IssueEventTrigger.json')
const {
  issueTypeToId,
  issueEventStatusToId,
} = require('../../src/shared/dictionary')

module.exports = upsertIssueEventTrigger

async function upsertIssueEventTrigger(knex, partnerName) {
  const now = new Date()
  await Promise.each(IssueEventTrigger, async issueEvent => {
    const { id: partnerId } = await knex('Partner')
      .where({ name: partnerName })
      .first()

    const issueTypeId = await issueTypeToId(issueEvent.issueType)
    const issueEventStatusId = await issueEventStatusToId(
      issueEvent.issueEventStatus
    )
    return upsertSingle(
      knex,
      'IssueEventTrigger',
      { partnerId, issueTypeId, issueEventStatusId },
      {
        ..._.omit(issueEvent, ['issueType', 'issueEventStatus']),
        partnerId,
        issueTypeId,
        issueEventStatusId,
        triggerConditions: JSON.stringify(issueEvent.triggerConditions),
        filterIssueCondition: issueEvent.filterIssueCondition
          ? JSON.stringify(issueEvent.filterIssueCondition)
          : null,
        createdOn: now,
        updatedOn: now,
      }
    )
  })
}
