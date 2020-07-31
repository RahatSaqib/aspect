// const _ = require('lodash')
const chai = require('chai')
const {
  getBalancedParentheses,
  getNestedQueries,
} = require('../../src/shared/sql-2-knex')
const { run } = require('../../src/db')
const dashboardWidgetsBase = require('../../seeds/fixtures/dashboardWidgetsBase')

const { assert } = chai

describe.only('Parse nested queries', () => {
  describe('Parse query which nested sub-queries', () => {
    const { sqlForStatUnit: sql } = dashboardWidgetsBase.stat.find(
      x => x.externalId === 'stockNotRecorded'
    )
    it('should find nested parentheses and return all matched balanced groups', done => {
      const balancedParentheses = getBalancedParentheses(sql)

      let match

      // see COUNT(siteId)
      match = balancedParentheses.find(x => x.chunk === 'siteId')
      assert.equal(match.children.length, 0)

      match = balancedParentheses.find(
        x => x.chunk === 'NOW() - INTERVAL 1 MONTH'
      )
      assert.equal(match.children.length, 1)

      match = balancedParentheses.find(
        x =>
          x.chunk ===
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
        child.chunk,
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
        subChild.chunk,
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
      assert.equal(nestedQueries.length, 1)
      done()
    })
  })

  describe('Execute query with sub-query in FROM clause', () => {
    const { sqlForStatUnit: sql } = dashboardWidgetsBase.stat.find(
      x => x.externalId === 'stockNotRecorded'
    )
    it('should find nested query', async () => {
      const nestedQueries = getNestedQueries(sql)
      assert.equal(nestedQueries.length, 1)

      return run(async () => {
        //
      })
    })
  })

  describe.skip('Execute query with sub-query in JOIN clause', () => {
    const { sqlForStatUnit: sql } = dashboardWidgetsBase.stat.find(
      x => x.externalId === 'stockouts'
    )
    it('should find nested query', async () => {
      const nestedQueries = getNestedQueries(sql)
      assert.equal(nestedQueries.length, 1)

      return run(async () => {
        //
      })
    })
  })

  describe.skip('Execute query with sub-query in WHERE clause', () => {
    // find our or prepare query with 'WHERE ... IN (SELECT ...)` pattern
    const sql = ''
    it('should find nested query', async () => {
      const nestedQueries = getNestedQueries(sql)
      assert.equal(nestedQueries.length, 1)

      return run(async () => {
        //
      })
    })
  })

  describe.skip('Execute query with sub-query in SELECT clause', () => {
    // valid but non-optimized query for sqlForStatUnit for
    // externalId = 'dashboardWidgetTestsPerDayTitle' from 'api/seeds/fixtures/dashboardWidgetsBase.js'
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
    ) as t`

    it('should find nested query', async () => {
      const nestedQueries = getNestedQueries(sql)
      assert.equal(nestedQueries.length, 5)

      return run(async () => {
        //
      })
    })
  })
})
