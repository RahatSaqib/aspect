const pick = require('lodash/pick')
const values = require('lodash/values')
const dashboardWidgetsBase = require('../../fixtures/dashboardWidgetsBase')

const {
  stat: { devicesTitle },
  WIDGET_GROUP_KEYS,
} = dashboardWidgetsBase

module.exports = {
  stat: [
    ...values(pick(dashboardWidgetsBase.stat, ['sitesTitle', 'resultsTitle'])),
    {
      ...devicesTitle,
      dashboards: {
        home: {},
        operational: {
          groupI18nKey: WIDGET_GROUP_KEYS.DEVICES,
        },
      },
    },
  ],
}
