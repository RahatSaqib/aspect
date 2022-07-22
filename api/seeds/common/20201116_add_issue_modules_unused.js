const addIssue = require('./add_issue')

module.exports = async (knex, jobFunctionsToNotify, partnerName, adminName) => {
  await addIssue(knex, 'UnusedModules', jobFunctionsToNotify, partnerName, adminName, {
    evaluationMethod: 'plugin-function',
    evaluationParameter: 'resolveIssueUnusedModules', // The name of the function to evaluate if it should be resolved or not.
    evaluationFilterParameters: {
      minResults: 20,
      expectedUsedModules: 4,
    },
  })
}
