const pick = require('lodash/pick')
const values = require('lodash/values')
const dashboardWidgetsBase = require('../../fixtures/dashboardWidgetsBase')

module.exports = {
  stat: values(
    pick(dashboardWidgetsBase.stat, [
      'sitesTitle',
      'devicesTitle',
      'resultsTitle',
      'personTitle',
    ])
  ),
}
