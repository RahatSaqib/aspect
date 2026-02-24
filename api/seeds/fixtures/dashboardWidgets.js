const { INTERNAL_DEVICE_IDS } = require('../../src/shared/constants')

const commonUtilizationRateQuery = (dateCondition, startDate, endDate) => `
  SELECT CONCAT(ROUND(IFNULL(
        SUM(resultCount)/
        SUM(dailyTestCapacity * GetWeekdaysInRangeCustom(
          ${endDate},
          ${startDate},
          customWorkingDays->>"$.excludedDays",
          customWorkingDays->>"$.daysPerYear",
          customWorkingDays->>"$.daysPerQuarter",
          customWorkingDays->>"$.daysPerMonth")
        ) * 100,0),2),'%') AS cnt
  FROM (
    SELECT d.id AS deviceId, COUNT(r.id) AS resultCount, d.dailyTestCapacity, p.customWorkingDays
      FROM Device AS d
      INNER JOIN Partner AS p ON d.partnerId = p.id
      INNER JOIN DeviceType as dt on dt.id = d.deviceTypeId
      INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
      INNER JOIN Site AS s ON s.id = d.siteId
      LEFT OUTER JOIN Result AS r ON d.id = r.deviceId
        AND ${dateCondition}
      LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
    WHERE dtc.hasResults = 1
      AND dt.externalId = 'CepheidGeneXpert'
    GROUP BY d.id, d.dailyTestCapacity, p.customWorkingDays
  ) AS innerQuery`

const errorRateQueryLast30Days = `SELECT
  CONCAT(
    ROUND(
      IFNULL(
        SUM(errorCount)
        /
        SUM(resultCount) * 100
      ,0)
    ,0)
  ,'%') AS cnt
  FROM (
    SELECT r.deviceId, SUM(rc.name = 'Error') as errorCount, COUNT(r.id) AS resultCount, d.dailyTestCapacity
      FROM Result AS r
      INNER JOIN ResultCategory AS rc ON rc.id = r.resultCategory1
      INNER JOIN Device AS d ON d.id = r.deviceId
      INNER JOIN DeviceType as dt on dt.id = d.deviceTypeId
      INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
      INNER JOIN Site AS s ON s.id = d.siteId
      LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
    WHERE DATE(r.endedOn)
          BETWEEN DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01')
          AND LAST_DAY(NOW() - INTERVAL 1 MONTH)
          AND dtc.hasResults = 1
          AND dt.externalId = 'CepheidGeneXpert'
    GROUP BY r.deviceId, d.dailyTestCapacity
  ) AS innerQuery`

// helper funcs and vars
const partialValidResults = `SELECT
CASE
  WHEN count(r.id) = 0 THEN '0%'
  ELSE
    concat(
      round(
        100 *
        sum(case when rc.externalId not in ('Invalid', 'NoResult', 'Error') then 1 else 0 end)
        /
        count(r.id)
      ),
      '%'
    )
END as cnt
FROM Result as r
  INNER JOIN Device as d on d.id = r.deviceId
  INNER JOIN DeviceType as dt on dt.id = d.deviceTypeId
  INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
  INNER JOIN Site as s on s.id = d.siteId
  INNER JOIN Partner p on s.partnerId = p.id
  LEFT OUTER JOIN Geography as g on s.geographyId = g.id
  LEFT OUTER JOIN ResultCategory rc on r.resultCategory1 = rc.id
`
const WIDGET_GROUP_KEYS = {
  CONNECTIVITY: 'summaryWidgetGroupConnectivity',
  INVENTORY: 'summaryWidgetGroupInventory',
  DEVICES: 'summaryWidgetGroupDevices',
  SERVICE: 'summaryWidgetGroupService',
}

const WIDGET_FILTER_KEYS = {
  LAST_THIRTY_DAYS: 'last30Days',
  FIXED_LAST_THIRTY_DAYS: 'fixedLast30Days',
  CURRENT_MONTH: 'currentMonth',
  FIXED_CURRENT_MONTH: 'fixedCurrentMonth',
  PERSON_DISABLED: 0,
}

const positiveResults = `('Detected' , 'Trace Detected', 'MoreThan40', 'MoreThan150', 'MoreThan550', 'MoreThan1000', 'Resistant', 'Positive1', 'Positive2', 'Positive3', 'Scanty', 'PositiveMOTT', 'PositiveMTB', 'Positive')`

// props will be defined below for each object
const sqlSnippets = {}

const geneXpertDevices = {
  jobFunctions: ['all'],
  icon: 'MdDesktopWindows',
  title: 'GeneXpert Devices',
  titleI18nKey: 'geneXpertDevicesTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `select count(d.id) as cnt from Device as d inner join Site as s on s.id = d.siteId inner join DeviceType as dt on dt.id = d.deviceTypeId inner join DeviceTypeCategory as dc on dc.id = dt.deviceTypeCategoryId left outer join Geography as g on s.geographyId = g.id where dc.hasResults = 1 and dt.externalId = 'CepheidGeneXpert'`,
  sqlForStatUnit: `select count(d.id) as cnt from Device as d inner join Site as s on s.id = d.siteId inner join DeviceType as dt on dt.id = d.deviceTypeId inner join DeviceTypeCategory as dc on dc.id = dt.deviceTypeCategoryId left outer join Geography as g on s.geographyId = g.id where dc.hasResults = 1 and dt.externalId = 'CepheidGeneXpert'
      AND d.createdOn <=  DATE_FORMAT(NOW() ,'%Y-%m-01')`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  link: '/browse/device/list',
  linkParams: {
    deviceType: 'CepheidGeneXpert',
  },
  sortOrder: 1,
  externalId: 'geneXpertDevices',
  description: 'The number of approved GeneXpert devices (excluding decommissioned devices).',
  descriptionI18nKey: 'geneXpertDevices',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.CONNECTIVITY,
    },
  },
}

const devicesTitle = {
  jobFunctions: ['all'],
  icon: 'MdDesktopWindows',
  title: 'Devices',
  titleI18nKey: 'devicesTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `select count(d.id) as cnt from Device as d inner join DeviceApproval da on d.deviceApprovalId = da.id inner join Site as s on s.id = d.siteId inner join DeviceType as dt on dt.id = d.deviceTypeId inner join DeviceTypeCategory as dc on dc.id = dt.deviceTypeCategoryId left outer join Geography as g on s.geographyId = g.id where da.token = 'approved' and dc.hasResults = 1 and dt.externalId not in ('${INTERNAL_DEVICE_IDS.join(
    "','"
  )}')`,
  link: '/browse/device/list',
  sortOrder: 1,
  externalId: 'devicesTitle',
  description: 'The number of approved devices that perform results (excluding decommissioned devices)',
  descriptionI18nKey: 'devicesDescription',
  dashboards: {
    home: {},
  },
}

const instrumentsConnected = {
  jobFunctions: ['all'],
  icon: 'MdDesktopWindows',
  title: 'Devices',
  titleI18nKey: 'instrumentsConnectedTitle2',
  subTitle: null,
  subTitleI18nKey: null,
  /**
   * Use here the same query as for `devicesTitle`, but instead of counting devices - i.e. `count(d.id)` -
   * we are getting sum of all instruments connected - i.e. `sum(d.instrumentsConnected)`
   */
  sqlForIndicator: `
    select sum(d.instrumentsConnected) as cnt
    from Device as d
      inner join DeviceApproval da on d.deviceApprovalId = da.id
      inner join Site as s on s.id = d.siteId
      inner join DeviceType as dt on dt.id = d.deviceTypeId
      inner join DeviceTypeCategory as dc on dc.id = dt.deviceTypeCategoryId
      left outer join Geography as g on s.geographyId = g.id
    where da.token = 'approved' and
      dc.hasResults = 1 and
      dt.externalId not in ('${INTERNAL_DEVICE_IDS.join("','")}')
  `,
  link: '/browse/device/list',
  sortOrder: 2,
  externalId: 'instrumentsConnected',
  description: 'The number of devices connected.',
  descriptionI18nKey: 'instrumentsConnectedDescription',
  dashboards: {
    home: {},
  },
}

const resultsTitle = {
  jobFunctions: ['all'],
  icon: 'MdAssignment',
  title: 'Results',
  titleI18nKey: 'resultsTitle',
  subTitle: 'Last 30 Days',
  subTitleI18nKey: 'last30Days',
  sqlForIndicator: `select ifnull(sum(f.resultCount), 0) as cnt from FactResultsDeviceByAssay as f inner join Device as d on d.id = f.deviceId inner join Assay as a on a.id = f.assayId inner join Site as s on s.id = d.siteId inner join Partner as p on p.id = s.partnerId left outer join Geography as g on s.geographyId = g.id where f.days = 30`,
  link: '/browse/result',
  linkParams: {
    dateRange: WIDGET_FILTER_KEYS.FIXED_LAST_THIRTY_DAYS,
  },
  sortOrder: 3,
  externalId: 'resultsTitle',
  description: 'The number of results in the last 30 days',
  descriptionI18nKey: 'resultsDescription',
  dashboards: {
    home: {},
  },
}

