const addIssueDeviceAutoCalibrated = require('../common/20210203_add_issue_device_auto_calibration')

module.exports = require('../utils').seed(async knex => {
  await addIssueDeviceAutoCalibrated(knex, ['admin'], 'Partner One', 'admin')
}, __filename)
