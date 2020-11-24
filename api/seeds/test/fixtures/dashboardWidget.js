const dashboardWidgetsBase = require('../../fixtures/dashboardWidgetsBase')

const {
  stat: { personTitle, devicesTitle, sitesTitle, resultsTitle },
  WIDGET_GROUP_KEYS,
} = dashboardWidgetsBase

module.exports = {
  stat: [
    sitesTitle,
    {
      ...devicesTitle,
      dashboards: {
        home: {},
        operational: {
          groupI18nKey: WIDGET_GROUP_KEYS.DEVICES,
        },
      },
    },
    resultsTitle,
    personTitle,
  ],
}
