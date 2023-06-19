const seedHardwareIssues = require('../common/20201130_add_hardware_issues')
const {
  adminUserName,
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')

module.exports = require('../utils').seed(async knex => {
  await seedHardwareIssues(knex, {
    adminUserName,
    partnerExternalId,
    jobFunctionsToNotify: ['Admin'],
  })
}, __filename)
