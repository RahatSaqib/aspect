const addIssue = require('../common/add_issue')

/* eslint-disable import/no-dynamic-require */
const { partnerName, adminName } = require(`../${process.env[
  'seeds.directory'
].replace('./seeds/', '')}/fixtures/partnerData`)

module.exports = require('../utils').seed(
  async knex =>
    addIssue(
      knex,
      'SiteWithLowFieldCompletionRate',
      ['admin', 'regionalOfficer'],
      partnerName,
      adminName,
      {
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveIssueSiteWithLowFieldCompletionRate', // The name of the function to evaluate if it should be resolved or not.
      }
    ),
  __filename
)
