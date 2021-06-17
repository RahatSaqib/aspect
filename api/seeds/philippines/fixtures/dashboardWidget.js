const _ = require('lodash')
const dashboardWidgetsBase = require('../../../fixtures/dashboardWidgetsBase')

const { stat } = dashboardWidgetsBase

module.exports = {
  stat: _.omit(stat, [
    'serverUptimeTitle',
    'dashboardWidgetTitleTotalDeaths',
    'dashboardWidgetTitleConfirmedCases',
    'dashboardWidgetTitleTotalActiveCases',
    'dashboardWidgetTitleTotalRecoveredCases',
  ]),
}
