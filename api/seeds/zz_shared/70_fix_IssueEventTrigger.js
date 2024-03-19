/* eslint-disable import/no-dynamic-require */
const {
  partner: { externalId: partnerExternalId },
} = require(`../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/partnerData`)

const upsertIssueEventTrigger = require('../common/upsert_issue_event_triggers')
// const issueEventTriggerFixture = require('../fixtures/issueEventTrigger')
const { data: issueEventTriggerBase } = require('../fixtures/issueEventTrigger')

module.exports = require('../utils').seed(async knex => {
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

  await upsertIssueEventTrigger(knex, partnerExternalId, issueEventTriggerFixture)

  /**
   * correct alert template message for issue `CalibrationDueDate` -
   * see in `api/seeds/relatedObjects/issues.js`
   */
  await knex('AlertTemplate')
    .where('message', 'Device Calibration due date is less than {{issue.data.dueDays}} close')
    .update({
      message: 'Device Calibration due date is less than {{device.daysToCalibrationDueDate}} close',
      updatedOn: new Date(),
    })
}, __filename)
