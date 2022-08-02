const values = require('lodash/values')
const pick = require('lodash/pick')
const dashboardWidgetsBase = require('./dashboardWidgetsBase')

module.exports = {
  stat: values(pick(dashboardWidgetsBase.stat, ['personTitle', 'devicesTitle', 'resultsTitle', 'sitesTitle'])),
}
