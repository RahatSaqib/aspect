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

module.exports = {
  WIDGET_GROUP_KEYS,
  WIDGET_FILTER_KEYS,
  stat: [
    {
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
    },
    {
      jobFunctions: ['all'],
      icon: 'MdCheck',
      title: 'Valid Results Pc',
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
      icon: 'MdInbox',
      title: 'Stock not recorded',
      titleI18nKey: 'stockNotRecordedTitle',
      subTitle: null,
      subTitleI18nKey: null,
      sqlForIndicator: `SELECT CONCAT(ROUND(SUM(ii.siteId IS NULL) / COUNT(s.id) * 100), '%') AS cnt
      FROM Device AS d
      INNER JOIN DeviceType AS dt ON d.deviceTypeId = dt.id
      INNER JOIN Site AS s on d.siteId = s.id
      LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
      LEFT OUTER JOIN InventoryItem AS ii ON s.id = ii.siteId
      WHERE dt.externalId = 'CepheidGeneXpert'`,
      sqlForStatUnit: `SELECT CONCAT(ROUND(SUM(ii.siteId IS NULL) / COUNT(s.id) * 100), '%') AS cnt
      FROM Device AS d
      INNER JOIN DeviceType AS dt ON d.deviceTypeId = dt.id
      INNER JOIN Site AS s on d.siteId = s.id
      LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
      LEFT OUTER JOIN InventoryItem AS ii ON s.id = ii.siteId AND ii.createdON < DATE_FORMAT(NOW(), '%Y-%m-01')
      WHERE dt.externalId = 'CepheidGeneXpert'`,
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
    },
    {
      jobFunctions: ['all'],
      icon: 'MdSwapVert',
      title: 'Module swaps',
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
      sortOrder: 1,
      externalId: 'moduleSwaps',
      description: 'The number of module swaps made at the current month',
      descriptionI18nKey: 'moduleSwapsDescription',
      dashboards: {
        operational: {
          groupI18nKey: WIDGET_GROUP_KEYS.SERVICE,
        },
      },
    },
    {
      icon: 'MdNotificationsNone',
      jobFunctions: ['all'],
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
    },
    {
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
    },
    {
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
      sortOrder: 3,
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
    },
    {
      icon: 'MdSwapVert',
      title: 'Average Days for Instrument Replacement',
      titleI18nKey: 'instrumentsReplaced',
      subTitle: null,
      subTitleI18nKey: null,
      sqlForIndicator: `
      SELECT
        ROUND(IFNULL(SUM(days)/count(deviceId), 0)) AS cnt
      FROM (
      SELECT r1.deviceId, DATEDIFF(Min(r2.createdOn), Max(r1.createdOn)) AS days
      FROM Result AS r1
          INNER JOIN Result AS r2 ON r1.deviceId=r2.deviceId AND r1.id<>r2.id AND r1.instrumentSerial<> r2.instrumentSerial and r1.createdOn < r2.createdOn
          INNER JOIN Device AS d ON d.id = r1.deviceId
          INNER JOIN Site AS s ON d.siteId = s.id
          LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
          INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
      WHERE YEAR(r1.endedOn) = YEAR(NOW())
                AND
                MONTH(r1.endedOn) = MONTH(NOW())
                AND
                dt.externalId = 'CepheidGeneXpert'
      GROUP BY deviceId) AS innerQuery`,
      sqlForStatUnit: `
      SELECT
      ROUND(IFNULL(
        SUM(days)/count(deviceId), 0)) AS cnt
      FROM (
      SELECT r1.deviceId, DATEDIFF(Min(r2.createdOn), Max(r1.createdOn)) AS days
      FROM Result AS r1
        INNER JOIN Result AS r2 ON r1.deviceId=r2.deviceId AND r1.id<>r2.id AND r1.instrumentSerial<> r2.instrumentSerial and r1.createdOn < r2.createdOn
        INNER JOIN Device AS d ON d.id = r1.deviceId
        INNER JOIN Site AS s ON d.siteId = s.id
        LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
        INNER JOIN DeviceType AS dt ON dt.id = d.deviceTypeId
      WHERE
            YEAR(r1.endedOn) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
            AND
            MONTH(r1.endedOn) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
            AND
            dt.externalId = 'CepheidGeneXpert'
      GROUP BY deviceId) AS innerQuery`,
      statUnit: '{unit} last month',
      statUnitI18nKey: 'dashboardWidgetInstrumentsReplaced',
      link: '/browse/device',
      linkParams: {},
      sortOrder: 4,
      externalId: 'instrumentsReplaced',
      description: 'The average days for an instrument replacement.',
      descriptionI18nKey: 'instrumentsReplacedDescription',
      dashboards: {
        operational: {
          groupI18nKey: WIDGET_GROUP_KEYS.SERVICE,
        },
      },
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
      icon: 'MdTextsms',
      title: 'Number of SMS Sent MTD',
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
    },
    {
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
      sortOrder: 2,
      externalId: 'averageDaysModuleSwap',
      description:
        'The average number of days between the last result reported under a replaced module serial and the new module serial in that module slot reporting its first result.',
      descriptionI18nKey: 'averageDaysModuleSwapDescription',
      dashboards: {
        operational: {
          groupI18nKey: WIDGET_GROUP_KEYS.SERVICE,
        },
      },
    },
    {
      icon: 'MdSwapVert',
      title: 'Average time to module replacement',
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
      sortOrder: 25,
      externalId: 'averageTimeToModuleReplacement',
      description: `The average time (in days) between module replacement - i.e.
        between day module serial was marked as disabled until a
        different module serial detected in that slot.`,
      descriptionI18nKey: 'averageTimeToModuleReplacementDescription',
      dashboards: {
        operational: {
          groupI18nKey: WIDGET_GROUP_KEYS.SERVICE,
        },
      },
    },
    {
      icon: 'MdSwapVert',
      title: 'Number of Devices Experiencing Service Interruption',
      titleI18nKey: 'numberOfDevicesExperiencingServiceInterrumptionTitle',
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
      statUnitI18nKey: 'numberOfDevicesExperiencingServiceInterrumptionUnit',
      link: '/browse/device',
      sortOrder: 26,
      externalId: 'numberOfDevicesExperiencingServiceInterrumption',
      description: `The number of devices experiencing service interrumption on this and the previous month.`,
      descriptionI18nKey:
        'numberOfDevicesExperiencingServiceInterrumptionDescription',
      dashboards: {
        operational: {
          groupI18nKey: WIDGET_GROUP_KEYS.SERVICE,
        },
      },
    },
    {
      icon: 'MdBuild',
      title: 'Percentage of Days with Service Interruption',
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
            SELECT COUNT(DISTINCT day) AS daysInactive, dmsl.deviceId
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
          SELECT COUNT(DISTINCT day) AS daysInactive, dmsl.deviceId
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
    },
  ],
}
