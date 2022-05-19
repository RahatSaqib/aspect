// eslint-disable-next-line camelcase
const add_issue = require('../common/add_issue')

/* eslint-disable import/no-dynamic-require */
const { partnerName, adminName } = require(`./fixtures/partnerData`)

module.exports = require('../utils').seed(
  async knex =>
    add_issue(
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
