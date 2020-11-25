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
  CURRENT_MONTH: 'currentMonth',
}

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
  statUnitI18nKey: 'dashboardWidgetUnitGeneXpertDevices',
  link: '/browse/device',
  sortOrder: 0,
  externalId: 'geneXpertDevices',
  description:
    'The number of approved GeneXpert devices (excluding decommissioned devices).',
  descriptionI18nKey: 'geneXpertDevices',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.CONNECTIVITY,
    },
  },
}

const personTitle = {
  jobFunctions: ['all'],
  icon: 'MdPermIdentity',
  title: 'Contacts',
  titleI18nKey: 'personTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator:
    'SELECT COUNT(pe.id) AS cnt FROM Person as pe INNER JOIN Partner as pa ON pe.partnerId IS NULL OR pe.partnerId = pa.id LEFT OUTER JOIN Geography AS g ON pe.geographyId = g.id',
  link: '/browse/person',
  sortOrder: 3,
  externalId: 'personTitle',
  description: 'The number of contacts in the system.',
  descriptionI18nKey: 'personDescription',
  dashboards: {
    home: {},
  },
}

const devicesTitle = {
  jobFunctions: ['all'],
  icon: 'MdDesktopWindows',
  title: 'Devices',
  titleI18nKey: 'devicesTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `select count(d.id) as cnt from Device as d inner join Site as s on s.id = d.siteId inner join DeviceType as dt on dt.id = d.deviceTypeId inner join DeviceTypeCategory as dc on dc.id = dt.deviceTypeCategoryId left outer join Geography as g on s.geographyId = g.id where dc.hasResults = 1`,
  link: '/browse/device',
  linkParams: {
    dateRange: WIDGET_FILTER_KEYS.CURRENT_MONTH,
  },
  sortOrder: 1,
  externalId: 'devicesTitle',
  description:
    'The number of approved lab devices (excluding decommissioned devices)',
  descriptionI18nKey: 'devicesDescription',
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
}

