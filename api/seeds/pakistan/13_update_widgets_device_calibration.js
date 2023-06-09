const dashboardWidget = require('./fixtures/dashboardWidget')
const updateWidgets = require('../common/20210215_update_widgets_device_calibration')
const jobFunctionFixture = require('./fixtures/jobFunctions')
const { partner } = require('./fixtures/partnerData')

module.exports = require('../utils').seed(
  async knex => updateWidgets(knex, dashboardWidget, partner.externalId, jobFunctionFixture),
  __filename
)
