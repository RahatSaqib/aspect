const _ = require('lodash')
const dashboardWidgetsBase = require('../../fixtures/dashboardWidgetsBase')

const { stat } = dashboardWidgetsBase

module.exports = {
  stat: {
    ..._.omit(stat, [
      'serverUptimeTitle',
      'dashboardWidgetTitleTotalDeaths',
      'dashboardWidgetTitleConfirmedCases',
      'dashboardWidgetTitleTotalActiveCases',
      'dashboardWidgetTitleTotalRecoveredCases',
    ]),
    // THESE WIDGETS ARE STILL IN DEVELOPMENT AND WE WAITING FOR DEFINITIONS
    //   totalNumberOfModules: {
    //     jobFunctions: ['all'],
    //     icon: 'MdViewModule',
    //     title: 'Total Modules',
    //     titleI18nKey: 'totalModules',
    //     subTitle: null,
    //     subTitleI18nKey: null,
    //     sqlForIndicator: `
    // SELECT
    //  SUM(ROUND(IFNULL(dc.dailyCapacity, 12) / 2, 0)) AS cnt
    //  from Device as d
    //  INNER JOIN DeviceCapacity as dc ON d.deviceCapacityId=dc.id
    // `,
    //     sortOrder: 0,
    //     externalId: 'totalModules',
    //     description: 'Total Number Of Modules.',
    //     descriptionI18nKey: 'totalNoOfModules',
    //     dashboards: {
    //       home: {},
    //     },
    //   },
    //   activeModules: {
    //     jobFunctions: ['all'],
    //     icon: 'MdCheck',
    //     title: 'Active Modules',
    //     titleI18nKey: 'activeModules',
    //     subTitle: null,
    //     subTitleI18nKey: null,
    //     sqlForIndicator: `
    // SELECT
    //   SUM(q2.usedModulesInLast7Days) AS cnt
    // FROM
    //   (SELECT
    //       q.id,
    //           q.usedModulesInLast7Days,
    //           CASE WHEN q.activeModules = 0 THEN 0 ELSE
    //           (CASE
    //               WHEN q.activeModules <= 4 THEN 4
    //               ELSE (CASE
    //                   WHEN q.activeModules <= 16 THEN 16
    //                   ELSE (CASE
    //                       WHEN q.activeModules <= 48 THEN 48
    //                       ELSE 80
    //                   END)
    //               END)
    //           END) END AS totalModules
    //   FROM
    //       (SELECT
    //         d.id,
    //         COUNT(DISTINCT r.moduleName) AS usedModulesInLast7Days,
    //         IFNULL(innerQuery.cnt,0) AS activeModules
    //       FROM Device AS d
    //       LEFT JOIN (SELECT r2.deviceId,
    //         COUNT(DISTINCT r2.moduleName) AS cnt
    //         FROM Result AS r2
    //         GROUP BY r2.deviceId
    //       ) AS innerQuery ON d.id = innerQuery.deviceId
    //     INNER JOIN Site AS s ON s.id = d.siteId
    //     INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
    //     INNER JOIN DeviceTypeCategory AS dc ON dc.id = dt.deviceTypeCategoryId
    //     LEFT JOIN Geography AS g ON s.geographyId = g.id
    //     INNER JOIN Result AS r ON d.id = r.deviceId
    //     WHERE dc.hasResults = 1
    //       AND dt.externalId = 'CepheidGeneXpert'
    //     GROUP BY d.id) AS q) AS q2`,
    //     sortOrder: 0,
    //     externalId: 'activeModules',
    //     description: 'Total Number Of Active Modules.',
    //     descriptionI18nKey: 'totalNoOfActiveModules',
    //     dashboards: {
    //       home: {},
    //     },
    //   },
  },
}
