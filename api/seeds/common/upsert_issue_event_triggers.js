const Promise = require('bluebird')
const _ = require('lodash')
const { upsertSingle } = require('../utils')
const {
  data: IssueEventTrigger,
} = require('../fixtures/IssueEventTrigger.json')

module.exports = upsertIssueEventTrigger

async function upsertIssueEventTrigger(knex, partnerName) {
  const now = new Date()
  await Promise.each(IssueEventTrigger, async issueEvent => {
    const { id: partnerId } = await knex('Partner')
      .where({ name: partnerName })
      .first()

    const [issueTypeId] = await knex('IssueType')
      .where({ externalId: issueEvent.issueType })
      .pluck('id')
    const [issueEventStatusId] = await knex('IssueEventStatus')
      .where({ externalId: issueEvent.issueEventStatus })
      .pluck('id')

    if (!issueTypeId) return

    await upsertSingle(
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
  await removeIssueTriggers(knex, partnerName)
}

async function removeIssueTriggers(knex, partnerName) {
  const { id: partnerId } = await knex('Partner')
    .where({ name: partnerName })
    .first()

  const issueTypesInserted = await knex('IssueEventTrigger').pluck(
    'issueTypeId'
  )
  const issueTypesInFixture = await Promise.map(
    IssueEventTrigger,
    async ({ issueType }) => {
      const [issueTypeId] = await knex('IssueType')
        .where({ externalId: issueType })
        .pluck('id')
      return issueTypeId
    }
  )

  await knex('IssueEventTrigger')
    .delete()
    .whereIn(
      'issueTypeId',
      _.difference(issueTypesInserted, issueTypesInFixture)
    )
    .where({ partnerId })
}
