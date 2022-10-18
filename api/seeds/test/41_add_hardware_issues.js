const _ = require('lodash')
const seedHardwareIssues = require('../common/20201130_add_hardware_issues')
const partnerVariables = require('./fixtures/partnerData')

module.exports = require('../utils').seed(async knex => {
  await seedHardwareIssues(knex, _.pick(partnerVariables, ['partnerName', 'adminName', 'jobFunctionsToNotify']))
}, __filename)
