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
  INNER JOIN Site as s on s.id = d.siteId
  INNER JOIN Partner p on s.partnerId = p.id
  LEFT OUTER JOIN Geography as g on s.geographyId = g.id
  LEFT OUTER JOIN ResultCategory rc on r.resultCategory1 = rc.id
`

module.exports = {
  stat: [
    {
      jobFunctions: ['all'],
      icon: 'link',
      title: 'TestsPerDay',
      titleI18nKey: 'dashboardWidgetTestsPerDayTitle',
      subTitle: null,
      subTitleI18nKey: null,
      sqlForIndicator: `SELECT IFNULL(CAST(CEILING(avg(cnt)) AS CHAR), '?') as cnt
        FROM (
          SELECT COUNT(r.id) as cnt
          FROM Result as r
            INNER JOIN Device as d on d.id = r.deviceId
            INNER JOIN Site as s on s.id = d.siteId
            INNER JOIN Partner p on s.partnerId = p.id
            LEFT OUTER JOIN Geography as g on s.geographyId = g.id
          WHERE
            YEAR(r.endedOn) = YEAR(NOW()) 
            AND 
            MONTH(r.endedOn) = MONTH(NOW())
          GROUP BY DATE(r.endedOn)
        ) as t1`,
      sqlForStatUnit: `SELECT 
          CASE
            WHEN avgCurrentMonth IS NULL OR avgLastMonth IS NULL THEN '?'
            ELSE
              CASE 
                WHEN avgCurrentMonth >= avgLastMonth 
                THEN concat('+', (avgCurrentMonth - avgLastMonth))
                ELSE concat('-', (avgCurrentMonth - avgLastMonth))
              END
            END as cnt
        FROM (
        SELECT 
          (
            SELECT CEILING(avg(cnt)) 
            FROM (
              SELECT COUNT(r.id) as cnt
              FROM Result as r
                INNER JOIN Device as d on d.id = r.deviceId
                INNER JOIN Site as s on s.id = d.siteId
                INNER JOIN Partner p on s.partnerId = p.id
                LEFT OUTER JOIN Geography as g on s.geographyId = g.id
              WHERE
                YEAR(r.endedOn) = YEAR(NOW()) 
                AND 
                MONTH(r.endedOn) = MONTH(NOW())
              GROUP BY DATE(r.endedOn)
            ) as t1
          ) as avgCurrentMonth,
          (
            SELECT CEILING(avg(cnt)) 
            FROM (
              SELECT COUNT(r.id) as cnt
              FROM Result as r
                INNER JOIN Device as d on d.id = r.deviceId
                INNER JOIN Site as s on s.id = d.siteId
                INNER JOIN Partner p on s.partnerId = p.id
                LEFT OUTER JOIN Geography as g on s.geographyId = g.id
              WHERE
                YEAR(r.endedOn) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
                AND
                MONTH(r.endedOn) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
              GROUP BY DATE(r.endedOn)
            ) as t2
          ) as avgLastMonth
        ) as t
      `,
      statUnit: '{unit} from last month',
      statUnitI18nKey: 'dashboardWidgetTestsPerDayUnit',
      link: '/browse/result',
      sortOrder: 10,
      externalId: 'dashboardWidgetTestsPerDayTitle',
      description: 'Average number of tests per day reported the current month',
      descriptionI18nKey: 'dashboardWidgetTestsPerDayDescription',
      dashboards: ['operational'],
    },
    {
      jobFunctions: ['all'],
      icon: 'link',
      title: 'ValidResultsPc',
      titleI18nKey: 'dashboardWidgetValidResultsPc',
      subTitle: null,
      subTitleI18nKey: null,
      sqlForIndicator: `${partialValidResults}
        WHERE
          YEAR(r.endedOn) = YEAR(NOW()) 
          AND 
          MONTH(r.endedOn) = MONTH(NOW())
        `,
      sqlForStatUnit: `${partialValidResults}
        WHERE
          YEAR(r.endedOn) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
          AND
          MONTH(r.endedOn) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
      `,
      statUnit: '{unit} in previous month',
      statUnitI18nKey: 'dashboardWidgetValidResultsPcUnit',
      link: '/browse/result',
      sortOrder: 11,
      externalId: 'dashboardWidgetValidResultsPc',
      description: 'Percentage of valid results reported the current month',
      descriptionI18nKey: 'dashboardWidgetValidResultsPcDescription',
      dashboards: ['operational'],
    },
    {
      icon: 'link',
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
              INNER JOIN Device AS d ON d.id= r.deviceId 
              INNER JOIN DeviceCapacity dc ON d.deviceCapacityId = dc.id 
              INNER JOIN Site AS s ON s.id = d.siteId 
              LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id 
            WHERE DATE_FORMAT(NOW(), '%Y-%m-01') <= DATE(r.endedOn) 
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
              INNER JOIN Device AS d ON d.id= r.deviceId 
              INNER JOIN DeviceCapacity dc ON d.deviceCapacityId = dc.id 
              INNER JOIN Site AS s ON s.id = d.siteId 
              LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id 
            WHERE DATE(r.endedOn) 
                  BETWEEN DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01') 
                  AND LAST_DAY(NOW()-INTERVAL 1 MONTH) 
            GROUP BY r.deviceId, dc.dailyCapacity
          ) AS innerQuery`,
      statUnit: '{unit} in previous month',
      statUnitI18nKey: 'dashboardWidgetUtilizationRate',
      link: '/browse/device',
      sortOrder: 12,
      externalId: 'utilizationRate',
      description:
        'The utilization rate is calculated by counting all tests conducted in the month and dividing that number by the total capacity of all devices',
      descriptionI18nKey: 'utilizationRateDescription',
      dashboards: ['operational'],
    },
    {
      jobFunctions: ['all'],
      icon: 'fa-reg-calendar-check',
      title: 'Active',
      titleI18nKey: 'activeDevicesTitle',
      subTitle: null,
      subTitleI18nKey: null,
      sqlForIndicator: `SELECT CONCAT(ROUND(AVG(AvailabilityPercentage), 1), '%') AS cnt FROM (SELECT COUNT(DISTINCT DATE(r.endedOn)) * 100 / (CASE WHEN d.createdOn < DATE_FORMAT(NOW(), '%Y-%m-01') THEN DATEDIFF(NOW(), DATE_FORMAT(NOW(), '%Y-%m-01')) ELSE DATEDIFF(d.createdOn, DATE_FORMAT(NOW(), '%Y-%m-01')) END) AS AvailabilityPercentage FROM Device AS d LEFT JOIN Result AS r ON d.id = r.deviceId AND r.endedOn >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON s.partnerId = p.id LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id GROUP BY d.id) AS q;`,
      sqlForStatUnit: `SELECT CONCAT(CASE WHEN (AVG(CurrentMonthAvailabilityPercentage) - AVG(LastMonthAvailabilityPercentage)) >= 0 THEN '+' ELSE '-' END, ROUND(AVG(CurrentMonthAvailabilityPercentage) - AVG(LastMonthAvailabilityPercentage), 1), '%') AS cnt FROM (SELECT d.id, COUNT(DISTINCT CASE WHEN r.endedOn < DATE_FORMAT(NOW(), '%Y-%m-01') THEN DATE(r.endedOn) ELSE NULL END) * 100 / (CASE WHEN d.createdOn < DATE_FORMAT(DATE_ADD(CURRENT_DATE, INTERVAL - 1 MONTH), '%Y-%m-01') THEN DATEDIFF(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), DATE_FORMAT(DATE_ADD(CURRENT_DATE, INTERVAL - 1 MONTH), '%Y-%m-01')) ELSE DATEDIFF(d.createdOn, DATE_FORMAT(DATE_ADD(CURRENT_DATE, INTERVAL - 1 MONTH), '%Y-%m-01')) END) AS LastMonthAvailabilityPercentage, COUNT(DISTINCT CASE WHEN r.endedOn >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN DATE(r.endedOn) ELSE NULL END) * 100 / (CASE WHEN d.createdOn < DATE_FORMAT(NOW(), '%Y-%m-01') THEN DATEDIFF(NOW(), DATE_FORMAT(NOW(), '%Y-%m-01')) ELSE DATEDIFF(d.createdOn, DATE_FORMAT(NOW(), '%Y-%m-01')) END) AS CurrentMonthAvailabilityPercentage FROM Device AS d LEFT JOIN Result AS r ON d.id = r.deviceId AND r.endedOn >= DATE_FORMAT(DATE_ADD(CURRENT_DATE, INTERVAL - 1 MONTH), '%Y-%m-01') INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON s.partnerId = p.id LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id GROUP BY d.id , d.createdOn) AS q;`,
      statUnit: '{unit} from last month',
      statUnitI18nKey: 'dashboardWidgetActiveDevices',
      link: '/browse/device',
      sortOrder: 12,
      externalId: 'activeDevices',
      description: `The daily percentage of devices that sent results`,
      descriptionI18nKey: 'activeDevicesDescription',
      dashboards: ['operational'],
    },
  ],
}