const sitesTitle = {
  jobFunctions: ['all'],
  icon: 'MdPlace',
  title: 'Sites',
  titleI18nKey: 'sitesTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `select count(s.id) as cnt from Site as s left outer join Geography as g on s.geographyId = g.id left outer join State as st on g.stateId = st.id left outer join Lga as l on g.lgaId = l.id
  where s.externalId not in ('${INTERNAL_DEVICE_IDS.join("','")}')`,
  link: '/browse/site',
  sortOrder: 0,
  externalId: 'sitesTitle',
  description: 'The number of sites.',
  descriptionI18nKey: 'sitesDescription',
  dashboards: {
    home: {},
  },
}

const dashboardWidgetTestsPerDayTitle = {
  jobFunctions: ['all'],
  icon: 'MdDateRange',
  title: 'Tests Per Day',
  titleI18nKey: 'dashboardWidgetTestsPerDayTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `SELECT ROUND(COUNT(r.id)/GetWeekdaysInRange(CURRENT_DATE, DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'))) as cnt
  FROM Result as r
    INNER JOIN Device as d on d.id = r.deviceId
    INNER JOIN DeviceType as dt on dt.id = d.deviceTypeId
    INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
    INNER JOIN Site as s on s.id = d.siteId
    INNER JOIN Partner p on s.partnerId = p.id
    LEFT OUTER JOIN Geography as g on s.geographyId = g.id
  WHERE
    r.endedOn>= DATE_FORMAT(NOW(),"%Y-%m-01")
    AND DAYOFWEEK(r.endedOn) NOT IN (1,7)
    AND dtc.hasResults = 1`,
  sqlForStatUnit: `SELECT ROUND(COUNT(r.id)/GetWeekdaysInRange(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), '%Y-%m-01'))) as cnt
  FROM Result as r
    INNER JOIN Device as d on d.id = r.deviceId
    INNER JOIN DeviceType as dt on dt.id = d.deviceTypeId
    INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
    INNER JOIN Site as s on s.id = d.siteId
    INNER JOIN Partner p on s.partnerId = p.id
    LEFT OUTER JOIN Geography as g on s.geographyId = g.id
  WHERE
    r.endedOn>= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH),"%Y-%m-01")
    AND r.endedOn< DATE_FORMAT(NOW(),"%Y-%m-01")
    AND DAYOFWEEK(r.endedOn) NOT IN (1,7)
    AND dtc.hasResults = 1`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  link: '/browse/result',
  linkParams: {
    dateRange: WIDGET_FILTER_KEYS.FIXED_CURRENT_MONTH,
  },
  sortOrder: 4,
  externalId: 'dashboardWidgetTestsPerDayTitle',
  description: 'Average number of tests per weekday conducted this month.',
  descriptionI18nKey: 'dashboardWidgetTestsPerDayDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.DEVICES,
    },
  },
}

const dashboardWidgetValidResultsPc = {
  jobFunctions: ['all'],
  icon: 'MdCheck',
  title: 'Valid Results',
  titleI18nKey: 'dashboardWidgetValidResultsPc',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `${partialValidResults}
    WHERE
      r.endedOn>= DATE_FORMAT(NOW(),"%Y-%m-01")
      AND dtc.hasResults = 1
    `,
  sqlForStatUnit: `${partialValidResults}
    WHERE
      r.endedOn>= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH),"%Y-%m-01")
      AND r.endedOn< DATE_FORMAT(NOW(),"%Y-%m-01")
      AND dtc.hasResults = 1
  `,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  link: '/browse/result',
  linkParams: {
    onlyReportableResults: true,
    dateRange: WIDGET_FILTER_KEYS.FIXED_CURRENT_MONTH,
  },
  sortOrder: 5,
  externalId: 'dashboardWidgetValidResultsPc',
  description:
    'Percentage of valid results reported this month. Valid results includes all results that didn\'t result in "Error", "No Result", or "Invalid".',
  descriptionI18nKey: 'dashboardWidgetValidResultsPcDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.DEVICES,
    },
  },
  options: {
    extraFields: {
      alert: {
        dependsOn: 'count',
        whenIs: 'lessThan',
        comparedTo: '95%',
        representing: 'percentageOfValidResults',
      },
    },
  },
}

const utilizationRate = {
  jobFunctions: ['all'],
  icon: 'MdInsertChart',
  title: 'Utilization Rate',
  titleI18nKey: 'utilizationRateTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: commonUtilizationRateQuery(
    // this month
    "r.endedOn >= CONVERT_TZ(DATE_FORMAT(CONVERT_TZ(NOW(), 'UTC', '{timeZone}'), '%Y-%m-01'), '{timeZone}', 'UTC')", // r.endedOn > first day of the month in the country's timezone, converted to UTC
    "DATE_FORMAT(CONVERT_TZ(NOW(), 'UTC', '{timeZone}'),'%Y-%m-01')", // first day of this month in the country's timezone, then
    'NOW()'
  ),
  sqlForStatUnit: commonUtilizationRateQuery(
    // last month

    `r.endedOn >= CONVERT_TZ(DATE_FORMAT(DATE_SUB(CONVERT_TZ(NOW(), 'UTC', '{timeZone}'), INTERVAL 1 MONTH), '%Y-%m-01'),'{timeZone}', 'UTC')
       AND r.endedOn < CONVERT_TZ(DATE_FORMAT(CONVERT_TZ(NOW(), 'UTC', '{timeZone}'), '%Y-%m-01'), '{timeZone}', 'UTC')`, // r.endedOn < first day of this month in the country's timezone, then converted to UTC
    "DATE_FORMAT(DATE_SUB(CONVERT_TZ(NOW(), 'UTC', '{timeZone}'), INTERVAL 1 MONTH), '%Y-%m-01')", // first day of previous month in the country's timezone
    "DATE_SUB(DATE_FORMAT(CONVERT_TZ(NOW(), 'UTC', '{timeZone}'), '%Y-%m-01'), INTERVAL 1 DAY)" // Last day of previous month in the country's timezone
  ),
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  link: '/browse/device/list',
  linkParams: {
    dateRange: WIDGET_FILTER_KEYS.CURRENT_MONTH,
  },
  sortOrder: 6,
  externalId: 'utilizationRate',
  description:
    'The utilization rate is calculated by counting all tests conducted in the month and dividing that number by the total capacity of all devices. This calculation excludes weekends.',
  descriptionI18nKey: 'utilizationRateDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.DEVICES,
    },
  },
  options: {
    extraFields: {
      alert: {
        dependsOn: 'count',
        whenIs: 'lessThan',
        comparedTo: '50%',
        representing: 'utilizationRate',
      },
    },
  },
}

const activeDevicesCnt = {
  jobFunctions: ['all'],
  icon: 'MdCheck',
  title: 'Current Active/Online Devices',
  titleI18nKey: 'activeDevicesCntTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `SELECT SUM(dms.active) as cnt
  FROM Device AS d
  INNER JOIN DeviceMaintenanceStatusLog AS dmsl ON d.deviceMaintenanceStatusLogId = dmsl.id
  INNER JOIN DeviceMaintenanceStatus AS dms ON dmsl.deviceMaintenanceStatusId = dms.id
  INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
  INNER JOIN DeviceTypeCategory AS dtc ON dt.deviceTypeCategoryId = dtc.id
  INNER JOIN Site AS s ON s.id = d.siteId
  INNER JOIN Partner AS p ON s.partnerId = p.id
  LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
  WHERE dtc.hasResults = 1 and dt.externalId not in ('${INTERNAL_DEVICE_IDS.join("','")}')`,
  sqlForStatUnit: `SELECT SUM(CASE WHEN (d.lastPingOn BETWEEN DATE_ADD(NOW(), INTERVAL -1 DAY) AND NOW()) THEN 1 ELSE 0 END) as cnt
  FROM Device AS d
  INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
  INNER JOIN DeviceTypeCategory AS dtc ON dt.deviceTypeCategoryId = dtc.id
  INNER JOIN Site AS s ON s.id = d.siteId
  INNER JOIN Partner AS p ON s.partnerId = p.id
  LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
  WHERE dtc.hasResults = 1 and dt.externalId not in ('${INTERNAL_DEVICE_IDS.join("','")}')`,
  statUnit: 'of {unit} online',
  statUnitI18nKey: 'ofOnlineDevices',
  link: '/browse/device/list',
  linkParams: {
    deviceMaintenanceStatusId: ['active', 'reportedActive'],
  },
  sortOrder: 4,
  externalId: 'activeDevicesCnt',
  description: `Scoped to the last 24 hours, shows the number of devices that uploaded at least 1 test or were manually set es 'reported active', compared to the number of devices that pinged to Aspect at least 1 time (active vs online).`,
  descriptionI18nKey: 'activeDevicesCntDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.CONNECTIVITY,
    },
  },
}

const activeDevices = {
  jobFunctions: ['all'],
  icon: 'MdCheck',
  title: 'Active',
  titleI18nKey: 'activeDevicesTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `SELECT CONCAT(ROUND(SUM(dms.active = 1) * 100 / COUNT(dms.id), 0), '%') AS cnt
  FROM DeviceMaintenanceStatusLog AS dml
  LEFT OUTER JOIN DeviceMaintenanceStatusLog AS dms2 ON dml.deviceId = dms2.deviceId AND dml.day = dms2.day AND (dml.createdOn < dms2.createdOn OR (dml.createdOn = dms2.createdOn AND dml.id < dms2.id))
  INNER JOIN DeviceMaintenanceStatus AS dms ON dml.deviceMaintenanceStatusId = dms.id
  INNER JOIN Device AS d ON dml.deviceId = d.id
  INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
  INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
  INNER JOIN Site AS s ON s.id = d.siteId
  INNER JOIN Partner AS p ON s.partnerId = p.id
  LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
  WHERE dtc.hasResults = 1
  AND ISNULL(dms2.id)
  AND dml.day>= DATE_FORMAT(NOW(),"%Y-%m-01")
  AND DAYOFWEEK(dml.day) <> 1
  AND DAYOFWEEK(dml.day) <> 7`,
  sqlForStatUnit: `SELECT CONCAT(ROUND(SUM(dms.active = 1) * 100 / COUNT(dms.id), 0), '%') AS cnt
  FROM DeviceMaintenanceStatusLog AS dml
  LEFT OUTER JOIN DeviceMaintenanceStatusLog AS dms2 ON dml.deviceId = dms2.deviceId AND dml.day = dms2.day AND (dml.createdOn < dms2.createdOn OR (dml.createdOn = dms2.createdOn AND dml.id < dms2.id))
  INNER JOIN DeviceMaintenanceStatus AS dms ON dml.deviceMaintenanceStatusId = dms.id
  INNER JOIN Device AS d ON dml.deviceId = d.id
  INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
  INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
  INNER JOIN Site AS s ON s.id = d.siteId
  INNER JOIN Partner AS p ON s.partnerId = p.id
  LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
  WHERE dtc.hasResults = 1
  AND ISNULL(dms2.id)
  AND dml.day>= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH),"%Y-%m-01")
  AND dml.day < DATE_FORMAT(NOW(),"%Y-%m-01")
  AND DAYOFWEEK(dml.day) <> 1
  AND DAYOFWEEK(dml.day) <> 7`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  link: '/operational-data#deviceStatus',
  sortOrder: 5,
  externalId: 'activeDevices',
  description: `The average daily percentage of devices sending results, excluding weekends.`,
  descriptionI18nKey: 'activeDevicesDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.CONNECTIVITY,
    },
  },
  options: {
    extraFields: {
      alert: {
        dependsOn: 'count',
        whenIs: 'lessThan',
        comparedTo: '80%',
        representing: 'percentageOfActiveDevices',
      },
    },
  },
}

const stockouts = {
  jobFunctions: ['all'],
  icon: 'MdInbox',
  title: 'Stockouts',
  titleI18nKey: 'StockoutsTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `SELECT
  CONCAT(
    ROUND(
      IFNULL(
        COUNT(
          DISTINCT
            innerQuery.siteId
        ),
        0
      ) / COUNT(DISTINCT s.id) * 100
    ),
    '%'
  ) AS cnt
  FROM Site AS s
    INNER JOIN Device AS d
      ON s.id = d.siteId
    INNER JOIN Partner AS p
            ON s.partnerId = p.id
    LEFT OUTER JOIN Geography AS g
            ON s.geographyId = g.id
    LEFT OUTER JOIN (
      SELECT i.siteId
      FROM Issue AS i
      INNER JOIN IssueType AS it
        ON i.issueTypeId = it.id   AND i.createdOn BETWEEN  DATE_FORMAT(NOW(), '%Y-%m-01')
        AND NOW()
        AND it.externalId = 'InventoryStockout'
      INNER JOIN IssueStatus AS ist
        ON i.issueStatusId = ist.id AND ist.externalId NOT IN ('Inactive', 'OK', 'Resolved')
          ) AS innerQuery
    ON s.id = innerQuery.siteId
    `,
  sqlForStatUnit: `SELECT
  CONCAT(
    ROUND(
      IFNULL(
        COUNT(
          DISTINCT
            innerQuery.siteId
        ),
        0
      ) / COUNT(DISTINCT s.id) * 100
    ),
    '%'
  ) AS cnt
  FROM Site AS s
    INNER JOIN Device AS d
      ON s.id = d.siteId
    INNER JOIN Partner AS p
            ON s.partnerId = p.id
    LEFT OUTER JOIN Geography AS g
            ON s.geographyId = g.id
    LEFT OUTER JOIN (
      SELECT i.siteId
      FROM Issue AS i
      INNER JOIN IssueType AS it
        ON i.issueTypeId = it.id   AND i.createdOn BETWEEN  DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01')
        AND LAST_DAY(NOW()- INTERVAL 1 MONTH)
        AND it.externalId = 'InventoryStockout'
      INNER JOIN IssueStatus AS ist
        ON i.issueStatusId = ist.id AND ist.externalId NOT IN ('Inactive', 'OK', 'Resolved')
          ) AS innerQuery
    ON s.id = innerQuery.siteId`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  link: '/operational-data#inventoryStatus',
  sortOrder: 9,
  externalId: 'stockouts',
  description:
    'The stockout percentage is calculated by counting all sites with stockout issues during the month and dividing by all active sites.',
  descriptionI18nKey: 'stockoutsDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.INVENTORY,
    },
  },
  options: {
    extraFields: {
      alert: {
        dependsOn: 'count',
        whenIs: 'greaterThan',
        comparedTo: '10%',
        representing: 'percentageOfStockouts',
      },
    },
  },
}

const deviceDaysActive = {
  jobFunctions: ['all'],
  icon: 'MdEventAvailable',
  title: 'Days active',
  titleI18nKey: 'deviceDaysActiveTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `SELECT ROUND(AVG(daysActive), 1) as cnt
  FROM
    (
    SELECT SUM(dms.active = 1) AS daysActive
    FROM DeviceMaintenanceStatusLog AS dml
    LEFT OUTER JOIN DeviceMaintenanceStatusLog AS dms2 ON dml.deviceId = dms2.deviceId AND dml.day = dms2.day AND (dml.createdOn < dms2.createdOn OR (dml.createdOn = dms2.createdOn AND dml.id < dms2.id))
    INNER JOIN DeviceMaintenanceStatus AS dms ON dml.deviceMaintenanceStatusId = dms.id
    INNER JOIN Device AS d ON dml.deviceId = d.id
    INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
    INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
    INNER JOIN Site AS s ON s.id = d.siteId
    INNER JOIN Partner AS p ON s.partnerId = p.id
    LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
    WHERE dtc.hasResults = 1
    AND ISNULL(dms2.id)
    AND dml.day>= DATE_FORMAT(NOW(),"%Y-%m-01")
    AND DAYOFWEEK(dml.day) <> 1
    AND DAYOFWEEK(dml.day) <> 7
    GROUP BY dml.deviceId
  ) as innerQuery`,
  sqlForStatUnit: `SELECT ROUND(AVG(daysActive), 1) as cnt
  FROM
    (
    SELECT SUM(dms.active = 1) AS daysActive
    FROM DeviceMaintenanceStatusLog AS dml
    LEFT OUTER JOIN DeviceMaintenanceStatusLog AS dms2 ON dml.deviceId = dms2.deviceId AND dml.day = dms2.day AND (dml.createdOn < dms2.createdOn OR (dml.createdOn = dms2.createdOn AND dml.id < dms2.id))
    INNER JOIN DeviceMaintenanceStatus AS dms ON dml.deviceMaintenanceStatusId = dms.id
    INNER JOIN Device AS d ON dml.deviceId = d.id
    INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
    INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
    INNER JOIN Site AS s ON s.id = d.siteId
    INNER JOIN Partner AS p ON s.partnerId = p.id
    LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
    WHERE dtc.hasResults = 1
    AND ISNULL(dms2.id)
    AND dml.day>= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH),"%Y-%m-01")
    AND dml.day < DATE_FORMAT(NOW(),"%Y-%m-01")
    AND DAYOFWEEK(dml.day) <> 1
    AND DAYOFWEEK(dml.day) <> 7
    GROUP BY dml.deviceId
  ) as innerQuery`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  link: '/operational-data#deviceStatus',
  sortOrder: 6,
  externalId: 'deviceDaysActive',
  description: 'Average number of days each device has been active, excluding weekends.',
  descriptionI18nKey: 'deviceDaysActiveDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.CONNECTIVITY,
    },
  },
}

const errorRate = {
  jobFunctions: ['all'],
  icon: 'MdWarning',
  title: 'Error Rate',
  titleI18nKey: 'errorRateTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `SELECT
      CONCAT(
        ROUND(
          IFNULL(
            SUM(errorCount)
            /
            SUM(resultCount) * 100
          ,0)
        ,0)
      ,'%') AS cnt
      FROM (
        SELECT r.deviceId, SUM(rc.name = 'Error') as errorCount, COUNT(r.id) AS resultCount, d.dailyTestCapacity
          FROM Result AS r
          INNER JOIN ResultCategory AS rc ON rc.id = r.resultCategory1
          INNER JOIN Device AS d ON d.id = r.deviceId
          INNER JOIN DeviceType as dt on dt.id = d.deviceTypeId
          INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
          INNER JOIN Site AS s ON s.id = d.siteId
          LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
        WHERE DATE_FORMAT(NOW(), '%Y-%m-01') <= DATE(r.endedOn)
        AND dtc.hasResults = 1
        GROUP BY r.deviceId
      ) AS innerQuery`,
  sqlForStatUnit: errorRateQueryLast30Days,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  link: '/browse/result',
  linkParams: {
    workflowStatusId: 2,
    dateRange: WIDGET_FILTER_KEYS.FIXED_CURRENT_MONTH,
  },
  sortOrder: 6,
  externalId: 'errorRate',
  description:
    'The error rate is calculated by counting all errors in the tests conducted in the month and dividing that number by the total tests carried out of all devices.',
  descriptionI18nKey: 'errorRateDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.DEVICES,
    },
  },
  options: {
    extraFields: {
      alert: {
        dependsOn: 'count',
        whenIs: 'greaterThan',
        comparedTo: '3%',
        representing: 'errorRate',
      },
    },
  },
}

const errorRateHomeWidget = {
  ...errorRate,
  subTitle: 'Last 30 Days',
  subTitleI18nKey: 'last30Days',
  externalId: 'errorRateHome',
  sqlForIndicator: errorRateQueryLast30Days,
  sqlForStatUnit: null,
  statUnit: null,
  statUnitI18nKey: null,
  dashboards: {
    home: {},
  },
  options: {},
}

const stockNotRecorded = {
  jobFunctions: ['all'],
  icon: 'MdInbox',
  title: 'Stock not recorded (GeneXpert only)',
  titleI18nKey: 'stockNotRecordedTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `SELECT
  CONCAT(
    ROUND(
      100 - (COUNT(
        DISTINCT CASE WHEN cr.i18nKey IS NOT NULL AND cr.i18nKey <> 'ConsumableReason_TestConducted' THEN s.id ELSE NULL END) * 100 / COUNT(DISTINCT s.id))), '%') AS cnt
  FROM Site AS s
  INNER JOIN Partner AS p ON s.partnerId = p.id
  INNER JOIN Device AS d on d.siteId = s.id
  INNER JOIN DeviceType AS dt ON d.deviceTypeId = dt.id
  LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
  LEFT OUTER JOIN InventoryItem AS ii ON s.id = ii.siteId
  LEFT OUTER JOIN Consumable AS c ON ii.consumableId = c.id
  LEFT OUTER JOIN InventoryLog AS il ON ii.id = il.inventoryItemId AND c.manufacturer = 'Cepheid'
  LEFT OUTER JOIN ConsumableReason AS cr ON il.consumableReasonId = cr.id
  WHERE dt.externalId = 'CepheidGeneXpert';`,
  sqlForStatUnit: `SELECT
  CONCAT(
    ROUND(100 - (COUNT(
      DISTINCT CASE WHEN cr.i18nKey IS NOT NULL AND cr.i18nKey <> 'ConsumableReason_TestConducted' THEN s.id ELSE NULL END) * 100 / COUNT(DISTINCT s.id))), '%') AS cnt
  FROM Site AS s
  INNER JOIN Partner AS p ON s.partnerId = p.id
  INNER JOIN Device AS d on d.siteId = s.id
  INNER JOIN DeviceType AS dt ON d.deviceTypeId = dt.id
  LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
  LEFT OUTER JOIN InventoryItem AS ii ON s.id = ii.siteId
  LEFT OUTER JOIN Consumable AS c ON ii.consumableId = c.id
  LEFT OUTER JOIN InventoryLog AS il ON ii.id = il.inventoryItemId AND il.createdON < DATE_FORMAT(NOW(), '%Y-%m-01') AND c.manufacturer = 'Cepheid'
  LEFT OUTER JOIN ConsumableReason AS cr ON il.consumableReasonId = cr.id
  WHERE dt.externalId = 'CepheidGeneXpert';`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  link: '/operational-data#inventoryStatus',
  sortOrder: 12,
  externalId: 'stockNotRecorded',
  description:
    "The stock not recorded is calculated by counting all sites that didn't enter any stock for any of the GeneXpert assays and dividing that number by the total number of sites.",
  descriptionI18nKey: 'stockNotRecordedDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.INVENTORY,
    },
  },
  options: {
    extraFields: {
      alert: {
        dependsOn: 'count',
        whenIs: 'greaterThan',
        comparedTo: '10%',
        representing: 'percentageOfSitesWithoutGxStockEntered',
      },
    },
  },
}

const moduleSwaps = {
  jobFunctions: ['all'],
  icon: 'MdSwapVert',
  title: 'Module Swaps (GeneXpert only)',
  titleI18nKey: 'moduleSwapsTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `SELECT
  COUNT(*) AS cnt
    FROM
        Issue AS i
            INNER JOIN IssueType it ON i.issueTypeId = it.id
            INNER JOIN Device AS d ON d.id = i.deviceId
            INNER JOIN DeviceType as dt on dt.id = d.deviceTypeId
            INNER JOIN Site AS s ON s.id = d.siteId
            INNER JOIN Partner AS p ON s.partnerId = p.id
            LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
    WHERE
        it.externalId = 'ModuleReplaced'
        AND dt.externalId = 'CepheidGeneXpert'
        AND i.createdOn >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')`,
  sqlForStatUnit: `SELECT
  COUNT(*) AS cnt
    FROM
        Issue AS i
            INNER JOIN IssueType it ON i.issueTypeId = it.id
            INNER JOIN Device AS d ON d.id = i.deviceId
            INNER JOIN DeviceType as dt on dt.id = d.deviceTypeId
            INNER JOIN Site AS s ON s.id = d.siteId
            INNER JOIN Partner AS p ON s.partnerId = p.id
            LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
    WHERE
        it.externalId = 'ModuleReplaced'
        AND dt.externalId = 'CepheidGeneXpert'
        AND i.createdOn BETWEEN DATE_FORMAT(NOW() - interval 1 month, '%Y-%m-01') AND LAST_DAY(CURRENT_DATE-INTERVAL 1 MONTH)`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  linkParams: {
    deviceType: 'CepheidGeneXpert',
    issueTypeId: 'ModuleReplaced',
  },
  sortOrder: 6,
  externalId: 'moduleSwaps',
  description:
    'The number of GeneXpert module swaps made at the current month. The module swap issue appears when two consecutive results performed in the same slot have a different module serial number',
  descriptionI18nKey: 'moduleSwapsDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.SERVICE,
    },
  },
}

