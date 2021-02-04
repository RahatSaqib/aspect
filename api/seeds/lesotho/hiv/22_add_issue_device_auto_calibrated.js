const addIssueDeviceAutoCalibrated = require('../../common/20210203_add_issue_device_auto_calibration')
const { adminName, partnerName } = require('./fixtures/partnerVariables')

module.exports = require('../../utils').seed(async knex => {
  await addIssueDeviceAutoCalibrated(knex, [], partnerName, adminName)
}, __filename)
