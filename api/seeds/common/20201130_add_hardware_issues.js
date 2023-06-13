const Promise = require('bluebird')

const addIssue = require('./add_issue')
const hardwareIssues = require('../fixtures/HardwareIssueTypes')

module.exports = async (knex, { partnerExternalId, adminUserName, jobFunctionsToNotify = [] }) =>
  Promise.each(hardwareIssues, async ({ externalId }) =>
    addIssue(knex, externalId, jobFunctionsToNotify, partnerExternalId, adminUserName)
  )
