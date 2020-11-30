const dashboardWidgetsBase = require('./dashboardWidgetsBase')
const values = require('lodash/values')
const pick = require('lodash/pick')

module.exports = {
  stat: values(pick(dashboardWidgetsBase.stat, [
    'personTitle',
    'devicesTitle',
    'resultsTitle',
    'sitesTitle'
  ])),
}