const gxPositiveResultsNotified = {
  jobFunctions: ['all'],
  icon: 'MdNotificationsNone',
  title: 'Positive Results Notified',
  titleI18nKey: 'gxPositiveResultsNotifiedTitle',
  externalId: 'gxPositiveResultsNotified',
  sqlForIndicator: `
  SELECT CONCAT(IFNULL(ROUND(SUM(HasNotifications) * 100 / COUNT(*),0),0),'%') AS cnt FROM
  (
    SELECT MAX(em.id) IS NOT NULL OR MAX(sm.id) IS NOT NULL AS HasNotifications
    FROM Result AS r
      INNER JOIN Device AS d ON d.id = r.deviceId
      INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
      INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
      INNER JOIN ResultCategory AS rc ON r.resultCategory1 = rc.id
      LEFT JOIN SmsMessage sm ON sm.resultId = r.id AND sm.messageStatusId = 3
      LEFT JOIN EmailMessage em ON em.resultId = r.id AND em.messageStatusId = 3
      LEFT JOIN DeviceApproval da ON d.deviceApprovalId = da.id
      WHERE rc.externalid IN ${positiveResults}
        AND dtc.hasResults = 1
        AND r.endedOn>= DATE_FORMAT(NOW(),"%Y-%m-01")
        AND (da.token = 'approved' OR ISNULL(da.token))
    GROUP BY r.id
  ) AS q
  `,
  sqlForStatUnit: `
  SELECT CONCAT(IFNULL(ROUND(SUM(HasNotifications) * 100 / COUNT(*),0),0),'%') AS cnt FROM
  (
    SELECT MAX(em.id) IS NOT NULL OR MAX(sm.id) IS NOT NULL AS HasNotifications
    FROM Result AS r
      INNER JOIN Device AS d ON d.id = r.deviceId
      INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
      INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
      INNER JOIN ResultCategory AS rc ON r.resultCategory1 = rc.id
      LEFT JOIN SmsMessage sm ON sm.resultId = r.id AND sm.messageStatusId = 3
      LEFT JOIN EmailMessage em ON em.resultId = r.id AND em.messageStatusId = 3
      LEFT JOIN DeviceApproval da ON d.deviceApprovalId = da.id
      WHERE rc.externalid IN ${positiveResults}
        AND dtc.hasResults = 1
        AND r.endedOn>= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH),"%Y-%m-01")
        AND r.endedOn< DATE_FORMAT(NOW(),"%Y-%m-01")
        AND (da.token = 'approved' OR ISNULL(da.token))
    GROUP BY r.id
  ) AS q
  `,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  sortOrder: 7,
  description: 'The percentage of positive results that were notified via SMS or email.',
  descriptionI18nKey: 'gxPositiveResultsNotifiedDescription',
  link: '/operational-data#resultsTransmitted',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.CONNECTIVITY,
    },
  },
  options: {
    extraFields: {
      alert: {
        dependsOn: 'count',
        whenIs: 'lessThan',
        comparedTo: '95%',
        representing: 'percentageOfPositiveResultsNotified',
      },
    },
  },
}

