const updateDeviceCalibrations = require('../common/20210208_set_device_calibration_dates')
const { partnerName, adminName } = require('./fixtures/partnerData')

module.exports = require('../utils').seed(
  async knex => updateDeviceCalibrations(knex, partnerName, adminName, 'US'),
  __filename
)
