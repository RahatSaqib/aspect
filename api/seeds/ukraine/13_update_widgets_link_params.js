const { partnerName } = require('./fixtures/partnerData')
const fixture = require('../fixtures/DashboardWidgetExtended')
const updateWidgetsLinkParams = require('../common/20201203_update_widgets_link_params')

module.exports = require('../utils').seed(async knex => updateWidgetsLinkParams(knex, partnerName, fixture), __filename)
