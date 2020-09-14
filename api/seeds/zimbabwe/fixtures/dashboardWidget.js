const dashboardWidgetsBase = require('../../fixtures/dashboardWidgetsBase')

const { WIDGET_GROUP_KEYS } = dashboardWidgetsBase

module.exports = {
  stat: [
    {
      jobFunctions: ['all'],
      icon: 'MdPlace',
      title: 'Sites',
      titleI18nKey: 'sitesTitle',
      subTitle: null,
      subTitleI18nKey: null,
      sqlForIndicator: `select count(s.id) as cnt from Site as s left outer join Geography as g on s.geographyId = g.id left outer join State as st on g.stateId = st.id left outer join Lga as l on g.lgaId = l.id`,
      link: '/browse/site',
      sortOrder: 0,
      externalId: 'sitesTitle',
      description: 'The number of sites.',
      descriptionI18nKey: 'sitesDescription',
      dashboards: {
        home: {},
      },
    },
    {
      jobFunctions: ['all'],
      icon: 'MdComputer',
      title: 'Devices',
      titleI18nKey: 'devicesTitle',
      subTitle: null,
      subTitleI18nKey: null,
      sqlForIndicator: `select count(d.id) as cnt from Device as d inner join Site as s on s.id = d.siteId inner join DeviceType as dt on dt.id = d.deviceTypeId inner join DeviceTypeCategory as dc on dc.id = dt.deviceTypeCategoryId left outer join Geography as g on s.geographyId = g.id where dc.hasResults = 1`,
      link: '/browse/device',
      sortOrder: 0,
      externalId: 'devicesTitle',
      description: 'The number of lab devices.',
      descriptionI18nKey: 'devicesDescription',
      dashboards: {
        home: {},
      },
    },
    {
      jobFunctions: ['all'],
      icon: 'MdAssignment',
      title: 'Results',
      titleI18nKey: 'resultsTitle',
      subTitle: 'Last 30 Days',
      subTitleI18nKey: 'subResultsTitle',
      sqlForIndicator: `select ifnull(sum(f.resultCount), 0) as cnt from FactResultsDevice as f inner join Device as d on d.id = f.deviceId inner join Site as s on s.id = d.siteId inner join Partner as p on p.id = s.partnerId left outer join Geography as g on s.geographyId = g.id where f.days = 30`,
      link: '/browse/result',
      sortOrder: 2,
      externalId: 'resultsTitle',
      description: 'The number of results in the last 30 days.',
      descriptionI18nKey: 'resultsDescription',
      dashboards: {
        home: {},
      },
    },
    {
      jobFunctions: ['all'],
      icon: 'MdPermIdentity',
      title: 'Contacts',
      titleI18nKey: 'personTitle',
      subTitle: null,
      subTitleI18nKey: null,
      sqlForIndicator: 'SELECT COUNT(p.id) AS cnt FROM Person as p',
      link: '/browse/person',
      sortOrder: 3,
      externalId: 'personTitle',
      description: 'The number of contacts in the system.',
      descriptionI18nKey: 'personDescription',
      dashboards: {
        home: {},
      },
    },
    {
      jobFunctions: ['all'],
      icon: 'MdComputer',
      title: 'GeneXpert Devices',
      titleI18nKey: 'geneXpertDevicesTitle',
      subTitle: null,
      subTitleI18nKey: null,
      sqlForIndicator: `select count(d.id) as cnt from Device as d inner join Site as s on s.id = d.siteId inner join DeviceType as dt on dt.id = d.deviceTypeId inner join DeviceTypeCategory as dc on dc.id = dt.deviceTypeCategoryId left outer join Geography as g on s.geographyId = g.id where dc.hasResults = 1 and dt.externalId = 'CepheidGeneXpert'`,
      sqlForStatUnit: `select count(d.id) as cnt from Device as d inner join Site as s on s.id = d.siteId inner join DeviceType as dt on dt.id = d.deviceTypeId inner join DeviceTypeCategory as dc on dc.id = dt.deviceTypeCategoryId left outer join Geography as g on s.geographyId = g.id where dc.hasResults = 1 and dt.externalId = 'CepheidGeneXpert'
          AND d.createdOn <=  DATE_FORMAT(NOW() ,'%Y-%m-01')`,
      statUnit: '{unit} last month',
      statUnitI18nKey: 'dashboardWidgetUnitGeneXpertDevices',
      link: '/browse/device',
      sortOrder: 0,
      externalId: 'geneXpertDevices',
      description: 'The number of approved GeneXpert devices.',
      descriptionI18nKey: 'geneXpertDevices',
      dashboards: {
        operational: {
          groupI18nKey: WIDGET_GROUP_KEYS.CONNECTIVITY,
        },
      },
    },
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
    {
      ...dashboardWidgetsBase.stat.find(
        x => x.externalId === 'gxPositiveResultsNotified'
      ),
    },
    {
      ...dashboardWidgetsBase.stat.find(
        x => x.externalId === 'dashboardWidgetTestsPerDayTitle'
      ),
    },
    {
      ...dashboardWidgetsBase.stat.find(
        x => x.externalId === 'dashboardWidgetValidResultsPc'
      ),
    },
    {
      ...dashboardWidgetsBase.stat.find(
        x => x.externalId === 'utilizationRate'
      ),
    },
    {
      ...dashboardWidgetsBase.stat.find(x => x.externalId === 'activeDevices'),
    },
    {
      ...dashboardWidgetsBase.stat.find(x => x.externalId === 'stockouts'),
    },
    {
      ...dashboardWidgetsBase.stat.find(
        x => x.externalId === 'deviceDaysActive'
      ),
    },
    {
      ...dashboardWidgetsBase.stat.find(x => x.externalId === 'errorRate'),
    },
    {
      ...dashboardWidgetsBase.stat.find(
        x => x.externalId === 'stockNotRecorded'
      ),
    },
    {
      ...dashboardWidgetsBase.stat.find(
        x => x.externalId === 'avgTimeToUpload'
      ),
      sortOrder: 6,
    },
    {
      ...dashboardWidgetsBase.stat.find(x => x.externalId === 'moduleSwaps'),
      sortOrder: 1,
    },
    {
      ...dashboardWidgetsBase.stat.find(
        x => x.externalId === 'instrumentsReplaced'
      ),
      sortOrder: 4,
    },
    {
      ...dashboardWidgetsBase.stat.find(x => x.externalId === 'unusedModules'),
      sortOrder: 3,
    },
    {
      ...dashboardWidgetsBase.stat.find(
        x => x.externalId === 'averageRecipientsOfEmail'
      ),
      sortOrder: 9,
    },
    {
      ...dashboardWidgetsBase.stat.find(
        x => x.externalId === 'averageRecipientsOfSms'
      ),
      sortOrder: 10,
    },
    {
      ...dashboardWidgetsBase.stat.find(
        x => x.externalId === 'averageLengthOfSms'
      ),
      sortOrder: 11,
    },
    {
      ...dashboardWidgetsBase.stat.find(x => x.externalId === 'smsSent'),
      sortOrder: 12,
    },
    {
      ...dashboardWidgetsBase.stat.find(
        x => x.externalId === 'averageDaysModuleSwap'
      ),
      sortOrder: 2,
    },
    {
      ...dashboardWidgetsBase.stat.find(
        x => x.externalId === 'averageTimeToModuleReplacement'
      ),
      sortOrder: 25,
    },
  ],
}
