const dashboardWidget = require('./fixtures/dashboardWidget')
const updateServiceInterruptionWidgetsLinkParams = require('../common/20210106_update_service_interruption_widgets_link_params')
const { partner } = require('./fixtures/partnerData')

module.exports = require('../utils').seed(
  async knex => updateServiceInterruptionWidgetsLinkParams(knex, dashboardWidget, partner.externalId),
  __filename
)
