/* eslint-disable import/no-dynamic-require */
const { issueEventStatusToId } = require('../../src/shared/dictionary')
const { getPartnerByExternalId } = require('../utils')
const { upsertCepheidc360IssueType } = require('../commonCepheidC360InstrumentLogs')
const { ISSUE_TYPE_EXTERNAL_IDS } = require('../../src/shared/constants')

const partnerData = require(`../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/partnerData`)

module.exports = require('../utils').seed(async knex => {
  await upsertCepheidc360IssueType(knex)

  const { id: partnerId } = await getPartnerByExternalId(knex, partnerData.partner.externalId)

  // IssueType
  const { id: issueTypeId } =
    (await knex('IssueType as t')
      .where('t.externalId', ISSUE_TYPE_EXTERNAL_IDS.CepheidC360InstrumentLogsReceived)
      .first('t.id')) || {}

  // IssueEventTrigger
  let { id: issueEventTriggerId } =
    (await knex('IssueEventTrigger as t').where('t.issueTypeId', issueTypeId).first('t.id')) || {}
  if (!issueEventTriggerId) {
    const issueEventStatusTriggeredId = await issueEventStatusToId('Triggered')
    const issueEventTrigger = {
      partnerId,
      issueTypeId,
      issueEventStatusId: issueEventStatusTriggeredId,
      triggerConditions: '{"action": "CEPHEID_C360_INSTRUMENT_LOG_RECEIVED"}',
      filterIssueCondition: '{"skipFindingOpenIssue": true}',
      createdOn: '2024-01-01 00:00:00',
      updatedOn: '2024-01-01 00:00:00',
    }
    ;[issueEventTriggerId] = await knex('IssueEventTrigger').insert(issueEventTrigger)
  }
}, __filename)
