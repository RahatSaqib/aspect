const { stat: dashboardWidgetsBase } = require('../../fixtures/dashboardWidgetsCommon')
const {
  stat: { totalModuleBays, activeModuleBays },
} = require('../../fixtures/dashboardWidgets')

module.exports = {
  stat: {
    ...dashboardWidgetsBase,
    totalModuleBays,
    activeModuleBays,
  },
}
