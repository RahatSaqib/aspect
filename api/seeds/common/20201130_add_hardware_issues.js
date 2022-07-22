const Promise = require('bluebird')

const addIssue = require('./add_issue')
const hardwareIssues = require('../fixtures/HardwareIssueTypes')

module.exports = async (knex, { partnerName, adminName, jobFunctionsToNotify = [] }) =>
  Promise.each(hardwareIssues, async ({ externalId }) =>
    addIssue(knex, externalId, jobFunctionsToNotify, partnerName, adminName)
  )
