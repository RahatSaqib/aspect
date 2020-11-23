const dashboardWidgetsBase = require('../../fixtures/dashboardWidgetsBase')

const { WIDGET_GROUP_KEYS } = dashboardWidgetsBase

const {
  statByKey: {
    gxPositiveResultsNotified,
    dashboardWidgetTestsPerDayTitle,
    dashboardWidgetValidResultsPc,
    utilizationRate,
    activeDevices,
    stockouts,
    deviceDaysActive,
    errorRate,
    stockNotRecorded,
    avgTimeToUpload,
    moduleSwaps,
    instrumentsReplaced,
    unusedModules,
    averageRecipientsOfEmail,
    averageRecipientsOfSms,
    averageLengthOfSms,
    smsSent,
    averageDaysModuleSwap,
    averageTimeToModuleReplacement,
    numberOfDevicesExperiencingServiceInterruption,
    averageDurationServiceInterruption,
    percentageOfDaysWithServiceInterruption,
    personTitle,
    devicesTitle,
    sitesTitle,
    resultsTitle,
    geneXpertDevices,
  } } = dashboardWidgetsBase

module.exports = {
  stat: [
    sitesTitle,
    devicesTitle,
    resultsTitle,
    personTitle,
    geneXpertDevices,
    gxPositiveResultsNotified,
    dashboardWidgetTestsPerDayTitle,
    dashboardWidgetValidResultsPc,
    utilizationRate,
    activeDevices,
    stockouts,
    deviceDaysActive,
    errorRate,
    stockNotRecorded,
    avgTimeToUpload,
    moduleSwaps,
    instrumentsReplaced,
    unusedModules,
    averageRecipientsOfEmail,
    averageRecipientsOfSms,
    averageLengthOfSms,
    smsSent,
    averageDaysModuleSwap,
    averageTimeToModuleReplacement,
    numberOfDevicesExperiencingServiceInterruption,
    averageDurationServiceInterruption,
    percentageOfDaysWithServiceInterruption,
    {
      externalId: 'serverUptimeTitle',
      jobFunctions: ['all'],
      sortOrder: 3,
      icon: 'MdNetworkCheck',
      title: 'Server Uptime',
      titleI18nKey: 'serverUptimeTitle',
      sqlForIndicator: `SELECT IFNULL(CONCAT(CAST(CAST(SUBSTR(uptime_last_2_months, POSITION('-' IN uptime_last_2_months) + 1) AS UNSIGNED) AS CHAR), '%'), '-') AS cnt
      FROM (
        SELECT fdes.data ->> '$.monitors[0].custom_uptime_ranges' AS uptime_last_2_months
          FROM DeviceType AS dt
          LEFT JOIN Device AS d ON dt.id = d.deviceTypeId
          LEFT JOIN Site AS s ON s.id = d.siteId
          LEFT JOIN Geography AS g ON s.geographyId = g.id
          LEFT JOIN FactDeviceExternalSource AS fdes ON d.id = fdes.deviceId AND fdes.sourceName = 'uptimeRobot'
          WHERE dt.externalId = 'Aspect'
          LIMIT 1
      ) AS innerQuery`,
      sqlForStatUnit: `
      SELECT IFNULL(CONCAT(CAST(CAST(SUBSTR(uptime_last_2_months, 1, POSITION('-' IN uptime_last_2_months) - 1) AS UNSIGNED) AS CHAR), '%'), '-') AS cnt
      FROM (
        SELECT fdes.data ->> '$.monitors[0].custom_uptime_ranges' AS uptime_last_2_months
          FROM DeviceType AS dt
          LEFT JOIN Device AS d ON dt.id = d.deviceTypeId
          LEFT JOIN Site AS s ON s.id = d.siteId
          LEFT JOIN Geography AS g ON s.geographyId = g.id
          LEFT JOIN FactDeviceExternalSource AS fdes ON d.id = fdes.deviceId AND fdes.sourceName = 'uptimeRobot'
          WHERE dt.externalId = 'Aspect'
          LIMIT 1
      ) AS innerQuery`,
      statUnit: '{unit} last month',
      statUnitI18nKey: 'dashboardWidgetUnitServerUptime',
      description: `The average uptime of the Aspect server this month.`,
      descriptionI18nKey: 'serverUptimeDescription',
      link: 'https://stats.uptimerobot.com/R6WjlCrRW4',
      dashboards: {
        operational: {
          groupI18nKey: WIDGET_GROUP_KEYS.CONNECTIVITY,
        },
      },
    },
  ],
}
