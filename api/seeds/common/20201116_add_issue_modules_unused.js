const addIssue = require('./add_issue')

module.exports = async (knex, jobFunctionsToNotify, partnerExternalId, adminUserName) => {
  await addIssue(knex, 'UnusedModules', jobFunctionsToNotify, partnerExternalId, adminUserName, {
    evaluationMethod: 'plugin-function',
    evaluationParameter: 'resolveIssueUnusedModules', // The name of the function to evaluate if it should be resolved or not.
    evaluationFilterParameters: {
      minResults: 20,
      expectedUsedModules: 4,
    },
  })
}