const avgTimeToUpload = {
  jobFunctions: ['all'],
  icon: 'FaCloudUploadAlt',
  title: 'Average Delay to Upload',
  titleI18nKey: 'avgTimeToUploadTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `
SELECT ROUND(
    IFNULL(
      AVG(
        TIMESTAMPDIFF(
          HOUR,
          r.endedOn,
          r.createdOn
        )
      )
      ,0
    )
  ) as cnt
FROM Result AS r
INNER JOIN Site AS s ON r.siteId = s.id
LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
INNER JOIN Country AS c ON g.countryId = c.id
INNER JOIN Device AS d ON r.deviceId = d.id
WHERE TIMESTAMPDIFF(
    HOUR,
    r.endedOn,
    r.createdOn
    )>=2
       AND r.endedOn BETWEEN DATE_FORMAT(NOW(), '%Y-%m-01') AND NOW()
  `,
  sqlForStatUnit: `
SELECT ROUND(
    IFNULL(
      AVG(
        TIMESTAMPDIFF(
          HOUR,
          r.endedOn,
          r.createdOn
        )
      )
      ,0
    )
  ) as cnt
FROM Result AS r
INNER JOIN Site AS s ON r.siteId = s.id
LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
INNER JOIN Country AS c ON g.countryId = c.id
INNER JOIN Device AS d ON r.deviceId = d.id
WHERE TIMESTAMPDIFF(
    HOUR,
    r.endedOn,
    r.createdOn
    )>=2
    AND r.endedOn BETWEEN DATE_FORMAT(NOW() - interval 1 month, '%Y-%m-01')
                  AND last_day(NOW()- interval 1 month)`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  link: '/browse/result',
  sortOrder: 6,
  externalId: 'avgTimeToUpload',
  description:
    'The average delay of uploading results, in hours. Only considering results where the delay was greater than two hours.',
  descriptionI18nKey: 'avgTimeToUploadDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.CONNECTIVITY,
    },
  },
  options: {
    extraFields: {
      alert: {
        dependsOn: 'count',
        whenIs: 'greaterThan',
        comparedTo: '24',
        representing: 'averageHoursToUpload',
      },
    },
  },
}

const percentageOfModulesFunctioning = {
  jobFunctions: ['all'],
  title: 'Percentage of Modules Functioning',
  titleI18nKey: 'percentageOfModulesFunctioningTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `
  SELECT
    CONCAT(ROUND(SUM(q2.usedModulesInLast7Days) * 100 / SUM(q2.totalModules)), '%') AS cnt
FROM
    (SELECT
        q.id,
            q.usedModulesInLast7Days,
            CASE WHEN q.activeModules = 0 THEN 0 ELSE
            (CASE
                WHEN q.activeModules <= 4 THEN 4
                ELSE (CASE
                    WHEN q.activeModules <= 16 THEN 16
                    ELSE (CASE
                        WHEN q.activeModules <= 48 THEN 48
                        ELSE 80
                    END)
                END)
            END) END AS totalModules
    FROM
        (SELECT
          d.id,
          COUNT(DISTINCT r.moduleName) AS usedModulesInLast7Days,
          IFNULL(innerQuery.cnt,0) AS activeModules
        FROM Device AS d
        LEFT JOIN (SELECT r2.deviceId,
          COUNT(DISTINCT r2.moduleName) AS cnt
          FROM Result AS r2
          WHERE r2.endedOn > DATE_SUB(NOW(), INTERVAL 7 DAY)
          GROUP BY r2.deviceId
        ) AS innerQuery ON d.id = innerQuery.deviceId
      INNER JOIN Site AS s ON s.id = d.siteId
      INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
      INNER JOIN DeviceTypeCategory AS dc ON dc.id = dt.deviceTypeCategoryId
      LEFT JOIN Geography AS g ON s.geographyId = g.id
      INNER JOIN Result AS r ON d.id = r.deviceId
      WHERE dc.hasResults = 1
        AND dt.externalId = 'CepheidGeneXpert'
        AND r.endedOn > DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY d.id) AS q) AS q2`,
  sqlForStatUnit: `
  SELECT
    SUM(q2.totalModules) AS cnt
FROM
    (SELECT q.id,
    CASE WHEN q.activeModules = 0 THEN 0 ELSE
		(CASE
			WHEN q.activeModules <= 4 THEN 4
			ELSE (CASE
				WHEN q.activeModules <= 16 THEN 16
				ELSE (CASE
					WHEN q.activeModules <= 48 THEN 48
					ELSE 80
				END)
			END)
		END) END AS totalModules
    FROM
		(SELECT d.id,
      COUNT(DISTINCT r.moduleName) AS usedModulesInLast7Days,
      IFNULL(innerQuery.cnt,0) AS activeModules
    FROM Device AS d
    LEFT JOIN (SELECT r2.deviceId,
                COUNT(DISTINCT r2.moduleName) AS cnt
              FROM Result AS r2
  WHERE r2.endedOn > DATE_SUB(NOW(), INTERVAL 7 DAY)
  GROUP BY r2.deviceId
  ) AS innerQuery ON d.id = innerQuery.deviceId
  INNER JOIN Site AS s ON s.id = d.siteId
  INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
  INNER JOIN DeviceTypeCategory AS dc ON dc.id = dt.deviceTypeCategoryId
  LEFT JOIN Geography AS g ON s.geographyId = g.id
  INNER JOIN Result AS r ON d.id = r.deviceId
  WHERE dc.hasResults = 1
         AND dt.externalId = 'CepheidGeneXpert'
         AND r.endedOn > DATE_SUB(NOW(), INTERVAL 7 DAY)
  GROUP BY d.id) AS q) AS q2
  `,
  statUnit: 'of {unit} total modules',
  statUnitI18nKey: 'ofTotalModules',
  sortOrder: 6,
  externalId: 'percentageOfModulesFunctioning',
  description:
    'Counts the percentage of module bays used in the last 7 days, based on the count of all available bays in all GeneXpert devices that were active in the last 7 days.',
  descriptionI18nKey: 'percentageOfModulesFunctioningDescription',
  icon: 'MdSwapVert',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.SERVICE,
    },
  },
  options: {
    extraFields: {
      alert: {
        dependsOn: 'count',
        whenIs: 'lessThan',
        comparedTo: '80%',
        representing: 'percentageOfModulesFunctioning',
      },
    },
  },
}

const averageRecipientsOfEmail = {
  jobFunctions: ['all'],
  icon: 'MdEmail',
  title: 'Average email recipients per positive result',
  titleI18nKey: 'averageRecipientsOfEmail',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `
  SELECT ifnull(ROUND(AVG(resultCount)),0) AS cnt
    FROM
    (
      SELECT COUNT(em.resultId) AS resultCount
      FROM Result AS r
        INNER JOIN EmailMessage AS em ON em.resultId = r.id
        INNER JOIN Device AS d ON d.id = em.deviceId
        INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
        INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
        INNER JOIN ResultCategory AS rc ON r.resultCategory1 = rc.id
        LEFT JOIN DeviceApproval da ON d.deviceApprovalId = da.id
          WHERE rc.externalid IN ${positiveResults}
          AND dtc.hasResults = 1
          AND r.endedOn>= DATE_FORMAT(NOW(),"%Y-%m-01")
          AND (da.token = 'approved' OR ISNULL(da.token))
          AND em.resultId IS NOT NULL
        GROUP BY em.resultId
    ) AS innerQuery
  `,
  sqlForStatUnit: `
  SELECT ifnull(ROUND(AVG(resultCount)),0) AS cnt
    FROM
    (
      SELECT COUNT(em.resultId) AS resultCount
      FROM Result AS r
        INNER JOIN EmailMessage AS em ON em.resultId = r.id
        INNER JOIN Device AS d ON d.id = em.deviceId
        INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
        INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
        INNER JOIN ResultCategory AS rc ON r.resultCategory1 = rc.id
        LEFT JOIN DeviceApproval da ON d.deviceApprovalId = da.id
        WHERE rc.externalid IN ${positiveResults}
        AND dtc.hasResults = 1
          AND em.createdOn>= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH),"%Y-%m-01")
          AND em.createdOn< DATE_FORMAT(NOW(),"%Y-%m-01")
          AND (da.token = 'approved' OR ISNULL(da.token))
          AND em.resultId IS NOT NULL
        GROUP BY em.resultId
    ) AS innerQuery
  `,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  link: '/operational-data#resultsTransmitted',
  sortOrder: 9,
  externalId: 'averageRecipientsOfEmail',
  description: 'The average number of email recipients per positive result.',
  descriptionI18nKey: 'averageRecipientsOfEmailDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.CONNECTIVITY,
    },
  },
}

const averageRecipientsOfSms = {
  jobFunctions: ['all'],
  icon: 'MdTextsms',
  title: 'Average SMS recipients per positive result',
  titleI18nKey: 'averageRecipientsOfSms',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `
  SELECT IFNULL(ROUND(AVG(resultCount)),0) AS cnt
    FROM
    (
      SELECT COUNT(sms.resultId) AS resultCount
      FROM Result AS r
        INNER JOIN SmsMessage AS sms ON sms.resultId = r.id
        INNER JOIN Device AS d ON d.id = sms.deviceId
        INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
        INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
        INNER JOIN ResultCategory AS rc ON r.resultCategory1 = rc.id
        LEFT JOIN DeviceApproval da ON d.deviceApprovalId = da.id
          WHERE rc.externalid IN ${positiveResults}
          AND dtc.hasResults = 1
          AND r.endedOn>= DATE_FORMAT(NOW(),"%Y-%m-01")
          AND (da.token = 'approved' OR ISNULL(da.token))
          AND sms.resultId IS NOT NULL
        GROUP BY sms.resultId
    ) AS innerQuery
  `,
  sqlForStatUnit: `
  SELECT IFNULL(ROUND(AVG(resultCount)),0) AS cnt
    FROM
    (
      SELECT COUNT(sms.resultId) AS resultCount
      FROM Result AS r
        INNER JOIN SmsMessage AS sms ON sms.resultId = r.id
        INNER JOIN Device AS d ON d.id = sms.deviceId
        INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
        INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
        INNER JOIN ResultCategory AS rc ON r.resultCategory1 = rc.id
        LEFT JOIN DeviceApproval da ON d.deviceApprovalId = da.id
        WHERE rc.externalid IN ${positiveResults}
          AND dtc.hasResults = 1
          AND sms.createdOn>= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH),"%Y-%m-01")
          AND sms.createdOn< DATE_FORMAT(NOW(),"%Y-%m-01")
          AND (da.token = 'approved' OR ISNULL(da.token))
          AND sms.resultId IS NOT NULL
        GROUP BY sms.resultId
    ) AS innerQuery
  `,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  link: '/operational-data#resultsTransmitted',
  sortOrder: 10,
  externalId: 'averageRecipientsOfSms',
  description: 'The average number of SMS recipients per positive result.',
  descriptionI18nKey: 'averageRecipientsOfSmsDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.CONNECTIVITY,
    },
  },
}

const averageLengthOfSms = {
  jobFunctions: ['all'],
  icon: 'MdTextsms',
  title: 'Average length of SMS',
  titleI18nKey: 'averageLengthOfSms',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `SELECT IFNULL(ROUND(AVG(messageLength)),0) AS cnt
  FROM
  (
  SELECT length(sms.message) AS messageLength
  FROM SmsMessage AS sms
  INNER JOIN Device AS d ON d.id = sms.deviceId
  INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
  INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
  INNER JOIN Site AS s ON d.siteId = s.id
  LEFT OUTER JOIN Geography as g on s.geographyId = g.id
  WHERE sms.createdOn >= DATE_FORMAT(NOW(),"%Y-%m-01")
  AND sms.resultId IS NOT NULL
  AND dtc.hasResults = 1
  GROUP BY sms.resultId
  ) AS innerQuery`,
  sqlForStatUnit: `SELECT IFNULL(ROUND(AVG(messageLength)),0) AS cnt
  FROM
  (
  SELECT length(sms.message) AS messageLength
  FROM SmsMessage AS sms
  INNER JOIN Device AS d ON d.id = sms.deviceId
  INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
  INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
  INNER JOIN Site AS s ON d.siteId = s.id
  LEFT OUTER JOIN Geography as g on s.geographyId = g.id
  WHERE sms.createdOn>= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH),"%Y-%m-01")
  AND sms.createdOn< DATE_FORMAT(NOW(),"%Y-%m-01")
  AND sms.resultId IS NOT NULL
  AND dtc.hasResults = 1
  GROUP BY sms.resultId
  ) AS innerQuery`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  link: '/browse/notification',
  sortOrder: 11,
  externalId: 'averageLengthOfSms',
  description: 'The average number of characters in SMS messages sent about positive results.',
  descriptionI18nKey: 'averageLengthOfSmsDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.CONNECTIVITY,
    },
  },
  options: {
    extraFields: {
      alert: {
        dependsOn: 'count',
        whenIs: 'greaterThan',
        comparedTo: '280',
        representing: 'averageLengthOfSMS',
      },
    },
  },
}

const smsSent = {
  jobFunctions: ['all'],
  icon: 'MdTextsms',
  title: 'SMS Sent MTD',
  titleI18nKey: 'dashboardWidgetSmsSentTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `
  SELECT
    IFNULL(SUM(CEIL(LENGTH(message)/140)),0) as cnt
  FROM SmsMessage AS sms
    INNER JOIN Device AS d ON d.id = sms.deviceId
    INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
    INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
    INNER JOIN Site AS s ON d.siteId = s.id
    LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
  WHERE sms.createdOn>= DATE_FORMAT(NOW(),"%Y-%m-01")
    AND sms.resultId IS NOT NULL
    AND dtc.hasResults = 1`,
  sqlForStatUnit: `
  SELECT
    IFNULL(SUM(CEIL(LENGTH(message)/140)),0) as cnt
  FROM SmsMessage AS sms
    INNER JOIN Device AS d ON d.id = sms.deviceId
    INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
    INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
    INNER JOIN Site AS s ON d.siteId = s.id
    LEFT OUTER JOIN Geography as g on s.geographyId = g.id
  WHERE sms.createdOn>= DATE_FORMAT(NOW(),"%Y-01-01")
    AND sms.resultId IS NOT NULL
    AND dtc.hasResults = 1
  `,
  statUnit: '{unit} YTD',
  statUnitI18nKey: 'ytd',
  link: '/browse/notification',
  sortOrder: 12,
  externalId: 'smsSent',
  description: 'The total number of text messages sent in the month',
  descriptionI18nKey: 'dashboardWidgetSmsSentDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.CONNECTIVITY,
    },
  },
  options: {
    extraFields: {
      alert: {
        dependsOn: 'count',
        whenIs: 'greaterThan',
        comparedTo: '2000',
        representing: 'numberOfTextMessagesSent',
      },
    },
  },
}

const averageDaysModuleSwap = {
  jobFunctions: ['all'],
  icon: 'MdSwapVert',
  title: 'Average days between module swaps',
  titleI18nKey: 'averageDaysModuleSwap',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `SELECT IFNULL(ROUND(AVG(days)), '-') AS cnt
  FROM (
    SELECT TIMESTAMPDIFF(DAY, max(r.endedOn), issueData.endedOn) AS days
    FROM (SELECT i.data ->> '$.replacedModuleSerial' as replacedModuleSerial, i.data ->> '$.moduleName' as replacedModuleName, i.deviceId, r.endedOn
          FROM Issue AS i
          INNER JOIN Result AS r on i.resultId = r.id
          INNER JOIN Device AS d on r.deviceId = d.id
          INNER JOIN Site AS s ON d.siteId = s.id
          LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
          INNER JOIN IssueType AS it ON i.issueTypeId = it.id
          WHERE it.externalId = 'ModuleReplaced'
          AND r.endedOn>= DATE_FORMAT(NOW(),"%Y-%m-01")
        )
        AS issueData
    INNER JOIN Result AS r on issueData.deviceId = r.deviceId AND issueData.replacedModuleName = r.moduleName AND issueData.replacedModuleSerial = r.moduleSerial AND r.endedOn < issueData.endedOn
    GROUP by r.deviceId, r.moduleName, r.moduleSerial
  ) as innerQuery`,
  sqlForStatUnit: `SELECT IFNULL(ROUND(AVG(days)), '-') AS cnt
  FROM (
    SELECT TIMESTAMPDIFF(DAY, max(r.endedOn), issueData.endedOn) AS days
    FROM (SELECT i.data ->> '$.replacedModuleSerial' as replacedModuleSerial, i.data ->> '$.moduleName' as replacedModuleName, i.deviceId, r.endedOn
          FROM Issue AS i
          INNER JOIN Result AS r on i.resultId = r.id
          INNER JOIN Device AS d on r.deviceId = d.id
          INNER JOIN Site AS s ON d.siteId = s.id
          LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
          INNER JOIN IssueType AS it ON i.issueTypeId = it.id
          WHERE it.externalId = 'ModuleReplaced'
          AND r.endedOn>= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH),"%Y-%m-01")
          AND r.endedOn< DATE_FORMAT(NOW(),"%Y-%m-01")
        )
        AS issueData
    INNER JOIN Result AS r on issueData.deviceId = r.deviceId AND issueData.replacedModuleName = r.moduleName AND issueData.replacedModuleSerial = r.moduleSerial AND r.endedOn <= issueData.endedOn
    GROUP by r.deviceId, r.moduleName, r.moduleSerial
  ) as innerQuery`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  link: '/browse/notification',
  sortOrder: 7,
  externalId: 'averageDaysModuleSwap',
  description:
    'The average number of days between the last result reported under a specific module serial number and the consecutive result with a different module serial number',
  descriptionI18nKey: 'averageDaysModuleSwapDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.SERVICE,
    },
  },
  options: {
    extraFields: {
      alert: {
        dependsOn: 'count',
        whenIs: 'greaterThan',
        comparedTo: '14',
        representing: 'averageDaysBetweenModuleSwaps',
      },
    },
  },
}

const averageTimeToModuleReplacement = {
  jobFunctions: ['all'],
  icon: 'MdSwapVert',
  title: 'Average time to replace disabled module',
  titleI18nKey: 'averageTimeToModuleReplacementTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `
    SELECT
      IFNULL(ROUND(AVG(
        DATEDIFF(logResolved.changedOn, logActive.changedOn)
      )), 0) AS cnt
    FROM Issue AS i
      INNER JOIN IssueType AS it ON i.issueTypeId = it.id
      /*
        --------------------
        log with status Active
        --------------------
      */
      INNER JOIN IssueStatusLog AS logActive ON i.id = logActive.issueId
      INNER JOIN IssueStatus AS isActive ON logActive.issueStatusId = isActive.id
      /*
        --------------------
        log with status Resolved
        --------------------
      */
      INNER JOIN IssueStatusLog AS logResolved ON i.id = logResolved.issueId
      INNER JOIN IssueStatus AS isResolved ON logResolved.issueStatusId = isResolved.id
      /*
        --------------------
        joins for constraints
        --------------------
      */
      INNER JOIN Device AS d on i.deviceId = d.id
      INNER JOIN Site AS s ON d.siteId = s.id
      LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
    WHERE it.externalId = 'ModuleDisabled'
      AND isActive.externalId = 'Active'
      AND isResolved.externalId = 'Resolved'
      AND logResolved.createdOn>= DATE_FORMAT(NOW(),"%Y-%m-01")
  `,
  sqlForStatUnit: `
    SELECT
    IFNULL(ROUND(AVG(
      DATEDIFF(logResolved.changedOn, logActive.changedOn)
    )), 0) AS cnt
  FROM Issue AS i
    INNER JOIN IssueType AS it ON i.issueTypeId = it.id
    /*
      --------------------
      log with status Active
      --------------------
    */
    INNER JOIN IssueStatusLog AS logActive ON i.id = logActive.issueId
    INNER JOIN IssueStatus AS isActive ON logActive.issueStatusId = isActive.id
    /*
      --------------------
      log with status Resolved
      --------------------
    */
    INNER JOIN IssueStatusLog AS logResolved ON i.id = logResolved.issueId
    INNER JOIN IssueStatus AS isResolved ON logResolved.issueStatusId = isResolved.id
    /*
      --------------------
      joins for constraints
      --------------------
    */
    INNER JOIN Device AS d on i.deviceId = d.id
    INNER JOIN Site AS s ON d.siteId = s.id
    LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
  WHERE it.externalId = 'ModuleDisabled'
    AND isActive.externalId = 'Active'
    AND isResolved.externalId = 'Resolved'
    AND logResolved.createdOn>= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH),"%Y-%m-01")
    AND logResolved.createdOn< DATE_FORMAT(NOW(),"%Y-%m-01")
  `,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  link: '/browse/notification',
  sortOrder: 8,
  externalId: 'averageTimeToModuleReplacement',
  description: `The average time (in days) between when a module was disabled and a different module serial being detected in the same slot.`,
  descriptionI18nKey: 'averageTimeToModuleReplacementDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.SERVICE,
    },
  },
  options: {
    extraFields: {
      alert: {
        dependsOn: 'count',
        whenIs: 'greaterThan',
        comparedTo: '14',
        representing: 'averageTimeToReplaceDisabledModules',
      },
    },
  },
}

const numberOfDevicesExperiencingServiceInterruption = {
  jobFunctions: ['all'],
  icon: 'MdBuild',
  title: 'Devices With Service Interruption',
  titleI18nKey: 'numberOfDevicesExperiencingServiceInterruptionTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `
  SELECT
    COUNT(DISTINCT d.id) AS cnt
  FROM
      Device AS d
          INNER JOIN Site AS s ON s.id = d.siteId
          LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
          INNER JOIN DeviceMaintenanceStatusLog dmsl ON d.id = dmsl.deviceId
          INNER JOIN DeviceMaintenanceStatus dms ON dmsl.deviceMaintenanceStatusId = dms.id
          INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
          INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
  WHERE
      dms.externalId = 'inactiveDownForRepair'
      AND dmsl.day>= DATE_FORMAT(NOW(),"%Y-%m-01")
      AND dtc.hasResults = 1
  `,
  sqlForStatUnit: `
  SELECT
    COUNT(DISTINCT d.id) AS cnt
  FROM
      Device AS d
          INNER JOIN Site AS s ON s.id = d.siteId
          LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
          INNER JOIN DeviceMaintenanceStatusLog dmsl ON d.id = dmsl.deviceId
          INNER JOIN DeviceMaintenanceStatus dms ON dmsl.deviceMaintenanceStatusId = dms.id
          INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
          INNER JOIN DeviceTypeCategory dtc ON dt.deviceTypeCategoryId = dtc.id
  WHERE
      dms.externalId = 'inactiveDownForRepair'
      and dmsl.day>= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH),"%Y-%m-01")
      AND dmsl.day < DATE_FORMAT(NOW(),"%Y-%m-01")
      AND dtc.hasResults = 1
  `,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  link: '/browse/device/list',
  linkParams: {
    deviceMaintenanceStatusId: 'inactiveDownForRepair',
  },
  sortOrder: 30,
  externalId: 'numberOfDevicesExperiencingServiceInterruption',
  description: `The number of devices experiencing service interruption on this and the previous month. A device has a service interruption when it is flagged as "Down for repair" for it maintenance status.`,
  descriptionI18nKey: 'numberOfDevicesExperiencingServiceInterruptionDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.SERVICE,
    },
  },
}

const averageDurationServiceInterruption = {
  jobFunctions: ['all'],
  icon: 'MdBuild',
  title: 'Average Duration of Service Interruption',
  titleI18nKey: 'averageDurationServiceInterruptionTitle',
  subTitle: null,
  subTitleI18nKey: null,
  /*
    The innermost query gets the number of times the device was down for repair if it wasn't down the entire month
    The "middle-query" combines that with the devices that were down the entire month so we have the total number of times a device was down
    That then allows us at the top level to calculate the average number of days a device was down
  */
  sqlForIndicator: `
  SELECT IFNULL(ROUND(AVG(days/times)), 0) AS cnt
  FROM
      (
      SELECT MIN(dmsl.day) AS minInactive, MAX(dmsl.day) AS maxInactive, dmsl.deviceId,
        COUNT(CASE WHEN DAYOFWEEK(dmsl.day) <> 1 AND DAYOFWEEK(dmsl.day) <> 7 THEN dmsl.deviceId ELSE NULL END) AS days,
              CASE WHEN o.times IS NULL THEN 1 ELSE o.times + (CASE WHEN MIN(dmsl.day) = DATE_FORMAT(NOW(), '%Y-%m-01') AND MAX(dmsl.day) = LAST_DAY(NOW()) THEN 1 ELSE 0 END) END AS times
      FROM DeviceMaintenanceStatusLog AS dmsl
      INNER JOIN DeviceMaintenanceStatus AS dms ON dmsl.deviceMaintenanceStatusId = dms.id
      INNER JOIN Device AS d ON dmsl.deviceId = d.id
      INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
      INNER JOIN DeviceTypeCategory AS dtc ON dt.deviceTypeCategoryId = dtc.id
      INNER JOIN Site AS s ON s.id = d.siteId
      LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
      LEFT OUTER JOIN
      (
          SELECT  dmsl.deviceId, COUNT(dmsl.deviceId) AS times
          FROM DeviceMaintenanceStatusLog AS dmsl
          LEFT OUTER JOIN DeviceMaintenanceStatusLog AS dmsl2 ON dmsl.deviceId = dmsl2.deviceId AND dmsl.day = DATE_SUB(dmsl2.day, INTERVAL 1 DAY) AND dmsl2.deviceMaintenanceStatusId <> dmsl.deviceMaintenanceStatusId
          LEFT OUTER JOIN DeviceMaintenanceStatus AS dms ON dmsl2.deviceMaintenanceStatusId = dms.id
          WHERE dmsl.day >= DATE_FORMAT(NOW(),"%Y-%m-01")
              AND dms.externalId = 'inactiveDownForRepair'
          GROUP BY dmsl.deviceId) AS o ON dmsl.deviceId = o.deviceId
    WHERE dmsl.day>= DATE_FORMAT(NOW(),"%Y-%m-01")
    AND dms.externalId = 'inactiveDownForRepair'
    AND dtc.hasResults = 1
    GROUP BY dmsl.deviceId
    ORDER BY dmsl.deviceId , minInactive) AS innerQuery
  `,
  sqlForStatUnit: `
  SELECT IFNULL(ROUND(AVG(days/times)), 0) AS cnt
  FROM
      (
      SELECT MIN(dmsl.day) AS minInactive, MAX(dmsl.day) AS maxInactive, dmsl.deviceId,
        COUNT(CASE WHEN DAYOFWEEK(dmsl.day) <> 1 AND DAYOFWEEK(dmsl.day) <> 7 THEN dmsl.deviceId ELSE NULL END) AS days,
              CASE WHEN o.times IS NULL THEN 1 ELSE o.times + (CASE WHEN MIN(dmsl.day) = DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01') AND MAX(dmsl.day) = LAST_DAY(DATE_SUB(NOW(), INTERVAL 1 MONTH)) THEN 1 ELSE 0 END) END AS times
      FROM DeviceMaintenanceStatusLog AS dmsl
      INNER JOIN DeviceMaintenanceStatus AS dms ON dmsl.deviceMaintenanceStatusId = dms.id
      INNER JOIN Device AS d ON dmsl.deviceId = d.id
      INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
      INNER JOIN DeviceTypeCategory AS dtc ON dt.deviceTypeCategoryId = dtc.id
      INNER JOIN Site AS s ON s.id = d.siteId
      LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
      LEFT OUTER JOIN
      (
          SELECT  dmsl.deviceId, COUNT(dmsl.deviceId) AS times
      FROM DeviceMaintenanceStatusLog AS dmsl
      LEFT OUTER JOIN DeviceMaintenanceStatusLog AS dmsl2 ON dmsl.deviceId = dmsl2.deviceId AND dmsl.day = DATE_SUB(dmsl2.day, INTERVAL 1 DAY) AND dmsl2.deviceMaintenanceStatusId <> dmsl.deviceMaintenanceStatusId
          LEFT OUTER JOIN DeviceMaintenanceStatus AS dms ON dmsl2.deviceMaintenanceStatusId = dms.id
      WHERE dmsl.day>= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH),"%Y-%m-01")
      AND dmsl.day < DATE_FORMAT(NOW(),"%Y-%m-01")
          AND dms.externalId = 'inactiveDownForRepair'
      GROUP BY dmsl.deviceId) AS o ON dmsl.deviceId = o.deviceId
    WHERE dmsl.day>= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH),"%Y-%m-01")
    AND dmsl.day < DATE_FORMAT(NOW(),"%Y-%m-01")
    AND dms.externalId = 'inactiveDownForRepair'
    AND dtc.hasResults = 1
    GROUP BY dmsl.deviceId
    ORDER BY dmsl.deviceId , minInactive) AS innerQuery
  `,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  link: '/browse/device/list',
  linkParams: {
    deviceMaintenanceStatusId: 'inactiveDownForRepair',
  },
  sortOrder: 2,
  externalId: 'averageDurationServiceInterruption',
  description: `The average duration of a service interruption, in days.`,
  descriptionI18nKey: 'averageDurationServiceInterruptionDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.SERVICE,
    },
  },
  options: {
    extraFields: {
      alert: {
        dependsOn: 'count',
        whenIs: 'greaterThan',
        comparedTo: '14',
        representing: 'averageDaysOfServiceInterruption',
      },
    },
  },
}

const percentageOfDaysWithServiceInterruption = {
  icon: 'MdBuild',
  title: 'Days With Service Interruption',
  titleI18nKey: 'percentageOfDaysWithServiceInterruptionTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `
  SELECT CONCAT(
    IFNULL(
      ROUND(
        SUM(down.daysInactive)
        /
        SUM(
          GetWeekdaysInRange(NOW(),
            GREATEST(d.createdOn,
              DATE_FORMAT(NOW(), '%Y-%m-01')
            )
          )
        )
      * 100),
    0),
  '%') AS cnt
      FROM Device AS d
      INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
      INNER JOIN DeviceTypeCategory AS dtc ON dt.deviceTypeCategoryId = dtc.id
      INNER JOIN Site AS s ON s.id = d.siteId
      LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
      LEFT OUTER JOIN (
        SELECT COUNT(DISTINCT dmsl.day) AS daysInactive, dmsl.deviceId
        FROM DeviceMaintenanceStatusLog AS dmsl
        INNER JOIN Device AS d ON dmsl.deviceId = d.id
        INNER JOIN DeviceMaintenanceStatus AS dms ON dmsl.deviceMaintenanceStatusId = dms.id
        WHERE dmsl.day>= DATE_FORMAT(NOW(),"%Y-%m-01")
        AND d.createdOn <= NOW()
        AND dms.externalId = 'inactiveDownForRepair'
        AND DAYOFWEEK(dmsl.day) <> 1
        AND DAYOFWEEK(dmsl.day) <> 7
        GROUP BY dmsl.deviceId
      ) AS down ON d.id = down.deviceId
      WHERE d.createdOn <= NOW()
    AND dtc.hasResults = 1
  `,
  sqlForStatUnit: `
  SELECT CONCAT(
    IFNULL(
      ROUND(
        SUM(down.daysInactive)
        /
        SUM(
          GetWeekdaysInRange(LAST_DAY(DATE_SUB(NOW(), INTERVAL 1 MONTH)),
            GREATEST(d.createdOn,
              DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')
            )
          )
        )
      * 100),
    0),
  '%') AS cnt
    FROM Device AS d
    INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
    INNER JOIN DeviceTypeCategory AS dtc ON dt.deviceTypeCategoryId = dtc.id
    INNER JOIN Site AS s ON s.id = d.siteId
    LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
    LEFT OUTER JOIN (
      SELECT COUNT(DISTINCT dmsl.day) AS daysInactive, dmsl.deviceId
      FROM DeviceMaintenanceStatusLog AS dmsl
      INNER JOIN Device AS d ON dmsl.deviceId = d.id
      INNER JOIN DeviceMaintenanceStatus AS dms ON dmsl.deviceMaintenanceStatusId = dms.id
      WHERE dmsl.day>= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH),"%Y-%m-01")
      AND dmsl.day < DATE_FORMAT(NOW(),"%Y-%m-01")
      AND d.createdOn <= LAST_DAY(DATE_SUB(NOW(), INTERVAL 1 MONTH))
      AND dms.externalId = 'inactiveDownForRepair'
      AND DAYOFWEEK(dmsl.day) <> 1
      AND DAYOFWEEK(dmsl.day) <> 7
      GROUP BY dmsl.deviceId
    ) AS down ON d.id = down.deviceId
    WHERE d.createdOn <= LAST_DAY(DATE_SUB(NOW(), INTERVAL 1 MONTH))
    AND dtc.hasResults = 1
  `,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  link: '/browse/device/list',
  linkParams: {
    deviceMaintenanceStatusId: 'inactiveDownForRepair',
  },
  sortOrder: 2,
  externalId: 'percentageOfDaysWithServiceInterruption',
  description: `The percentage of "device-days" that were statused as "down for repair", excluding weekends. For example, 20 weekdays in the month and 5 devices would equate 100 "device-days". If one device was down half of the month, this number would be 10%`,
  descriptionI18nKey: 'percentageOfDaysWithServiceInterruptionDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.SERVICE,
    },
  },
}

const dashboardWidgetTitleTotalDeaths = {
  jobFunctions: ['all'],
  icon: 'MdEventBusy',
  title: 'Deaths',
  titleI18nKey: 'dashboardWidgetTitleTotalDeaths',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `SELECT COUNT(rfu.resultId) as cnt FROM ResultFollowUp AS rfu INNER JOIN FollowUp AS fu ON fu.id = rfu.followUpId INNER JOIN FollowUpType AS ft ON fu.followUpTypeId = ft.id INNER JOIN Result AS r ON rfu.resultId = r.id INNER JOIN Device AS d ON d.id = r.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON p.id = s.partnerId WHERE fu.externalId='Died'`,
  sqlForStatUnit: `SELECT COUNT(rfu.resultId) as cnt FROM ResultFollowUp AS rfu INNER JOIN FollowUp AS fu ON fu.id = rfu.followUpId INNER JOIN FollowUpType AS ft ON fu.followUpTypeId = ft.id INNER JOIN Result AS r ON rfu.resultId = r.id INNER JOIN Device AS d ON d.id = r.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON p.id = s.partnerId WHERE fu.externalId='Died' AND rfu.createdOn >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
  statUnit: '{unit} since last week',
  statUnitI18nKey: 'sinceLastWeek',
  link: '/browse/case?filters=',
  sortOrder: 7,
  externalId: 'dashboardWidgetTitleTotalDeaths',
  description: 'The number of results that belong to a patient that died',
  descriptionI18nKey: 'dashboardWidgetDescriptionTotalDeaths',
  dashboards: {
    home: {},
  },
}

