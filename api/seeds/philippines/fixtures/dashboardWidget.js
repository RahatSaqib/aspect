const dashboardWidgetsBase = require('../../fixtures/dashboardWidgetsBase')

const {
  stat: { activeDevices, personTitle, devicesTitle, sitesTitle, resultsTitle },
} = dashboardWidgetsBase

module.exports = {
  stat: [sitesTitle, devicesTitle, resultsTitle, personTitle, activeDevices],
}
