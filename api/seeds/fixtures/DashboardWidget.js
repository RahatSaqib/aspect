const values = require('lodash/values')
const pick = require('lodash/pick')
const dashboardWidgetsBase = require('./dashboardWidgetsBase')

module.exports = {
  stat: values(pick(dashboardWidgetsBase.stat, ['devicesTitle', 'resultsTitle', 'sitesTitle'])),
}
