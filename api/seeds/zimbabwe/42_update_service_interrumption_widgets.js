const dashboardWidget = require('./fixtures/dashboardWidget')
const updateServiceInterrumptionWidgetsLinkParams = require('../common/20210106_update_service_interrumption_widgets_link_params')

module.exports = require('../utils').seed(async knex => updateServiceInterrumptionWidgetsLinkParams(knex, dashboardWidget, 'Zimbabwe'))