const dashboardWidgetTitleConfirmedCases = {
  jobFunctions: ['all'],
  icon: 'MdAddAlert',
  title: 'Confirmed cases',
  titleI18nKey: 'dashboardWidgetTitleConfirmedCases',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `SELECT IFNULL(SUM(f.resultCount), 0) AS cnt FROM FactResultsDeviceByCategory1 AS f INNER JOIN Device AS d ON d.id = f.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON p.id = s.partnerId INNER JOIN Assay a ON f.assayId= a.id INNER JOIN ResultCategory rc ON f.resultCategory1 = rc.id LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id WHERE rc.externalid='Positive' and f.days=9999`,
  sqlForStatUnit: `SELECT IFNULL(SUM(f.resultCount), 0) AS cnt FROM FactResultsDeviceByCategory1 AS f INNER JOIN Device AS d ON d.id = f.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON p.id = s.partnerId INNER JOIN Assay a ON f.assayId= a.id INNER JOIN ResultCategory rc ON f.resultCategory1 = rc.id LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id WHERE rc.externalid='Positive' and f.days=7`,
  statUnit: '{unit} since last week',
  statUnitI18nKey: 'sinceLastWeek',
  link: '/browse/case?filters=',
  sortOrder: 4,
  externalId: 'dashboardWidgetTitleConfirmedCases',
  description: 'The number of positive results',
  descriptionI18nKey: 'confirmedCasesDescription',
  dashboards: {
    home: {},
  },
}

