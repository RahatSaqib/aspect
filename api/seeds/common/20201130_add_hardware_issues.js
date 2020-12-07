const Promise = require('bluebird')

const addIssue = require('./add_issue')
const hardwareIssues = require('../fixtures/HardwareIssueTypes')

module.exports = async (
  knex,
  { partnerName, adminName, jobFunctionsToNotify = [] }
) =>
  Promise.each(hardwareIssues, async ({ errorCode, externalId }) =>
    addIssue(knex, externalId, jobFunctionsToNotify, partnerName, adminName, {
      evaluationMethod: 'plugin-function',
      evaluationParameter: 'resolveHardwareIssue',
      evaluationFilterParameters: {
        errorCode,
      },
    })
  )
