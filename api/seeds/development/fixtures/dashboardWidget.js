const dashboardWidgetsBase = require('../../fixtures/dashboardWidgetsBase')

const { WIDGET_GROUP_KEYS } = dashboardWidgetsBase

module.exports = {
  stat: [
    {
      icon: 'MdPlace',
      title: 'Sites',
      titleI18nKey: 'sitesTitle',
      subTitle: null,
      subTitleI18nKey: null,
      sqlForIndicator: `select count(s.id) as cnt from Site as s left outer join Geography as g on s.geographyId = g.id left outer join State as st on g.stateId = st.id left outer join Lga as l on g.lgaId = l.id`,
      link: '/browse/site',
      sortOrder: 0,
      externalId: 'sitesTitle',
      description: 'The number of sites',
      descriptionI18nKey: 'sitesDescription',
      dashboards: {
        home: {},
      },
    },
    {
      icon: 'MdDesktopWindows',
      title: 'Devices',
      titleI18nKey: 'devicesTitle',
      subTitle: null,
      subTitleI18nKey: null,
      sqlForIndicator: `select count(d.id) as cnt from Device as d inner join Site as s on s.id = d.siteId inner join DeviceType as dt on dt.id = d.deviceTypeId inner join DeviceTypeCategory as dc on dc.id = dt.deviceTypeCategoryId left outer join Geography as g on s.geographyId = g.id where dc.hasResults = 1`,
      link: '/browse/device',
      sortOrder: 1,
      externalId: 'devicesTitle',
      description: 'The number of lab devices',
      descriptionI18nKey: 'devicesDescription',
      dashboards: {
        home: {},
        operational: {
          groupI18nKey: WIDGET_GROUP_KEYS.CONNECTIVITY,
        },
      },
    },
    {
      icon: 'MdAssignment',
      title: 'Results',
      titleI18nKey: 'resultsTitle',
      subTitle: 'Last 30 Days',
      subTitleI18nKey: 'subResultsTitle',
      sqlForIndicator: `select ifnull(sum(f.resultCount), 0) as cnt from FactResultsDevice as f inner join Device as d on d.id = f.deviceId inner join Site as s on s.id = d.siteId inner join Partner as p on p.id = s.partnerId left outer join Geography as g on s.geographyId = g.id where f.days = 30`,
      link: '/browse/result',
      sortOrder: 2,
      externalId: 'resultsTitle',
      description: 'The number of results in the last 30 days',
      descriptionI18nKey: 'resultsDescription',
      dashboards: {
        home: {},
      },
    },
    {
      icon: 'MdPermIdentity',
      title: 'Contacts',
      titleI18nKey: 'personTitle',
      subTitle: null,
      subTitleI18nKey: null,
      sqlForIndicator: 'select count(u.id) as cnt from User as u',
      link: '/browse/person',
      sortOrder: 3,
      externalId: 'personTitle',
      description: 'The number of users',
      descriptionI18nKey: 'personDescription',
      dashboards: {
        home: {},
      },
    },
    {
      icon: 'MdAddAlert',
      title: 'Confirmed cases',
      titleI18nKey: 'dashboardWidgetTitleConfirmedCases',
      subTitle: null,
      subTitleI18nKey: null,
      sqlForIndicator: `SELECT IFNULL(SUM(f.resultCount), 0) AS cnt FROM FactResultsDeviceByCategory1 AS f INNER JOIN Device AS d ON d.id = f.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON p.id = s.partnerId INNER JOIN Assay a ON f.assayId= a.id INNER JOIN ResultCategory rc ON f.resultCategory1 = rc.id LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id WHERE rc.externalid='Positive' and f.days=9999`,
      sqlForStatUnit: `SELECT IFNULL(SUM(f.resultCount), 0) AS cnt FROM FactResultsDeviceByCategory1 AS f INNER JOIN Device AS d ON d.id = f.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON p.id = s.partnerId INNER JOIN Assay a ON f.assayId= a.id INNER JOIN ResultCategory rc ON f.resultCategory1 = rc.id LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id WHERE rc.externalid='Positive' and f.days=7`,
      statUnit: '{unit} since last week',
      statUnitI18nKey: 'dashboardWidgetUnitConfirmedCases',
      link: '/browse/case?filters=',
      sortOrder: 4,
      externalId: 'dashboardWidgetTitleConfirmedCases',
      description: 'The number of positive results',
      descriptionI18nKey: 'confirmedCasesDescription',
      dashboards: {
        home: {},
      },
    },
    {
      icon: 'MdAssignment',
      title: 'Active cases',
      titleI18nKey: 'dashboardWidgetTitleTotalActiveCases',
      subTitle: null,
      subTitleI18nKey: null,
      sqlForIndicator: `SELECT IFNULL(COUNT(f.id), 0) AS cnt FROM Result AS f INNER JOIN Device AS d ON d.id = f.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON p.id = s.partnerId INNER JOIN Assay a ON f.assayId= a.id INNER JOIN ResultCategory rc ON f.resultCategory1 = rc.id LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id WHERE rc.externalid='Positive' AND NOT EXISTS (SELECT * FROM ResultFollowUp rfu INNER JOIN FollowUp fu ON fu.id=rfu.followUpId INNER JOIN FollowUpType ft ON fu.followUpTypeId =ft.id WHERE ft.externalid='outcome' AND rfu.resultId=f.id)`,
      sqlForStatUnit: `SELECT IFNULL(COUNT(f.id), 0) AS cnt FROM Result AS f INNER JOIN Device AS d ON d.id = f.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON p.id = s.partnerId INNER JOIN Assay a ON f.assayId= a.id INNER JOIN ResultCategory rc ON f.resultCategory1 = rc.id LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id WHERE rc.externalid='Positive' and f.createdOn >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND NOT EXISTS (SELECT * FROM ResultFollowUp rfu INNER JOIN FollowUp fu ON fu.id=rfu.followUpId INNER JOIN FollowUpType ft ON fu.followUpTypeId =ft.id WHERE ft.externalid='outcome' AND rfu.resultId=f.id)`,
      statUnit: '{unit} since last week',
      statUnitI18nKey: 'dashboardWidgetUnitActiveCases',
      link: '/browse/case?filters=',
      sortOrder: 5,
      externalId: 'dashboardWidgetTitleTotalActiveCases',
      description: 'The number of positive results that are still active',
      descriptionI18nKey: 'totalActiveCasesDescription',
      dashboards: {
        home: {},
      },
    },
    {
      icon: 'MdVerifiedUser',
      title: 'Recovered cases',
      titleI18nKey: 'dashboardWidgetTitleTotalRecoveredCases',
      subTitle: null,
      subTitleI18nKey: null,
      sqlForIndicator: `SELECT COUNT(rfu.resultId) as cnt FROM ResultFollowUp AS rfu INNER JOIN FollowUp AS fu ON fu.id = rfu.followUpId INNER JOIN FollowUpType AS ft ON fu.followUpTypeId = ft.id INNER JOIN Result AS r ON rfu.resultId = r.id INNER JOIN Device AS d ON d.id = r.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON p.id = s.partnerId WHERE ft.externalid = 'outcome' AND fu.externalId='Recovered'`,
      sqlForStatUnit: `SELECT COUNT(rfu.resultId) as cnt FROM ResultFollowUp AS rfu INNER JOIN FollowUp AS fu ON fu.id = rfu.followUpId INNER JOIN FollowUpType AS ft ON fu.followUpTypeId = ft.id INNER JOIN Result AS r ON rfu.resultId = r.id INNER JOIN Device AS d ON d.id = r.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON p.id = s.partnerId WHERE ft.externalid = 'outcome' AND fu.externalId='Recovered' AND rfu.createdOn >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      statUnit: '{unit} since last week',
      statUnitI18nKey: 'dashboardWidgetUnitRecoveredCases',
      link: '/browse/case?filters=',
      sortOrder: 6,
      externalId: 'dashboardWidgetTitleTotalRecoveredCases',
      description: `The number of results that belong to a patient that recovered`,
      descriptionI18nKey: 'totalActiveCasesDescription',
      dashboards: {
        home: {},
      },
    },
    {
      icon: 'MdEventBusy',
      title: 'Deaths',
      titleI18nKey: 'dashboardWidgetTitleTotalDeaths',
      subTitle: null,
      subTitleI18nKey: null,
      sqlForIndicator: `SELECT COUNT(rfu.resultId) as cnt FROM ResultFollowUp AS rfu INNER JOIN FollowUp AS fu ON fu.id = rfu.followUpId INNER JOIN FollowUpType AS ft ON fu.followUpTypeId = ft.id INNER JOIN Result AS r ON rfu.resultId = r.id INNER JOIN Device AS d ON d.id = r.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON p.id = s.partnerId WHERE fu.externalId='Died'`,
      sqlForStatUnit: `SELECT COUNT(rfu.resultId) as cnt FROM ResultFollowUp AS rfu INNER JOIN FollowUp AS fu ON fu.id = rfu.followUpId INNER JOIN FollowUpType AS ft ON fu.followUpTypeId = ft.id INNER JOIN Result AS r ON rfu.resultId = r.id INNER JOIN Device AS d ON d.id = r.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON p.id = s.partnerId WHERE fu.externalId='Died' AND rfu.createdOn >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      statUnit: '{unit} since last week',
      statUnitI18nKey: 'dashboardWidgetUnitDeathUnitCases',
      link: '/browse/case?filters=',
      sortOrder: 7,
      externalId: 'dashboardWidgetTitleTotalDeaths',
      description: 'The number of results that belong to a patient that died',
      descriptionI18nKey: 'dashboardWidgetDescriptionTotalDeaths',
      dashboards: {
        home: {},
      },
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
      sortOrder: 16,
    },
    {
      ...dashboardWidgetsBase.stat.find(
        x => x.externalId === 'instrumentsReplaced'
      ),
      sortOrder: 17,
    },
    {
      ...dashboardWidgetsBase.stat.find(x => x.externalId === 'unusedModules'),
      sortOrder: 18,
    },
  ],
}
