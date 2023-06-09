const addIssue = require('../common/add_issue')

const {
  partner: { externalId: partnerExternalId },
  adminUserName,
} = require(`./fixtures/partnerData`)

module.exports = require('../utils').seed(
  async knex =>
    addIssue(knex, 'SiteWithLowFieldCompletionRate', ['admin', 'regionalOfficer'], partnerExternalId, adminUserName, {
      evaluationMethod: 'plugin-function',
      evaluationParameter: 'resolveIssueSiteWithLowFieldCompletionRate', // The name of the function to evaluate if it should be resolved or not.
    }),
  __filename
)