const dashboardWidgetTitleTotalActiveCases = {
  jobFunctions: ['all'],
  icon: 'MdAssignment',
  title: 'Active cases',
  titleI18nKey: 'dashboardWidgetTitleTotalActiveCases',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `SELECT IFNULL(COUNT(f.id), 0) AS cnt FROM Result AS f INNER JOIN Device AS d ON d.id = f.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON p.id = s.partnerId INNER JOIN Assay a ON f.assayId= a.id INNER JOIN ResultCategory rc ON f.resultCategory1 = rc.id LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id WHERE rc.externalid='Positive' AND NOT EXISTS (SELECT * FROM ResultFollowUp rfu INNER JOIN FollowUp fu ON fu.id=rfu.followUpId INNER JOIN FollowUpType ft ON fu.followUpTypeId =ft.id WHERE ft.externalid='outcome' AND rfu.resultId=f.id)`,
  sqlForStatUnit: `SELECT IFNULL(COUNT(f.id), 0) AS cnt FROM Result AS f INNER JOIN Device AS d ON d.id = f.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON p.id = s.partnerId INNER JOIN Assay a ON f.assayId= a.id INNER JOIN ResultCategory rc ON f.resultCategory1 = rc.id LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id WHERE rc.externalid='Positive' and f.createdOn >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND NOT EXISTS (SELECT * FROM ResultFollowUp rfu INNER JOIN FollowUp fu ON fu.id=rfu.followUpId INNER JOIN FollowUpType ft ON fu.followUpTypeId =ft.id WHERE ft.externalid='outcome' AND rfu.resultId=f.id)`,
  statUnit: '{unit} since last week',
  statUnitI18nKey: 'sinceLastWeek',
  link: '/browse/case?filters=',
  sortOrder: 5,
  externalId: 'dashboardWidgetTitleTotalActiveCases',
  description: 'The number of positive results that are still active',
  descriptionI18nKey: 'totalActiveCasesDescription',
  dashboards: {
    home: {},
  },
}

