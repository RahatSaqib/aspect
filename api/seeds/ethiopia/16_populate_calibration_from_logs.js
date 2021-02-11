const populateCalibrationFromLogs = require('../common/20210211_populate_calibration_from-logs')

module.exports = require('../utils').seed(
  async knex => populateCalibrationFromLogs(knex),
  __filename
)
