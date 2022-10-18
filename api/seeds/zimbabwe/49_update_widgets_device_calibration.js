const dashboardWidget = require('./fixtures/dashboardWidget')
const updateWidgets = require('../common/20210215_update_widgets_device_calibration')
const jobFunctionFixture = require('./fixtures/jobFunctions')

module.exports = require('../utils').seed(
  async knex => updateWidgets(knex, dashboardWidget, 'Zimbabwe', jobFunctionFixture),
  __filename
)