const dashboardWidgetTitleTotalRecoveredCases = {
  jobFunctions: ['all'],
  icon: 'MdVerifiedUser',
  title: 'Recovered cases',
  titleI18nKey: 'dashboardWidgetTitleTotalRecoveredCases',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `SELECT COUNT(rfu.resultId) as cnt FROM ResultFollowUp AS rfu INNER JOIN FollowUp AS fu ON fu.id = rfu.followUpId INNER JOIN FollowUpType AS ft ON fu.followUpTypeId = ft.id INNER JOIN Result AS r ON rfu.resultId = r.id INNER JOIN Device AS d ON d.id = r.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON p.id = s.partnerId WHERE ft.externalid = 'outcome' AND fu.externalId='Recovered'`,
  sqlForStatUnit: `SELECT COUNT(rfu.resultId) as cnt FROM ResultFollowUp AS rfu INNER JOIN FollowUp AS fu ON fu.id = rfu.followUpId INNER JOIN FollowUpType AS ft ON fu.followUpTypeId = ft.id INNER JOIN Result AS r ON rfu.resultId = r.id INNER JOIN Device AS d ON d.id = r.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON p.id = s.partnerId WHERE ft.externalid = 'outcome' AND fu.externalId='Recovered' AND rfu.createdOn >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
  statUnit: '{unit} since last week',
  statUnitI18nKey: 'sinceLastWeek',
  link: '/browse/case?filters=',
  sortOrder: 6,
  externalId: 'dashboardWidgetTitleTotalRecoveredCases',
  description: `The number of results that belong to a patient that recovered`,
  descriptionI18nKey: 'totalRecoveredCasesDescription',
  dashboards: {
    home: {},
  },
}

sqlSnippets.deviceCalibrationPastDue = {
  sum: `
    SUM(CASE
      WHEN daysSinceCalibration > 365 THEN 1
      ELSE 0
    END)
  `,
  innerQuery: `
    SELECT
      d.id AS deviceId,
      CASE
        WHEN MAX(dm.contextDate) IS NULL THEN null
        ELSE DATEDIFF( NOW(), MAX(dm.contextDate) )
      END as daysSinceCalibration
    FROM Device AS d
      INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
      INNER JOIN Site AS s ON d.siteId = s.id
      LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
      LEFT OUTER JOIN DeviceMaintenance as dm on d.id = dm.deviceId and dm.current = 1
      LEFT OUTER JOIN DeviceMaintenanceType as dmt on dm.deviceMaintenanceTypeId = dmt.id and dmt.externalId = 'calibration'
    WHERE
        dt.externalId = 'CepheidGeneXpert'
    GROUP BY d.id
  `,
}
const deviceCalibrationPastDue = {
  externalId: 'deviceCalibrationPastDue',
  jobFunctions: ['all'],
  sortOrder: 4,
  icon: 'MdBuild',
  title: 'GeneXpert Calibration Past Due',
  titleI18nKey: 'deviceCalibrationPastDueTitle',
  sqlForIndicator: `
    SELECT
      ${sqlSnippets.deviceCalibrationPastDue.sum} AS cnt
    FROM (
      ${sqlSnippets.deviceCalibrationPastDue.innerQuery}
    ) AS sub;`,
  sqlForStatUnit: `
    SELECT
      CONCAT(
        ROUND(${sqlSnippets.deviceCalibrationPastDue.sum} * 100 / COUNT(deviceId)),
        '%'
      ) AS cnt
    FROM (
      ${sqlSnippets.deviceCalibrationPastDue.innerQuery}
    ) AS sub;`,
  statUnit: '{unit} of all devices',
  statUnitI18nKey: 'ofAllDevices',
  description: `The number of GeneXpert instruments that had their last calibration more than one year ago.`,
  descriptionI18nKey: 'deviceCalibrationPastDueDescription',
  link: '/reports',
  linkParams: {
    reportName: 'GeneXpert Device Calibration Report',
  },
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.SERVICE,
    },
  },
}

sqlSnippets.deviceCalibratedWhenDue = {
  sum: `SUM(DATEDIFF(contextDateCurrent, contextDatePrevious) < 395)`,
  count: `SUM(contextDateCurrent IS NOT NULL AND contextDatePrevious IS NOT NULL)`,
  innerQuery: `
    SELECT d.id, dm.contextDate as contextDateCurrent, dmPrev.contextDate as contextDatePrevious
    FROM Device AS d
    INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
    INNER JOIN Site AS s ON d.siteId = s.id
    LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
    INNER JOIN DeviceMaintenance AS dm on d.id = dm.deviceId
    INNER JOIN DeviceMaintenanceType AS dmt on dm.deviceMaintenanceTypeId = dmt.id
    INNER JOIN (  SELECT MAX(contextDate) AS contextDate, deviceId
                  FROM DeviceMaintenance AS dm
                  INNER JOIN DeviceMaintenanceType AS dmt on dm.deviceMaintenanceTypeId = dmt.id
                  WHERE dmt.externalId = 'calibration'
                  AND dm.current = 0
                  GROUP BY dm.deviceId) AS dmPrev ON d.id = dmPrev.deviceId
    WHERE dt.externalId = 'CepheidGeneXpert'
    AND dmt.externalId = 'calibration'
    AND dm.current = 1
    AND dm.contextDate>= DATE_FORMAT(NOW(),"%Y-%m-01")
  `,
}
const deviceCalibratedWhenDue = {
  externalId: 'deviceCalibratedWhenDue',
  jobFunctions: ['all'],
  sortOrder: 5,
  icon: 'MdBuild',
  title: 'GeneXpert Calibrated When Due',
  titleI18nKey: 'deviceCalibratedWhenDueTitle',
  sqlForIndicator: `
    SELECT
    CONCAT(
      ROUND(${sqlSnippets.deviceCalibratedWhenDue.sum} * 100 / ${sqlSnippets.deviceCalibratedWhenDue.count}),
      '%'
    ) AS cnt
  FROM (
    ${sqlSnippets.deviceCalibratedWhenDue.innerQuery}
  ) AS sub;`,
  sqlForStatUnit: `
    SELECT IFNULL(${sqlSnippets.deviceCalibratedWhenDue.count}, 0) AS cnt
    FROM (
      ${sqlSnippets.deviceCalibratedWhenDue.innerQuery}
    ) AS sub;`,
  statUnit: '{unit} total calibrations',
  statUnitI18nKey: 'totalCalibrations',
  description: `The percentage of GeneXpert calibrations that were within 30 days of the scheduled date. Note that this only counts calibrations for devices that had a calibration record before.`,
  descriptionI18nKey: 'deviceCalibratedWhenDueDescription',
  link: '/reports',
  linkParams: {
    reportName: 'GeneXpert Device Calibration Report',
  },
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.SERVICE,
    },
  },
}

const bangladeshAverageCompletion = {
  jobFunctions: ['all'],
  icon: 'MdVerifiedUser',
  title: 'Custom Fields Average Completion',
  titleI18nKey: 'bangladeshAverageCompletionTitle',
  sqlForIndicator: `SELECT
  CONCAT(ROUND((IFNULL(SUM(f.completionRate * 100 * f.recordCount) / SUM(f.recordCount),0)), 2), '%') AS cnt
  FROM FactCustomFieldCompletion as f INNER JOIN Site as s ON f.siteId = s.id
  WHERE
  f.updatedOn BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND NOW()`,
  sqlForStatUnit: `SELECT
  CONCAT(ROUND((IFNULL(SUM(f.completionRate * 100 * f.recordCount) / SUM(f.recordCount),0)), 2), '%') AS cnt
  FROM FactCustomFieldCompletion as f INNER JOIN Site as s ON f.siteId = s.id
  WHERE
  f.updatedOn BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND DATE_SUB(NOW(), INTERVAL 30 DAY)
  `,
  subTitle: null,
  subTitleI18nKey: null,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'lastMonth',
  link: null,
  sortOrder: 4,
  externalId: 'bangladeshAverageCompletion',
  description: `The average custom fields completion percent in the current month. The calculation is based on the comparative between the completed score of each result's custom fields and total score of the fields assigned to the assay`,
  descriptionI18nKey: 'bangladeshAverageCompletionDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.DEVICES,
    },
  },
}

