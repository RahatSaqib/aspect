/* eslint-disable import/no-dynamic-require */

const { getPartnerByExternalId, seed } = require('../utils')
const { addIssueTypes } = require('../relativeObjectsSeeds')
const { seedIssueEscalationTrigger } = require('../utils')

const { partner, adminUserName, partnerPlugin: pluginName } = require(`../${process.env['seeds.directory'].replace(
  './seeds/',
  ''
)}/fixtures/partnerData`)

const { data: issueEventTriggerBase } = require('../fixtures/IssueEventTrigger.json')
const upsertIssueEventTrigger = require('../common/upsert_issue_event_triggers')

/**
 * NOTICE that new issue type 'DeviceExpectedBackOnline' was added in
 * - func getBaseIssues() in `api/seeds/relativeObjectsSeeds.js`
 * - file /fixtures/issueEventTrigger.json
 */
module.exports = seed(async knex => {
  /**
   * read some data
   */
  const { id: partnerId } = await getPartnerByExternalId(knex, partner.externalId)
  const [adminId] = await knex('User').where('name', adminUserName).pluck('id')

  /**
   * add all missing issue types and corresponding templates and MessageType
   * for issue definitions in func getBaseIssues() in `api/seeds/relativeObjectsSeeds.js`
   */
  await addIssueTypes(knex, partnerId, adminId, null)

  /**
   * get `issueEventTrigger` for current country or use `issueEventTrigger` from base fixture
   * for issue type 'DeviceExpectedBackOnline'
   */
  let issueEventTriggerPartner
  try {
    issueEventTriggerPartner = require(`../${process.env['seeds.directory'].replace(
      './seeds/',
      ''
    )}/fixtures/issueEventTrigger`)
  } catch {
    //
  }
  const issueEventTriggerFixture = issueEventTriggerPartner || issueEventTriggerBase

  /**
   * create/update issue triggers
   */
  await upsertIssueEventTrigger(knex, partner.externalId, issueEventTriggerFixture)

  const now = new Date()
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  /**
   * upsert issue escalation triggers
   */
  await seedIssueEscalationTrigger(knex, { partnerId, pluginName, auditFields })
}, __filename)
