const addIssueDeviceAutoCalibrated = require('../common/20210203_add_issue_device_auto_calibration')
const { adminUserName, partnerName } = require('./fixtures/partnerData')

module.exports = require('../utils').seed(async knex => {
  await addIssueDeviceAutoCalibrated(knex, [], partnerName, adminUserName)
}, __filename)
