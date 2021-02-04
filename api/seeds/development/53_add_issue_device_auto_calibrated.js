const addIssueDeviceAutoCalibrated = require('../common/20210203_add_issue_device_auto_calibration')
const partnerVariables = require('./fixtures/partnerVariables')

module.exports = require('../utils').seed(async knex => {
  await addIssueDeviceAutoCalibrated(
    knex,
    partnerVariables.jobFunctionsToNotify,
    partnerVariables.partnerName,
    partnerVariables.adminName
  )
}, __filename)
