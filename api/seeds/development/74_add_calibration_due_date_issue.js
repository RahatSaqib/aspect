// eslint-disable-next-line camelcase
const add_issue = require('../common/add_issue')

/* eslint-disable import/no-dynamic-require */
const {
  partner: { externalId: partnerExternalId },
  adminUserName,
} = require(`../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/partnerData`)

module.exports = require('../utils').seed(async knex => {
  await knex('DeviceType')
    .where('externalId', 'CepheidGeneXpert')
    .update({ deviceOperationSchema: JSON.stringify({ calibrationValidityInDays: 365 }) })

  await add_issue(knex, 'CalibrationDueDate', null, partnerExternalId, adminUserName, {
    evaluationMethod: 'plugin-function',
    evaluationParameter: 'resolveIssueCalibrationDueDate', // The name of the function to evaluate if it should be resolved or not.
  })
}, __filename)
