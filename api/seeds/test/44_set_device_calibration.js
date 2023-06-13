const updateDeviceCalibrations = require('../common/20210208_set_device_calibration_dates')
const {
  partner: { externalId: partnerExternalId },
  adminUserName,
} = require('./fixtures/partnerData')

module.exports = require('../utils').seed(
  async knex => updateDeviceCalibrations(knex, partnerExternalId, adminUserName, 'US'),
  __filename
)
