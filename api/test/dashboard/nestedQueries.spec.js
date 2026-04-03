const chai = require('chai')
const {
  getBalancedParentheses,
  getNestedQueries,
  processNestedQueries,
  tryConvertSqlStringToKnexQueryBuilder,
} = require('../../src/shared/sql-2-knex')
const { run } = require('../../src/db')
const DashboardWidgetsCommon = require('../../seeds/fixtures/dashboardWidgetsCommon')

const { assert, expect } = chai

async function assertQuery(knex, sqlBuilder, sql) {
  const [rawResult] = await knex.raw(sql).then(data => data[0])
  const [firstResult] = await sqlBuilder
  expect(firstResult).to.have.property('cnt')
  expect(rawResult).to.have.property('cnt')
  expect(firstResult).to.have.containSubset({
    cnt: rawResult.cnt,
  })
  assert.equal(rawResult.cnt, firstResult.cnt)
}
describe('Parse nested queries', () => {
  describe('Parse query which nested sub-queries', () => {
    // Used query from 'sqlForStatUnit' in
    //    DashboardWidgetsCommon.stat.find(x => x.externalId === 'stockNotRecorded')
    // and for testing purposes just copied above query here to not depend
    // on possible change of query actual format and paddings
    const sql = `SELECT
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
          ) AS innerQuery`
    it('should find nested parentheses and return all matched balanced groups', done => {
      const balancedParentheses = getBalancedParentheses(sql)

      let match

      // see COUNT(siteId)
      match = balancedParentheses.all.find(x => x.innerText === 'siteId')
      assert.equal(match.children.length, 0)

      match = balancedParentheses.all.find(x => x.innerText === 'NOW() - INTERVAL 1 MONTH')
      assert.equal(match.children.length, 1)

      match = balancedParentheses.all.find(
        x =>
          x.innerText ===
          `
        ROUND(
          IFNULL(
            SUM(CASE WHEN quantityOnHand IS NULL AND deviceTypeExternalId = 'CepheidGeneXpert' THEN 1 ELSE 0 END)
            / COUNT(siteId) * 100
          ,0)
        ,0)
      ,'%'`
      )
      assert.isNotNull(match)
      assert.equal(match.children.length, 1)

      const child = match.children[0]
      assert.equal(
        child.innerText,
        `
          IFNULL(
            SUM(CASE WHEN quantityOnHand IS NULL AND deviceTypeExternalId = 'CepheidGeneXpert' THEN 1 ELSE 0 END)
            / COUNT(siteId) * 100
          ,0)
        ,0`
      )
      assert.equal(child.children.length, 1)

      const subChild = child.children[0]
      assert.equal(
        subChild.innerText,
        `
            SUM(CASE WHEN quantityOnHand IS NULL AND deviceTypeExternalId = 'CepheidGeneXpert' THEN 1 ELSE 0 END)
            / COUNT(siteId) * 100
          ,0`
      )
      assert.equal(subChild.children.length, 2)

      done()
    })

    it('should find nested query', done => {
      const nestedQueries = getNestedQueries(sql)
      assert.equal(nestedQueries.all.length, 1)
      done()
    })
  })

  describe('Execute query with sub-query in FROM clause', () => {
    const { sqlForStatUnit: sql } = Object.values(DashboardWidgetsCommon.stat).find(x => x.externalId === 'errorRate')
    it('should find nested query', async () => {
      const nestedQueries = getNestedQueries(sql)
      assert.equal(nestedQueries.all.length, 1)

      const dataConstraints = {}
      const urlQuery = {}
      const sqlBuilder = tryConvertSqlStringToKnexQueryBuilder(sql, dataConstraints, urlQuery)

      return run(async knex => {
        await assertQuery(knex, sqlBuilder, sql)
      })
    })
  })

  describe('Execute query with sub-query in JOIN clause', () => {
    const { sqlForStatUnit: sql } = Object.values(DashboardWidgetsCommon.stat).find(x => x.externalId === 'stockouts')
    it('should find nested query', async () => {
      const nestedQueries = getNestedQueries(sql)
      assert.equal(nestedQueries.all.length, 1)

      const dataConstraints = {}
      const urlQuery = {}
      const sqlBuilder = tryConvertSqlStringToKnexQueryBuilder(sql, dataConstraints, urlQuery)

      return run(async knex => {
        await assertQuery(knex, sqlBuilder, sql)
      })
    })
  })

  // TODO: find our or prepare query with 'WHERE ... IN (SELECT ...)` pattern
  describe.skip('Execute query with sub-query in WHERE clause', () => {
    it('should find nested query', async () => {
      return run(async () => {
        //
      })
    })
  })

  describe('Execute query with sub-query in SELECT clause', () => {
    // valid but non-optimized query for sqlForStatUnit for
    // externalId = 'dashboardWidgetTestsPerDayTitle' from 'api/seeds/fixtures/DashboardWidgetsCommon.js'
    const sql = `SELECT
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
              r.endedOn>= DATE_FORMAT(NOW(),"%Y-%m-01")
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
              r.endedOn>= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH),"%Y-%m-01")
              AND r.endedOn< DATE_FORMAT(NOW(),"%Y-%m-01")
            GROUP BY DATE(r.endedOn)
          ) as t2
        ) as avgLastMonth
    ) as t`

    it('should find nested query', async () => {
      const nestedQueries = getNestedQueries(sql)
      assert.equal(nestedQueries.all.length, 5)

      const { modifiedSql } = processNestedQueries(sql, nestedQueries.tree, {})
      assert.equal(
        modifiedSql,
        `SELECT
      CASE
        WHEN avgCurrentMonth IS NULL OR avgLastMonth IS NULL THEN '?'
        ELSE
          CASE
            WHEN avgCurrentMonth >= avgLastMonth
            THEN concat('+', (avgCurrentMonth - avgLastMonth))
            ELSE concat('-', (avgCurrentMonth - avgLastMonth))
          END
      END as cnt
    FROM  $$$_1  as t`
      )

      const dataConstraints = {}
      const urlQuery = {}
      const sqlBuilder = tryConvertSqlStringToKnexQueryBuilder(sql, dataConstraints, urlQuery)

      return run(async knex => {
        await assertQuery(knex, sqlBuilder, sql)
      })
    })
  })

  describe('Execute ALL widgets in dashboardWidgetBase', () => {
    const testeableWidgets = [
      'devicesTitle',
      'resultsTitle',
      'geneXpertDevices',
      'gxPositiveResultsNotified',
      'dashboardWidgetTestsPerDayTitle',
      'dashboardWidgetValidResultsPc',
      'utilizationRate',
      'activeDevices',
      'activeDevicesCnt',
      'stockouts',
      'deviceDaysActive',
      'errorRate',
      'stockNotRecorded',
      'avgTimeToUpload',
      'moduleSwaps',
      'percentageOfModulesFunctioning',
      'averageRecipientsOfEmail',
      'averageRecipientsOfSms',
      'averageLengthOfSms',
      'smsSent',
      'instrumentsConnected',
      'averageDaysModuleSwap',
      'averageTimeToModuleReplacement',
      'numberOfDevicesExperiencingServiceInterruption',
      'averageDurationServiceInterruption',
    ]

    Object.values(DashboardWidgetsCommon.stat)
      .filter(w => testeableWidgets.includes(w.externalId))
      .forEach(widget => {
        it(`should convert sql to knex and execute query for widget '${widget.title}'`, async () => {
          const dataConstraints = {}
          const urlQuery = {}
          const sql = widget.sqlForIndicator
          const sqlBuilder = tryConvertSqlStringToKnexQueryBuilder(sql, dataConstraints, urlQuery)
          return run(async knex => {
            await assertQuery(knex, sqlBuilder, sql)
          })
        })
      })
  })
})
