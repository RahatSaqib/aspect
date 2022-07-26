const populateCalibrationFromLogs = require('../common/20210211_populate_calibration_from_logs')

module.exports = require('../utils').seed(async knex => populateCalibrationFromLogs(knex), __filename)
