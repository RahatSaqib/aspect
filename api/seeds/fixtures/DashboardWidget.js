const dashboardWidgetsBase = require('./dashboardWidgetsBase')

const {
  stat: { personTitle, devicesTitle, resultsTitle, sitesTitle },
} = dashboardWidgetsBase

module.exports = {
  stat: [personTitle, devicesTitle, resultsTitle, sitesTitle],
}