const sitesTitle = {
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
    INNER JOIN Site as s on s.id = d.siteId
    INNER JOIN Partner p on s.partnerId = p.id
    LEFT OUTER JOIN Geography as g on s.geographyId = g.id
  WHERE
    YEAR(r.endedOn) = YEAR(NOW())
    AND
    MONTH(r.endedOn) = MONTH(NOW())
    AND
    DAYOFWEEK(r.endedOn) <> 1
    AND
    DAYOFWEEK(r.endedOn) <> 7
    AND
    dt.externalId = 'CepheidGeneXpert'`,
  sqlForStatUnit: `SELECT ROUND(COUNT(r.id)/GetWeekdaysInRange(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), '%Y-%m-01'))) as cnt
  FROM Result as r
    INNER JOIN Device as d on d.id = r.deviceId
    INNER JOIN DeviceType as dt on dt.id = d.deviceTypeId
    INNER JOIN Site as s on s.id = d.siteId
    INNER JOIN Partner p on s.partnerId = p.id
    LEFT OUTER JOIN Geography as g on s.geographyId = g.id
  WHERE
    YEAR(r.endedOn) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
    AND
    MONTH(r.endedOn) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
    AND
    DAYOFWEEK(r.endedOn) <> 1
    AND
    DAYOFWEEK(r.endedOn) <> 7
    AND
    dt.externalId = 'CepheidGeneXpert'`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'dashboardWidgetTestsPerDayUnit',
  link: '/browse/result',
  linkParams: {
    deviceName: 'GeneXpert',
    dateRange: WIDGET_FILTER_KEYS.CURRENT_MONTH,
  },
  sortOrder: 1,
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
      YEAR(r.endedOn) = YEAR(NOW())
      AND
      MONTH(r.endedOn) = MONTH(NOW())
      AND
      dt.externalId = 'CepheidGeneXpert'
    `,
  sqlForStatUnit: `${partialValidResults}
    WHERE
      YEAR(r.endedOn) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
      AND
      MONTH(r.endedOn) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
      AND
      dt.externalId = 'CepheidGeneXpert'
  `,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'dashboardWidgetValidResultsPcUnit',
  link: '/browse/result',
  linkParams: {
    deviceName: 'GeneXpert',
    dateRange: WIDGET_FILTER_KEYS.CURRENT_MONTH,
  },
  sortOrder: 2,
  externalId: 'dashboardWidgetValidResultsPc',
  description:
    'Percentage of valid results reported this month. Valid results includes all results that didn\'t result in "Error", "No Result", or "Invalid".',
  descriptionI18nKey: 'dashboardWidgetValidResultsPcDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.DEVICES,
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
  sqlForIndicator: `SELECT
  CONCAT(
    ROUND(
      IFNULL(
        SUM(resultCount)
        /
        SUM(dailyCapacity * GetWeekdaysInRange(NOW(), DATE_FORMAT(NOW(), '%Y-%m-01'))) * 100
      ,0)
    ,0)
  ,'%') AS cnt
  FROM (
    SELECT d.id AS deviceId, COUNT(r.id) AS resultCount, dc.dailyCapacity
      FROM Device AS d
      INNER JOIN DeviceType as dt on dt.id = d.deviceTypeId
      INNER JOIN DeviceCapacity dc ON d.deviceCapacityId = dc.id
      INNER JOIN Site AS s ON s.id = d.siteId
      LEFT OUTER JOIN Result AS r ON d.id= r.deviceId AND DATE_FORMAT(NOW(), '%Y-%m-01') <= DATE(r.endedOn) AND DAYOFWEEK(r.endedOn) <> 1 AND DAYOFWEEK(r.endedOn) <> 7
      LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
    WHERE
      dt.externalId = 'CepheidGeneXpert'
    GROUP BY d.id, dc.dailyCapacity
  ) AS innerQuery`,
  sqlForStatUnit: `SELECT
  CONCAT(
    ROUND(
      IFNULL(
        SUM(resultCount)
        /
        SUM(dailyCapacity * GetWeekdaysInRange(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), '%Y-%m-01'))) * 100
      ,0)
    ,0)
  ,'%') AS cnt
  FROM (
    SELECT d.id AS deviceId, COUNT(r.id) AS resultCount, dc.dailyCapacity
      FROM Device AS d
      INNER JOIN DeviceType as dt on dt.id = d.deviceTypeId
      INNER JOIN DeviceCapacity dc ON d.deviceCapacityId = dc.id
      INNER JOIN Site AS s ON s.id = d.siteId
      LEFT OUTER JOIN Result AS r ON d.id = r.deviceId AND DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') > r.endedOn AND DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), '%Y-%m-01') < r.endedOn AND DAYOFWEEK(r.endedOn) <> 1 AND DAYOFWEEK(r.endedOn) <> 7
      LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
    WHERE
      dt.externalId = 'CepheidGeneXpert'
    GROUP BY d.id, dc.dailyCapacity
  ) AS innerQuery`,
  statUnit: '{unit} in last month',
  statUnitI18nKey: 'dashboardWidgetUtilizationRate',
  link: '/browse/device',
  linkParams: {
    dateRange: WIDGET_FILTER_KEYS.CURRENT_MONTH,
  },
  sortOrder: 0,
  externalId: 'utilizationRate',
  description:
    'The utilization rate is calculated by counting all tests conducted in the month and dividing that number by the total capacity of all devices. This calculation excludes weekends.',
  descriptionI18nKey: 'utilizationRateDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.DEVICES,
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
  INNER JOIN Site AS s ON s.id = d.siteId
  INNER JOIN Partner AS p ON s.partnerId = p.id
  LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
  WHERE dt.externalId = 'CepheidGeneXpert'
  AND ISNULL(dms2.id)
  AND MONTH(dml.day) = MONTH(CURRENT_DATE)
  AND YEAR(dml.day) = YEAR(CURRENT_DATE)
  AND DAYOFWEEK(dml.day) <> 1
  AND DAYOFWEEK(dml.day) <> 7`,
  sqlForStatUnit: `SELECT CONCAT(ROUND(SUM(dms.active = 1) * 100 / COUNT(dms.id), 0), '%') AS cnt
  FROM DeviceMaintenanceStatusLog AS dml
  LEFT OUTER JOIN DeviceMaintenanceStatusLog AS dms2 ON dml.deviceId = dms2.deviceId AND dml.day = dms2.day AND (dml.createdOn < dms2.createdOn OR (dml.createdOn = dms2.createdOn AND dml.id < dms2.id))
  INNER JOIN DeviceMaintenanceStatus AS dms ON dml.deviceMaintenanceStatusId = dms.id
  INNER JOIN Device AS d ON dml.deviceId = d.id
  INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
  INNER JOIN Site AS s ON s.id = d.siteId
  INNER JOIN Partner AS p ON s.partnerId = p.id
  LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
  WHERE dt.externalId = 'CepheidGeneXpert'
  AND ISNULL(dms2.id)
  AND MONTH(dml.day) = MONTH(CURRENT_DATE - INTERVAL 1 MONTH)
  AND YEAR(dml.day) = YEAR(CURRENT_DATE - INTERVAL 1 MONTH)
  AND DAYOFWEEK(dml.day) <> 1
  AND DAYOFWEEK(dml.day) <> 7`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'dashboardWidgetActiveDevices',
  link: '/operational-data#deviceStatus',
  sortOrder: 1,
  externalId: 'activeDevices',
  description: `The average daily percentage of devices sending results, excluding weekends.`,
  descriptionI18nKey: 'activeDevicesDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.CONNECTIVITY,
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
  statUnitI18nKey: 'dashboardWidgetStockouts',
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
    INNER JOIN Site AS s ON s.id = d.siteId
    INNER JOIN Partner AS p ON s.partnerId = p.id
    LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
    WHERE dt.externalId = 'CepheidGeneXpert'
    AND ISNULL(dms2.id)
    AND MONTH(dml.day) = MONTH(CURRENT_DATE)
    AND YEAR(dml.day) = YEAR(CURRENT_DATE)
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
    INNER JOIN Site AS s ON s.id = d.siteId
    INNER JOIN Partner AS p ON s.partnerId = p.id
    LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
    WHERE dt.externalId = 'CepheidGeneXpert'
    AND ISNULL(dms2.id)
    AND MONTH(dml.day) = MONTH(CURRENT_DATE - INTERVAL 1 MONTH)
    AND YEAR(dml.day) = YEAR(CURRENT_DATE - INTERVAL 1 MONTH)
    AND DAYOFWEEK(dml.day) <> 1
    AND DAYOFWEEK(dml.day) <> 7
    GROUP BY dml.deviceId
  ) as innerQuery`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'dashboardWidgetDeviceDaysActiveTitle',
  link: '/operational-data#deviceStatus',
  sortOrder: 2,
  externalId: 'deviceDaysActive',
  description:
    'Average number of days each device has been active, excluding weekends.',
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
        SELECT r.deviceId, SUM(rc.name = 'Error') as errorCount, COUNT(r.id) AS resultCount, dc.dailyCapacity
          FROM Result AS r
          INNER JOIN ResultCategory AS rc ON rc.id = r.resultCategory1
          INNER JOIN Device AS d ON d.id = r.deviceId
          INNER JOIN DeviceType as dt on dt.id = d.deviceTypeId
          INNER JOIN DeviceCapacity dc ON d.deviceCapacityId = dc.id
          INNER JOIN Site AS s ON s.id = d.siteId
          LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
        WHERE DATE_FORMAT(NOW(), '%Y-%m-01') <= DATE(r.endedOn)
        AND dt.externalId = 'CepheidGeneXpert'
        GROUP BY r.deviceId
      ) AS innerQuery`,
  sqlForStatUnit: `SELECT
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
        SELECT r.deviceId, SUM(rc.name = 'Error') as errorCount, COUNT(r.id) AS resultCount, dc.dailyCapacity
          FROM Result AS r
          INNER JOIN ResultCategory AS rc ON rc.id = r.resultCategory1
          INNER JOIN Device AS d ON d.id = r.deviceId
          INNER JOIN DeviceType as dt on dt.id = d.deviceTypeId
          INNER JOIN DeviceCapacity dc ON d.deviceCapacityId = dc.id
          INNER JOIN Site AS s ON s.id = d.siteId
          LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
        WHERE DATE(r.endedOn)
              BETWEEN DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01')
              AND LAST_DAY(NOW() - INTERVAL 1 MONTH)
              AND dt.externalId = 'CepheidGeneXpert'
        GROUP BY r.deviceId, dc.dailyCapacity
      ) AS innerQuery`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'dashboardWidgetErrorRate',
  link: '/browse/result',
  linkParams: {
    deviceName: 'GeneXpert',
    dateRange: WIDGET_FILTER_KEYS.CURRENT_MONTH,
  },
  sortOrder: 3,
  externalId: 'errorRate',
  description:
    'The error rate is calculated by counting all errors in the tests conducted in the month and dividing that number by the total tests carried out of all devices.',
  descriptionI18nKey: 'errorRateDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.DEVICES,
    },
  },
}

const stockNotRecorded = {
  jobFunctions: ['all'],
  icon: 'MdInbox',
  title: 'Stock not recorded',
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
  statUnitI18nKey: 'dashboardWidgetStockNotRecorded',
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
}

const moduleSwaps = {
  jobFunctions: ['all'],
  icon: 'MdSwapVert',
  title: 'Module Swaps',
  titleI18nKey: 'moduleSwapsTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `SELECT
  COUNT(*) AS cnt
    FROM
        Issue AS i
            INNER JOIN
        IssueType it ON i.issueTypeId = it.id
            INNER JOIN
        Device AS d ON d.id = i.deviceId
            INNER JOIN
        DeviceType as dt on dt.id = d.deviceTypeId
            INNER JOIN
        Site AS s ON s.id = d.siteId
            INNER JOIN
        Partner AS p ON s.partnerId = p.id
            LEFT OUTER JOIN
        Geography AS g ON s.geographyId = g.id
    WHERE
        it.externalId = 'ModuleReplaced'
        AND dt.externalId = 'CepheidGeneXpert'
        AND i.createdOn >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')`,
  sqlForStatUnit: `SELECT
  COUNT(*) AS cnt
    FROM
        Issue AS i
            INNER JOIN
        IssueType it ON i.issueTypeId = it.id
            INNER JOIN
        Device AS d ON d.id = i.deviceId
            INNER JOIN
        DeviceType as dt on dt.id = d.deviceTypeId
            INNER JOIN
        Site AS s ON s.id = d.siteId
            INNER JOIN
        Partner AS p ON s.partnerId = p.id
            LEFT OUTER JOIN
        Geography AS g ON s.geographyId = g.id
    WHERE
        it.externalId = 'ModuleReplaced'
        AND dt.externalId = 'CepheidGeneXpert'
        AND i.createdOn BETWEEN DATE_FORMAT(NOW() - interval 1 month, '%Y-%m-01') AND LAST_DAY(CURRENT_DATE-INTERVAL 1 MONTH)`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'dashboardWidgetModuleSwaps',
  link: '/browse/device',
  linkParams: {},
  sortOrder: 4,
  externalId: 'moduleSwaps',
  description: 'The number of module swaps made at the current month',
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
      SELECT
      CONCAT(IFNULL(ROUND(SUM(HasNotifications) * 100 / COUNT(*),
        0),
           0),
      '%') AS cnt
      FROM
      (SELECT
        MAX(em.id) IS NOT NULL OR MAX(sm.id) IS NOT NULL AS HasNotifications
      FROM
          Result AS r
      INNER JOIN Device d ON d.id = r.deviceId
      INNER JOIN Site s ON s.id = d.siteId
      INNER JOIN Partner p ON p.id = s.partnerId
      INNER JOIN Assay a ON r.assayId = a.id
      INNER JOIN ResultCategory rc ON r.resultCategory1 = rc.id
      INNER JOIN DeviceType dt ON a.deviceTypeId = dt.id
      LEFT JOIN Geography g ON s.geographyId = g.id
      LEFT JOIN Issue i ON r.id = i.resultId
      LEFT JOIN IssueType it ON i.issueTypeId = it.id
      LEFT JOIN Notification n ON i.id = n.issueId
      LEFT JOIN SmsMessage sm ON n.smsMessageId = sm.id AND sm.messageStatusId = 3
      LEFT JOIN EmailMessage em ON n.emailMessageId = em.id AND em.messageStatusId = 3
      LEFT JOIN DeviceApproval deviceApproval ON d.deviceApprovalId = deviceApproval.id
      WHERE
          rc.externalid IN ('Detected' , 'Trace Detected', 'MoreThan40', 'MoreThan150', 'MoreThan550', 'MoreThan1000', 'Resistant', 'Positive1', 'Positive2', 'Positive3', 'Scanty', 'PositiveMOTT', 'PositiveMTB', 'Positive')
              AND it.externalId = 'ResultReceived'
              AND dt.externalId = 'CepheidGeneXpert'
              AND YEAR(r.endedOn) = YEAR(CURRENT_DATE)
              AND MONTH(r.endedOn) = MONTH(CURRENT_DATE)
              AND (deviceApproval.token = 'approved'
              OR ISNULL(deviceApproval.token))
      GROUP BY r.id) AS q
  `,
  sqlForStatUnit: `
  SELECT
      CONCAT(IFNULL(ROUND(SUM(HasNotifications) * 100 / COUNT(*),
        0),
           0),
      '%') AS cnt
      FROM
      (SELECT
        MAX(em.id) IS NOT NULL OR MAX(sm.id) IS NOT NULL AS HasNotifications
      FROM
          Result AS r
      INNER JOIN Device d ON d.id = r.deviceId
      INNER JOIN Site s ON s.id = d.siteId
      INNER JOIN Partner p ON p.id = s.partnerId
      INNER JOIN Assay a ON r.assayId = a.id
      INNER JOIN ResultCategory rc ON r.resultCategory1 = rc.id
      INNER JOIN DeviceType dt ON a.deviceTypeId = dt.id
      LEFT JOIN Geography g ON s.geographyId = g.id
      LEFT JOIN Issue i ON r.id = i.resultId
      LEFT JOIN IssueType it ON i.issueTypeId = it.id
      LEFT JOIN Notification n ON i.id = n.issueId
      LEFT JOIN SmsMessage sm ON n.smsMessageId = sm.id AND sm.messageStatusId = 3
      LEFT JOIN EmailMessage em ON n.emailMessageId = em.id AND em.messageStatusId = 3
      LEFT JOIN DeviceApproval deviceApproval ON d.deviceApprovalId = deviceApproval.id
      WHERE
          rc.externalid IN ('Detected' , 'Trace Detected', 'MoreThan40', 'MoreThan150', 'MoreThan550', 'MoreThan1000', 'Resistant', 'Positive1', 'Positive2', 'Positive3', 'Scanty', 'PositiveMOTT', 'PositiveMTB', 'Positive')
              AND it.externalId = 'ResultReceived'
              AND dt.externalId = 'CepheidGeneXpert'
              AND YEAR(r.endedOn) = YEAR(DATE_ADD(CURRENT_DATE, INTERVAL -1 MONTH))
              AND MONTH(r.endedOn) = MONTH(DATE_ADD(CURRENT_DATE, INTERVAL -1 MONTH))
              AND (deviceApproval.token = 'approved'
              OR ISNULL(deviceApproval.token))
      GROUP BY r.id) AS q`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'gxPositiveResultsNotifiedPreviousMonth',
  sortOrder: 7,
  description:
    "The percentage of positive GeneXpert's results that were notified via SMS or email.",
  descriptionI18nKey: 'gxPositiveResultsNotifiedDescription',
  link: '/operational-data#resultsTransmitted',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.CONNECTIVITY,
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
  statUnitI18nKey: 'avgTimeToUploadStat',
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
}

const unusedModules = {
  jobFunctions: ['all'],
  title: 'Devices with Unused Modules',
  titleI18nKey: 'unusedModulesTitle',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `
  SELECT COUNT(deviceid) AS cnt
    FROM(
              SELECT d.id AS deviceid
                FROM Result AS r
                INNER JOIN Device AS d ON d.id = r.deviceId
                INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
                INNER JOIN Site AS s ON d.siteId = s.id
                LEFT OUTER JOIN Geography as g on s.geographyId = g.id
                WHERE DATE(r.endedOn) BETWEEN DATE_FORMAT(NOW(), '%Y-%m-01')
                      AND NOW()
                      AND dt.externalId = 'CepheidGeneXpert'
              GROUP BY d.id
              HAVING COUNT(DISTINCT r.moduleSerial) < 4 AND COUNT(DISTINCT r.id) >= 20
    ) AS innerquery
  `,
  sqlForStatUnit: `
  SELECT COUNT(deviceid) AS cnt
  FROM(
            SELECT d.id AS deviceid
              FROM Result AS r
              INNER JOIN Device AS d ON d.id = r.deviceId
              INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
              INNER JOIN Site AS s ON d.siteId = s.id
              LEFT OUTER JOIN Geography as g on s.geographyId = g.id
              WHERE DATE(r.endedOn) BETWEEN DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01')
                    AND LAST_DAY(NOW() - INTERVAL 1 MONTH)
                    AND dt.externalId = 'CepheidGeneXpert'
            GROUP BY d.id
            HAVING COUNT(DISTINCT r.moduleSerial) < 4 AND COUNT(DISTINCT r.id) >= 20
  ) AS innerquery
  `,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'unusedModulesStats',
  link: '/browse/device',
  linkParams: {},
  sortOrder: 6,
  externalId: 'unusedModules',
  description:
    "Counts devices that didn't use all available module bays for running the most recent 20 results. This can indicate a faulty module.",
  descriptionI18nKey: 'unusedModulesDescription',
  icon: 'MdSwapVert',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.SERVICE,
    },
  },
}

const instrumentsReplaced = {
  jobFunctions: ['all'],
  icon: 'MdSwapVert',
  title: 'Average Days for Instrument Replacement',
  titleI18nKey: 'instrumentsReplaced',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: `
  SELECT IFNULL(ROUND(AVG(days)), '-') AS cnt
  FROM (
    SELECT TIMESTAMPDIFF(DAY, max(r.endedOn), issueData.endedOn) AS days
    FROM (SELECT i.data ->> '$.replacedInstrumentSerial' as instrumentSerial, i.deviceId, r.endedOn
          FROM Issue AS i
          INNER JOIN Result AS r on i.resultId = r.id
          INNER JOIN Device AS d on r.deviceId = d.id
          INNER JOIN Site AS s ON d.siteId = s.id
          LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
          INNER JOIN IssueType AS it ON i.issueTypeId = it.id
          INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
          WHERE it.externalId = 'InstrumentReplaced'
          AND YEAR(r.endedOn) = YEAR(NOW())
          AND MONTH(r.endedOn) = MONTH(NOW())
          AND dt.externalId = 'CepheidGeneXpert'
        )
        AS issueData
    INNER JOIN Result AS r on issueData.deviceId = r.deviceId AND issueData.instrumentSerial = r.instrumentSerial
    GROUP by r.deviceId, r.instrumentSerial
  ) as innerQuery`,
  sqlForStatUnit: `
  SELECT IFNULL(ROUND(AVG(days)), '-') AS cnt
  FROM (
    SELECT TIMESTAMPDIFF(DAY, max(r.endedOn), issueData.endedOn) AS days
    FROM (SELECT i.data ->> '$.replacedInstrumentSerial' as instrumentSerial, i.deviceId, r.endedOn
          FROM Issue AS i
          INNER JOIN Result AS r on i.resultId = r.id
          INNER JOIN Device AS d on r.deviceId = d.id
          INNER JOIN Site AS s ON d.siteId = s.id
          LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
          INNER JOIN IssueType AS it ON i.issueTypeId = it.id
          INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
          WHERE it.externalId = 'InstrumentReplaced'
          AND YEAR(r.endedOn) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
          AND MONTH(r.endedOn) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
          AND dt.externalId = 'CepheidGeneXpert'
        )
        AS issueData
    INNER JOIN Result AS r on issueData.deviceId = r.deviceId AND issueData.instrumentSerial = r.instrumentSerial
    GROUP by r.deviceId, r.instrumentSerial
  ) as innerQuery`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'dashboardWidgetInstrumentsReplaced',
  link: '/browse/device',
  linkParams: {},
  sortOrder: 3,
  externalId: 'instrumentsReplaced',
  description:
    'The average number of days between when an instrument serial last reported from a device and a new instrument serial reporting.',
  descriptionI18nKey: 'instrumentsReplacedDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.SERVICE,
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
  sqlForIndicator: `SELECT ifnull(ROUND(AVG(resultCount)),0) AS cnt
  FROM
  (
  SELECT COUNT(em.resultId) AS resultCount
  FROM EmailMessage AS em
  INNER JOIN Device AS d ON d.id = em.deviceId
  INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
  INNER JOIN Site AS s ON d.siteId = s.id
  LEFT OUTER JOIN Geography as g on s.geographyId = g.id
  WHERE YEAR(em.createdOn) = YEAR(NOW())
  AND MONTH(em.createdOn) = MONTH(NOW())
  AND em.resultId IS NOT NULL
  AND dt.externalId = 'CepheidGeneXpert'
  GROUP BY em.resultId
  ) AS innerQuery`,
  sqlForStatUnit: `SELECT ifnull(ROUND(AVG(resultCount)),0) AS cnt
  FROM
  (
  SELECT COUNT(em.resultId) AS resultCount
  FROM EmailMessage AS em
  INNER JOIN Device AS d ON d.id = em.deviceId
  INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
  INNER JOIN Site AS s ON d.siteId = s.id
  LEFT OUTER JOIN Geography as g on s.geographyId = g.id
  WHERE YEAR(em.createdOn) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
  AND MONTH(em.createdOn) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
  AND em.resultId IS NOT NULL
  AND dt.externalId = 'CepheidGeneXpert'
  GROUP BY em.resultId
  ) AS innerQuery`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'dashboardAverageRecipientsOfEmail',
  link: '/operational-data#resultsTransmitted',
  sortOrder: 9,
  externalId: 'averageRecipientsOfEmail',
  description:
    'The average number of email recipients per positive GeneXpert result.',
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
  sqlForIndicator: `SELECT IFNULL(ROUND(AVG(resultCount)),0) AS cnt
  FROM
  (
  SELECT COUNT(sms.resultId) AS resultCount
  FROM SmsMessage AS sms
  INNER JOIN Device AS d ON d.id = sms.deviceId
  INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
  INNER JOIN Site AS s ON d.siteId = s.id
  LEFT OUTER JOIN Geography as g on s.geographyId = g.id
  WHERE YEAR(sms.createdOn) = YEAR(NOW())
  AND MONTH(sms.createdOn) = MONTH(NOW())
  AND sms.resultId IS NOT NULL
  AND dt.externalId = 'CepheidGeneXpert'
  GROUP BY sms.resultId
  ) AS innerQuery`,
  sqlForStatUnit: `SELECT IFNULL(ROUND(AVG(resultCount)),0) AS cnt
  FROM
  (
  SELECT COUNT(sms.resultId) AS resultCount
  FROM SmsMessage AS sms
  INNER JOIN Device AS d ON d.id = sms.deviceId
  INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
  INNER JOIN Site AS s ON d.siteId = s.id
  LEFT OUTER JOIN Geography as g on s.geographyId = g.id
  WHERE YEAR(sms.createdOn) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
  AND MONTH(sms.createdOn) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
  AND sms.resultId IS NOT NULL
  AND dt.externalId = 'CepheidGeneXpert'
  GROUP BY sms.resultId
  ) AS innerQuery`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'dashboardAverageRecipientsOfSms',
  link: '/operational-data#resultsTransmitted',
  sortOrder: 10,
  externalId: 'averageRecipientsOfSms',
  description:
    'The average number of SMS recipients per positive GeneXpert result.',
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
  INNER JOIN Site AS s ON d.siteId = s.id
  LEFT OUTER JOIN Geography as g on s.geographyId = g.id
  WHERE YEAR(sms.createdOn) = YEAR(NOW())
  AND MONTH(sms.createdOn) = MONTH(NOW())
  AND sms.resultId IS NOT NULL
  AND dt.externalId = 'CepheidGeneXpert'
  GROUP BY sms.resultId
  ) AS innerQuery`,
  sqlForStatUnit: `SELECT IFNULL(ROUND(AVG(messageLength)),0) AS cnt
  FROM
  (
  SELECT length(sms.message) AS messageLength
  FROM SmsMessage AS sms
  INNER JOIN Device AS d ON d.id = sms.deviceId
  INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
  INNER JOIN Site AS s ON d.siteId = s.id
  LEFT OUTER JOIN Geography as g on s.geographyId = g.id
  WHERE YEAR(sms.createdOn) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
  AND MONTH(sms.createdOn) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
  AND sms.resultId IS NOT NULL
  AND dt.externalId = 'CepheidGeneXpert'
  GROUP BY sms.resultId
  ) AS innerQuery`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'dashboardAverageLengthOfSms',
  link: '/browse/notification',
  sortOrder: 11,
  externalId: 'averageLengthOfSms',
  description:
    'The average number of characters in SMS messages sent about positive GeneXpert results.',
  descriptionI18nKey: 'averageLengthOfSmsDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.CONNECTIVITY,
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
    INNER JOIN Site AS s ON d.siteId = s.id
    LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
  WHERE
    YEAR(sms.createdOn) = YEAR(NOW())
    AND MONTH(sms.createdOn) = MONTH(NOW())
    AND sms.resultId IS NOT NULL
    AND dt.externalId = 'CepheidGeneXpert'`,
  sqlForStatUnit: `
  SELECT
    IFNULL(SUM(CEIL(LENGTH(message)/140)),0) as cnt
  FROM SmsMessage AS sms
    INNER JOIN Device AS d ON d.id = sms.deviceId
    INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
    INNER JOIN Site AS s ON d.siteId = s.id
    LEFT OUTER JOIN Geography as g on s.geographyId = g.id
  WHERE
    YEAR(sms.createdOn) = YEAR(NOW())
    AND sms.resultId IS NOT NULL
    AND dt.externalId = 'CepheidGeneXpert'
  `,
  statUnit: '{unit} YTD',
  statUnitI18nKey: 'dashboardWidgetSmsSentStat',
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
    FROM (SELECT i.data ->> '$.replacedModuleSerial' as moduleSerial, i.data ->> '$.moduleName' as moduleName, i.deviceId, r.endedOn
          FROM Issue AS i
          INNER JOIN Result AS r on i.resultId = r.id
          INNER JOIN Device AS d on r.deviceId = d.id
          INNER JOIN Site AS s ON d.siteId = s.id
          LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
          INNER JOIN IssueType AS it ON i.issueTypeId = it.id
          WHERE it.externalId = 'ModuleReplaced'
          AND YEAR(r.endedOn) = YEAR(NOW())
          AND MONTH(r.endedOn) = MONTH(NOW())
        )
        AS issueData
    INNER JOIN Result AS r on issueData.deviceId = r.deviceId AND issueData.moduleName = r.moduleName AND issueData.moduleSerial = r.moduleSerial
    GROUP by r.deviceId, r.moduleName, r.moduleSerial
  ) as innerQuery`,
  sqlForStatUnit: `SELECT IFNULL(ROUND(AVG(days)), '-') AS cnt
  FROM (
    SELECT TIMESTAMPDIFF(DAY, max(r.endedOn), issueData.endedOn) AS days
    FROM (SELECT i.data ->> '$.replacedModuleSerial' as moduleSerial, i.data ->> '$.moduleName' as moduleName, i.deviceId, r.endedOn
          FROM Issue AS i
          INNER JOIN Result AS r on i.resultId = r.id
          INNER JOIN Device AS d on r.deviceId = d.id
          INNER JOIN Site AS s ON d.siteId = s.id
          LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
          INNER JOIN IssueType AS it ON i.issueTypeId = it.id
          WHERE it.externalId = 'ModuleReplaced'
          AND YEAR(r.endedOn) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
          AND MONTH(r.endedOn) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
        )
        AS issueData
    INNER JOIN Result AS r on issueData.deviceId = r.deviceId AND issueData.moduleName = r.moduleName AND issueData.moduleSerial = r.moduleSerial
    GROUP by r.deviceId, r.moduleName, r.moduleSerial
  ) as innerQuery`,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'dashboardAverageDaysModuleSwap',
  link: '/browse/notification',
  sortOrder: 4,
  externalId: 'averageDaysModuleSwap',
  description:
    'The average number of days between the last result reported under a replaced module serial and the new module serial in that module slot reporting its first result.',
  descriptionI18nKey: 'averageDaysModuleSwapDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.SERVICE,
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
      AND YEAR(logResolved.createdOn) = YEAR(NOW())
      AND MONTH(logResolved.createdOn) = MONTH(NOW())
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
    AND YEAR(logResolved.createdOn) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
    AND MONTH(logResolved.createdOn) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
  `,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'averageTimeToModuleReplacementUnit',
  link: '/browse/notification',
  sortOrder: 5,
  externalId: 'averageTimeToModuleReplacement',
  description: `The average time (in days) between when a module was disabled and a different module serial being detected in the same slot.`,
  descriptionI18nKey: 'averageTimeToModuleReplacementDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.SERVICE,
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
          INNER JOIN
      Site AS s ON s.id = d.siteId
          LEFT OUTER JOIN
      Geography AS g ON s.geographyId = g.id
          INNER JOIN
      DeviceMaintenanceStatusLog dmsl ON d.id = dmsl.deviceId
          INNER JOIN
      DeviceMaintenanceStatus dms ON dmsl.deviceMaintenanceStatusId = dms.id
          INNER JOIN
      DeviceType AS dt ON dt.id = d.deviceTypeId
  WHERE
      dms.externalId = 'inactiveDownForRepair'
          AND YEAR(dmsl.day) = YEAR(CURRENT_DATE)
          AND MONTH(dmsl.day) = MONTH(CURRENT_DATE)
          AND dt.externalId = 'CepheidGeneXpert'
  `,
  sqlForStatUnit: `
  SELECT
    COUNT(DISTINCT d.id) AS cnt
  FROM
      Device AS d
          INNER JOIN
      Site AS s ON s.id = d.siteId
          LEFT OUTER JOIN
      Geography AS g ON s.geographyId = g.id
          INNER JOIN
      DeviceMaintenanceStatusLog dmsl ON d.id = dmsl.deviceId
          INNER JOIN
      DeviceMaintenanceStatus dms ON dmsl.deviceMaintenanceStatusId = dms.id
          INNER JOIN
      DeviceType AS dt ON dt.id = d.deviceTypeId
  WHERE
      dms.externalId = 'inactiveDownForRepair'
          AND YEAR(dmsl.day) = YEAR(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH))
          AND MONTH(dmsl.day) = MONTH(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH))
          AND dt.externalId = 'CepheidGeneXpert'
  `,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'numberOfDevicesExperiencingServiceInterruptionUnit',
  link: '/browse/device',
  sortOrder: 0,
  externalId: 'numberOfDevicesExperiencingServiceInterruption',
  description: `The number of devices experiencing service interruption on this and the previous month.`,
  descriptionI18nKey:
    'numberOfDevicesExperiencingServiceInterruptionDescription',
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
      INNER JOIN Site AS s ON s.id = d.siteId
      LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
      LEFT OUTER JOIN
      (
          SELECT  dmsl.deviceId, COUNT(dmsl.deviceId) AS times
          FROM DeviceMaintenanceStatusLog AS dmsl
          LEFT OUTER JOIN DeviceMaintenanceStatusLog AS dmsl2 ON dmsl.deviceId = dmsl2.deviceId AND dmsl.day = DATE_SUB(dmsl2.day, INTERVAL 1 DAY) AND dmsl2.deviceMaintenanceStatusId <> dmsl.deviceMaintenanceStatusId
              LEFT OUTER JOIN DeviceMaintenanceStatus AS dms ON dmsl2.deviceMaintenanceStatusId = dms.id
          WHERE YEAR(dmsl.day) = YEAR(NOW())
              AND MONTH(dmsl.day) = MONTH(NOW())
              AND dms.externalId = 'inactiveDownForRepair'
          GROUP BY dmsl.deviceId) AS o ON dmsl.deviceId = o.deviceId
    WHERE YEAR(dmsl.day) = YEAR(NOW())
    AND MONTH(dmsl.day) = MONTH(NOW())
    AND dms.externalId = 'inactiveDownForRepair'
    AND dt.externalId = 'CepheidGeneXpert'
    GROUP BY deviceId
    ORDER BY deviceId , minInactive) AS innerQuery
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
      INNER JOIN Site AS s ON s.id = d.siteId
      LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
      LEFT OUTER JOIN
      (
          SELECT  dmsl.deviceId, COUNT(dmsl.deviceId) AS times
      FROM DeviceMaintenanceStatusLog AS dmsl
      LEFT OUTER JOIN DeviceMaintenanceStatusLog AS dmsl2 ON dmsl.deviceId = dmsl2.deviceId AND dmsl.day = DATE_SUB(dmsl2.day, INTERVAL 1 DAY) AND dmsl2.deviceMaintenanceStatusId <> dmsl.deviceMaintenanceStatusId
          LEFT OUTER JOIN DeviceMaintenanceStatus AS dms ON dmsl2.deviceMaintenanceStatusId = dms.id
      WHERE YEAR(dmsl.day) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
          AND MONTH(dmsl.day) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
          AND dms.externalId = 'inactiveDownForRepair'
      GROUP BY dmsl.deviceId) AS o ON dmsl.deviceId = o.deviceId
    WHERE YEAR(dmsl.day) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
    AND MONTH(dmsl.day) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
    AND dms.externalId = 'inactiveDownForRepair'
    AND dt.externalId = 'CepheidGeneXpert'
    GROUP BY deviceId
    ORDER BY deviceId , minInactive) AS innerQuery
  `,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'averageDurationServiceInterruptionUnit',
  link: '/browse/device',
  sortOrder: 1,
  externalId: 'averageDurationServiceInterruption',
  description: `The average duration of a service interruption, in days.`,
  descriptionI18nKey: 'averageDurationServiceInterruptionDescription',
  dashboards: {
    operational: {
      groupI18nKey: WIDGET_GROUP_KEYS.SERVICE,
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
      INNER JOIN Site AS s ON s.id = d.siteId
      LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
      LEFT OUTER JOIN (
        SELECT COUNT(DISTINCT dmsl.day) AS daysInactive, dmsl.deviceId
        FROM DeviceMaintenanceStatusLog AS dmsl
        INNER JOIN Device AS d ON dmsl.deviceId = d.id
        INNER JOIN DeviceMaintenanceStatus AS dms ON dmsl.deviceMaintenanceStatusId = dms.id
        WHERE YEAR(dmsl.day) = YEAR(NOW())
        AND MONTH(dmsl.day) = MONTH(NOW())
        AND d.createdOn <= NOW()
        AND dms.externalId = 'inactiveDownForRepair'
        AND DAYOFWEEK(dmsl.day) <> 1
        AND DAYOFWEEK(dmsl.day) <> 7
        GROUP BY dmsl.deviceId
      ) AS down ON d.id = down.deviceId
      WHERE d.createdOn <= NOW()
    AND dt.externalId = 'CepheidGeneXpert'
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
    INNER JOIN Site AS s ON s.id = d.siteId
    LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
    LEFT OUTER JOIN (
      SELECT COUNT(DISTINCT dmsl.day) AS daysInactive, dmsl.deviceId
      FROM DeviceMaintenanceStatusLog AS dmsl
      INNER JOIN Device AS d ON dmsl.deviceId = d.id
      INNER JOIN DeviceMaintenanceStatus AS dms ON dmsl.deviceMaintenanceStatusId = dms.id
      WHERE YEAR(dmsl.day) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
      AND MONTH(dmsl.day) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
      AND d.createdOn <= LAST_DAY(DATE_SUB(NOW(), INTERVAL 1 MONTH))
      AND dms.externalId = 'inactiveDownForRepair'
      AND DAYOFWEEK(dmsl.day) <> 1
      AND DAYOFWEEK(dmsl.day) <> 7
      GROUP BY dmsl.deviceId
    ) AS down ON d.id = down.deviceId
    WHERE d.createdOn <= LAST_DAY(DATE_SUB(NOW(), INTERVAL 1 MONTH))
    AND dt.externalId = 'CepheidGeneXpert'
  `,
  statUnit: '{unit} last month',
  statUnitI18nKey: 'percentageOfDaysWithServiceInterruptionUnit',
  link: '/browse/device',
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
  statUnitI18nKey: 'dashboardWidgetUnitDeathUnitCases',
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
  statUnitI18nKey: 'dashboardWidgetUnitConfirmedCases',
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
  statUnitI18nKey: 'dashboardWidgetUnitActiveCases',
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
  statUnitI18nKey: 'dashboardWidgetUnitRecoveredCases',
  link: '/browse/case?filters=',
  sortOrder: 6,
  externalId: 'dashboardWidgetTitleTotalRecoveredCases',
  description: `The number of results that belong to a patient that recovered`,
  descriptionI18nKey: 'totalActiveCasesDescription',
  dashboards: {
    home: {},
  },
}

const serverUptimeTitle = {
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
}

module.exports = {
  WIDGET_GROUP_KEYS,
  WIDGET_FILTER_KEYS,
  stat: {
    resultsTitle,
    personTitle,
    dashboardWidgetTestsPerDayTitle,
    dashboardWidgetValidResultsPc,
    utilizationRate,
    activeDevices,
    stockouts,
    deviceDaysActive,
    errorRate,
    stockNotRecorded,
    moduleSwaps,
    gxPositiveResultsNotified,
    avgTimeToUpload,
    unusedModules,
    instrumentsReplaced,
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
    serverUptimeTitle
  },
}
