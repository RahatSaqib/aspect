const seedHardwareIssues = require('../common/20201130_add_hardware_issues')
const { adminUserName, partnerName } = require('./fixtures/partnerData')

module.exports = require('../utils').seed(async knex => {
  await seedHardwareIssues(knex, {
    adminName: adminUserName,
    partnerName,
    jobFunctionsToNotify: ['Admin'],
  })
}, __filename)
