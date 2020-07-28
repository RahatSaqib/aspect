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
module.exports = {
  WIDGET_GROUP_KEYS,
  stat: [
    {
      jobFunctions: ['all'],
      icon: 'MdDateRange',
      title: 'TestsPerDay',
      titleI18nKey: 'dashboardWidgetTestsPerDayTitle',
      subTitle: null,
      subTitleI18nKey: null,
      sqlForIndicator: `SELECT ROUND(COUNT(r.id)/day(now())) as cnt
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
        dt.externalId = 'CepheidGeneXpert'`,
      sqlForStatUnit: `SELECT ROUND(COUNT(r.id)/DAY(LAST_DAY(DATE_SUB(NOW(), INTERVAL 1 MONTH)))) as cnt
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
        dt.externalId = 'CepheidGeneXpert'`,
      statUnit: '{unit} last month',
      statUnitI18nKey: 'dashboardWidgetTestsPerDayUnit',
      link: '/browse/result',
      sortOrder: 1,
      externalId: 'dashboardWidgetTestsPerDayTitle',
      description: 'Average number of tests per day reported the current month',
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
      title: 'ValidResultsPc',
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
      sortOrder: 2,
      externalId: 'dashboardWidgetValidResultsPc',
      description: 'Percentage of valid results reported the current month',
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
                SUM(dailyCapacity * DATEDIFF(NOW(), DATE_FORMAT(NOW(), '%Y-%m-01'))) * 100
              ,0)
            ,0)
          ,'%') AS cnt
          FROM (
            SELECT r.deviceId, COUNT(r.id) AS resultCount, dc.dailyCapacity
              FROM Result AS r
              INNER JOIN Device AS d ON d.id = r.deviceId
              INNER JOIN DeviceType as dt on dt.id = d.deviceTypeId
              INNER JOIN DeviceCapacity dc ON d.deviceCapacityId = dc.id
              INNER JOIN Site AS s ON s.id = d.siteId
              LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
            WHERE DATE_FORMAT(NOW(), '%Y-%m-01') <= DATE(r.endedOn)
            AND dt.externalId = 'CepheidGeneXpert'
            GROUP BY r.deviceId, dc.dailyCapacity
          ) AS innerQuery`,
      sqlForStatUnit: `SELECT
          CONCAT(
            ROUND(
              IFNULL(
                SUM(resultCount) /
                SUM(
                  dailyCapacity * DATEDIFF (LAST_DAY(NOW() - INTERVAL 1 MONTH),
                  DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01')
                  )
                ) * 100
              ,0)
            ,0)
          ,'%') AS cnt
          FROM (
            SELECT r.deviceId, COUNT(r.id) AS resultCount, dc.dailyCapacity
            FROM Result AS r
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
      statUnitI18nKey: 'dashboardWidgetUtilizationRate',
      link: '/browse/device',
      sortOrder: 0,
      externalId: 'utilizationRate',
      description:
        'The utilization rate is calculated by counting all tests conducted in the month and dividing that number by the total capacity of all devices',
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
      sqlForIndicator: `SELECT
      CONCAT(ROUND(IFNULL(AVG(AvailabilityPercentage), 0)), '%') AS cnt
  FROM
      (SELECT
          COUNT(DISTINCT DATE(r.endedOn)) * 100 / DATEDIFF(NOW(), GREATEST(DATE_FORMAT(NOW(), '%Y-%m-01'),d.createdOn)) AS AvailabilityPercentage
      FROM
          Device AS d
      INNER JOIN DeviceType as dt on dt.id = d.deviceTypeId
      LEFT JOIN Result AS r ON d.id = r.deviceId
          AND r.endedOn >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')
      INNER JOIN Site AS s ON s.id = d.siteId
      INNER JOIN Partner AS p ON s.partnerId = p.id
      LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
      WHERE dt.externalId = 'CepheidGeneXpert'
      GROUP BY d.id) AS q;`,
      sqlForStatUnit: `SELECT
      CONCAT(ROUND(IFNULL(AVG(AvailabilityPercentage), 0)), '%') AS cnt
  FROM
      (SELECT
          COUNT(DISTINCT DATE(r.endedOn)) * 100 / DATEDIFF(NOW(), GREATEST(DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), '%Y-%m-01'),d.createdOn)) AS AvailabilityPercentage
      FROM
          Device AS d
      INNER JOIN DeviceType as dt on dt.id = d.deviceTypeId
      LEFT JOIN Result AS r ON d.id = r.deviceId
          AND YEAR(r.endedOn) = YEAR(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH))
          AND MONTH(r.endedOn) = MONTH(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH))

      INNER JOIN Site AS s ON s.id = d.siteId
      INNER JOIN Partner AS p ON s.partnerId = p.id
      LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
      WHERE dt.externalId = 'CepheidGeneXpert'
      GROUP BY d.id) AS q;`,
      statUnit: '{unit} last month',
      statUnitI18nKey: 'dashboardWidgetActiveDevices',
      link: '/operational-data#deviceStatus',
      sortOrder: 1,
      externalId: 'activeDevices',
      description: `The daily percentage of devices that sent results`,
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
        INNER JOIN Geography AS g
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
        INNER JOIN Geography AS g
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
        'The stockout percentage is calculated by counting all sites with stockout issues during the month and dividing by all active sites',
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
      sqlForIndicator: `SELECT
          ROUND(
            IFNULL(
              AVG(dayCount)
            ,0)
          ,0)
        AS cnt
        FROM (
          SELECT r.deviceId, COUNT(DISTINCT DATE(r.endedOn)) AS dayCount
            FROM Result AS r
            INNER JOIN Device AS d ON d.id = r.deviceId
            INNER JOIN DeviceType as dt on dt.id = d.deviceTypeId
            INNER JOIN Site AS s ON s.id = d.siteId
            LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
          WHERE DATE_FORMAT(NOW(), '%Y-%m-01') <= DATE(r.endedOn)
          AND dt.externalId = 'CepheidGeneXpert'
          GROUP BY r.deviceId
        ) AS innerQuery`,
      sqlForStatUnit: `SELECT
          ROUND(
            IFNULL(
              AVG(dayCount)
            ,0)
          ,0)
        AS cnt
        FROM (
          SELECT r.deviceId, COUNT(DISTINCT DATE(r.endedOn)) AS dayCount
            FROM Result AS r
            INNER JOIN Device AS d ON d.id = r.deviceId
            INNER JOIN DeviceType as dt on dt.id = d.deviceTypeId
            INNER JOIN Site AS s ON s.id = d.siteId
            LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id
            WHERE DATE(r.endedOn) BETWEEN DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01')
                  AND LAST_DAY(NOW() - INTERVAL 1 MONTH)
                  AND dt.externalId = 'CepheidGeneXpert'
          GROUP BY r.deviceId
        ) AS innerQuery`,
      statUnit: '{unit} last month',
      statUnitI18nKey: 'dashboardWidgetDeviceDaysActiveTitle',
      link: '/operational-data#deviceStatus',
      sortOrder: 2,
      externalId: 'deviceDaysActive',
      description:
        'Average number of days each device has been active (Month-to-date)',
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
      sortOrder: 3,
      externalId: 'errorRate',
      description:
        'The error rate is calculated by counting all errors in the tests conducted in the month and dividing that number by the total tests carried out of all devices',
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
      sqlForIndicator: `SELECT
          CONCAT(
            ROUND(
              IFNULL(
                SUM(CASE WHEN quantityOnHand IS NULL AND deviceTypeExternalId = 'CepheidGeneXpert' THEN 1 ELSE 0 END)
                / COUNT(siteId) * 100
              ,0)
            ,0)
          ,'%') AS cnt
          FROM (
            SELECT s.id AS siteId, sum(i.quantityOnHand) AS quantityOnHand, dt.externalId as deviceTypeExternalId
            FROM Site AS s
            INNER JOIN Device AS d ON d.siteId = s.id
            LEFT OUTER JOIN InventoryItem AS i ON i.siteId = s.id
                                              AND i.createdOn BETWEEN DATE_FORMAT(NOW(), '%Y-%m-01')
                                              AND LAST_DAY(NOW())
            LEFT OUTER JOIN Consumable AS c ON i.consumableId = c.id
            LEFT OUTER JOIN ConsumableAssay ca ON c.id = ca.consumableId
            LEFT OUTER JOIN Assay a on ca.assayId = a.id
            LEFT OUTER JOIN DeviceType dt on a.deviceTypeId = dt.id
            GROUP BY s.id
          ) AS innerQuery`,
      sqlForStatUnit: `SELECT
      CONCAT(
        ROUND(
          IFNULL(
            SUM(CASE WHEN quantityOnHand IS NULL AND deviceTypeExternalId = 'CepheidGeneXpert' THEN 1 ELSE 0 END)
            / COUNT(siteId) * 100
          ,0)
        ,0)
      ,'%') AS cnt
      FROM (
        SELECT s.id AS siteId, sum(i.quantityOnHand) AS quantityOnHand, dt.externalId as deviceTypeExternalId
        FROM Site AS s
        INNER JOIN Device AS d ON d.siteId = s.id
        LEFT OUTER JOIN InventoryItem AS i ON i.siteId = s.id
                                        AND i.createdOn BETWEEN DATE_FORMAT(NOW() - INTERVAL 1 month, '%Y-%m-01')
                                        AND LAST_DAY(NOW() - INTERVAL 1 MONTH)
        LEFT OUTER JOIN Consumable AS c ON i.consumableId = c.id
        LEFT OUTER JOIN ConsumableAssay ca ON c.id = ca.consumableId
        LEFT OUTER JOIN Assay a on ca.assayId = a.id
        LEFT OUTER JOIN DeviceType dt on a.deviceTypeId = dt.id
        GROUP BY s.id
          ) AS innerQuery`,
      statUnit: '{unit} last month',
      statUnitI18nKey: 'dashboardWidgetStockNotRecorded',
      link: '/operational-data#inventoryStatus',
      sortOrder: 12,
      externalId: 'stockNotRecorded',
      description:
        'The stock not recorded is calculated by counting all sites with connected devices which are in the inventory items table and dividing that number by the total sites which has connected devices',
      descriptionI18nKey: 'stockNotRecordedDescription',
      dashboards: {
        operational: {
          groupI18nKey: WIDGET_GROUP_KEYS.INVENTORY,
        },
      },
    },
  ],
}
