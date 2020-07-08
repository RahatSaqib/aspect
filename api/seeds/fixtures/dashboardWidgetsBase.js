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
  ],
}
