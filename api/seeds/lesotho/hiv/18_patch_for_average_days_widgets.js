const { partnerName } = require('./fixtures/partnerData')
const fixture = require('../../fixtures/DashboardWidgetExtended')
const updateWidgets = require('../../common/20201228_patch_for_average_days_widgets')

module.exports = require('../../utils').seed(
  async knex => updateWidgets(knex, partnerName, fixture),
  __filename
)
