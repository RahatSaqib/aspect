const seedHardwareIssues = require('../common/20201130_add_hardware_issues')
const partnerData = require('./fixtures/partnerData')

module.exports = require('../utils').seed(async knex => {
  const {
    partner: { externalId: partnerExternalId },
    adminUserName,
    jobFunctionsToNotify,
  } = partnerData
  await seedHardwareIssues(knex, { partnerExternalId, adminUserName, jobFunctionsToNotify })
}, __filename)
