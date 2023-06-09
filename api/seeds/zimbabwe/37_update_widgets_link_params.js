const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')
const fixture = require('./fixtures/dashboardWidget')
const updateWidgetsLinkParams = require('../common/20201203_update_widgets_link_params')

module.exports = require('../utils').seed(
  async knex => updateWidgetsLinkParams(knex, partnerExternalId, fixture),
  __filename
)
