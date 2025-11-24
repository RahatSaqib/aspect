const Promise = require('bluebird')
const _ = require('lodash')
const { data: issueEventTrigger } = require('../fixtures/IssueEventTrigger.json')

module.exports = upsertIssueEventTrigger

async function upsertIssueEventTrigger(knex, partnerExternalId, fixture = issueEventTrigger) {
  const now = new Date()
  const { id: partnerId } = await knex('Partner').where({ externalId: partnerExternalId }).first()
  const issueTypeMap = Object.fromEntries(
    (
      await knex('IssueType').whereIn(
        'externalId',
        fixture.map(x => x.issueType)
      )
    ).map(x => [x.externalId, x.id])
  )

  const statusMap = Object.fromEntries(
    (
      await knex('IssueEventStatus').whereIn(
        'externalId',
        fixture.map(x => x.issueEventStatus)
      )
    ).map(x => [x.externalId, x.id])
  )

  const rows = []

  for (const issueEvent of fixture) {
    const issueTypeId = issueTypeMap[issueEvent.issueType]
    // eslint-disable-next-line no-continue
    if (!issueTypeId) continue

    const issueEventStatusId = statusMap[issueEvent.issueEventStatus]

    rows.push({
      ..._.omit(issueEvent, ['issueType', 'issueEventStatus']),
      partnerId,
      issueTypeId,
      issueEventStatusId,
      triggerConditions: JSON.stringify(issueEvent.triggerConditions),
      filterIssueCondition: issueEvent.filterIssueCondition ? JSON.stringify(issueEvent.filterIssueCondition) : null,
      createdOn: now,
      updatedOn: now,
    })
  }

  if (rows.length > 0) {
    await knex('IssueEventTrigger').insert(rows).onConflict(['partnerId', 'issueTypeId', 'issueEventStatusId']).merge()
  }

  await removeIssueTriggers(knex, partnerExternalId, fixture)
}

async function removeIssueTriggers(knex, partnerExternalId, fixture) {
  const { id: partnerId } = await knex('Partner').where({ externalId: partnerExternalId }).first()

  const issueTypesInserted = await knex('IssueEventTrigger').pluck('issueTypeId')
  const issueTypesInFixture = await Promise.map(fixture, async ({ issueType }) => {
    const [issueTypeId] = await knex('IssueType').where({ externalId: issueType }).pluck('id')
    return issueTypeId
  })

  await knex('IssueEventTrigger')
    .delete()
    .whereIn('issueTypeId', _.difference(issueTypesInserted, issueTypesInFixture))
    .where({ partnerId })
}
