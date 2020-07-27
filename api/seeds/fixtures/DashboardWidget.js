const dashboardWidgetsBase = require('./dashboardWidgetsBase')

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
      description: 'The number of sites',
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
      sortOrder: 1,
      externalId: 'devicesTitle',
      description: 'The number of lab devices',
      descriptionI18nKey: 'devicesDescription',
      dashboards: {
        home: {},
        operational: {
          groupI18nKey: WIDGET_GROUP_KEYS.DEVICES,
        },
      },
    },
    {
      jobFunctions: ['all'],
      icon: 'MdAssignment',
      title: 'Results',
      titleI18nKey: 'resultsTitle',
      subTitle: 'Last 30 Days',
      subTitleI18nKey: 'subResultsTitle',
      sqlForIndicator: `SELECT IFNULL(SUM(f.resultCount), 0) AS cnt FROM FactResultsDeviceByAssay AS f INNER JOIN Device AS d ON d.id = f.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON p.id = s.partnerId INNER JOIN Assay AS a ON f.assayId = a.id LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id WHERE f.days = 30`,
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
      jobFunctions: ['all'],
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
  ],
}