const totalModuleBays = {
  jobFunctions: ['all'],
  icon: 'MdViewModule',
  title: 'Total Modules Bays',
  titleI18nKey: 'totalModuleBays',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `
    SELECT SUM(d.moduleBayCapacity) AS cnt
    FROM Device as d
    LEFT JOIN DeviceApproval AS a ON a.id = d.deviceApprovalId
    WHERE a.token = 'approved'`,
  sortOrder: 5,
  externalId: 'totalModuleBays',
  description: 'Total Number Of Module Bays.',
  descriptionI18nKey: 'totalNoOfModuleBays',
  dashboards: {
    home: {},
  },
}

const activeModuleBays = {
  jobFunctions: ['all'],
  icon: 'MdCheck',
  title: 'Active Modules Bays',
  titleI18nKey: 'activeModuleBays',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `
    SELECT SUM(g.moduleBaysUsed) AS cnt
    FROM
      (
        SELECT f.deviceId, MAX(f.moduleBaysUsed) AS moduleBaysUsed
        FROM FactDeviceModulesCount AS f
        INNER JOIN Device AS d ON d.id = f.deviceId
        LEFT JOIN DeviceApproval AS a ON a.id = d.deviceApprovalId
        WHERE f.date >= DATE(NOW() - INTERVAL 7 DAY) AND a.token = 'approved'
        GROUP BY f.deviceId
      ) AS g`,
  sortOrder: 5,
  externalId: 'activeModuleBays',
  description: 'Total Number Of Active Module Bays.',
  descriptionI18nKey: 'totalNoOfActiveModuleBays',
  dashboards: {
    home: {},
  },
}

const disabledModulesWidget = {
  jobFunctions: ['all'],
  icon: 'MdViewModule',
  title: 'Non functional/Disabled Modules',
  titleI18nKey: 'disabledModulesWidget',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: '',
  sortOrder: 5,
  externalId: 'disabledModules',
  description: 'Count of Distinct Disabled GeneXpert Modules.',
  descriptionI18nKey: 'countOfDistinctDisabledGeneXpertModules',
  dashboards: {
    home: {},
  },
}

module.exports = {
  WIDGET_GROUP_KEYS,
  WIDGET_FILTER_KEYS,
  stat: {
    resultsTitle,
    dashboardWidgetTestsPerDayTitle,
    dashboardWidgetValidResultsPc,
    utilizationRate,
    activeDevices,
    activeDevicesCnt,
    stockouts,
    deviceDaysActive,
    errorRate,
    stockNotRecorded,
    moduleSwaps,
    gxPositiveResultsNotified,
    avgTimeToUpload,
    percentageOfModulesFunctioning,
    averageRecipientsOfEmail,
    averageRecipientsOfSms,
    averageLengthOfSms,
    averageDaysModuleSwap,
    smsSent,
    averageTimeToModuleReplacement,
    numberOfDevicesExperiencingServiceInterruption,
    averageDurationServiceInterruption,
    percentageOfDaysWithServiceInterruption,
    devicesTitle,
    sitesTitle,
    geneXpertDevices,
    dashboardWidgetTitleTotalDeaths,
    dashboardWidgetTitleConfirmedCases,
    dashboardWidgetTitleTotalActiveCases,
    dashboardWidgetTitleTotalRecoveredCases,
    deviceCalibrationPastDue,
    deviceCalibratedWhenDue,
    bangladeshAverageCompletion,
    instrumentsConnected,
    totalModuleBays,
    activeModuleBays,
    disabledModulesWidget,
    errorRateHomeWidget,
  },
}
