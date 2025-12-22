const Promise = require('bluebird')
const chai = require('chai')

const { assert } = chai
const shared = require('../utils/sharedToken')
const server = require('../utils/testUtils')

describe('Excel reports', () => {
  // when param 'format' is missing then it defaults to `xlsx`
  const queriesExcel = [
    '/api/device/export?sortCol=name&sortDir=asc&page=0&size=10&format=&hasResults=1',
    '/api/device/export?sortCol=name&sortDir=asc&page=0&size=10&format=&diseaseId=3', // check device export filtered by disease
    '/api/inventory/export?sortCol=siteName&sortDir=asc&page=0&size=10&format',
    '/api/person/export?sortCol=name&sortDir=asc&page=0&size=10&format=',
    '/api/site/export?sortCol=name&sortDir=asc&page=0&size=10&format=',

    '/api/notification/export?sortCol=name&sortDir=asc&page=0&size=10&format=xlsx',
    '/api/deviceApiKey/export?sortCol=createdOn&sortDir=asc&page=0&size=10&format=',
  ]
  before(async () => {
    await shared.checkToken(server, queriesExcel[0])
  })
  it('should return Excel files when using valid token', async () => {
    await Promise.each(queriesExcel, async query => {
      const res = await server.get(query).set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.status, 200)
      // Content-Type for Excel
      assert.equal(res.type, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      assert.isObject(res.body)
    })
  })

  // must specify param 'format' = `csv`
  const queriesCSV = [
    '/api/device/export?sortCol=name&sortDir=asc&page=0&size=10&format=csv&hasResults=1',
    '/api/device/export?sortCol=name&sortDir=asc&page=0&size=10&format=csv&diseaseId=3',
    '/api/inventory/export?sortCol=siteName&sortDir=asc&page=0&size=10&format=csv',
    '/api/person/export?sortCol=name&sortDir=asc&page=0&size=10&format=csv',
    '/api/site/export?sortCol=name&sortDir=asc&page=0&size=10&format=csv',
    '/api/notification/export?sortCol=name&sortDir=asc&page=0&size=10&format=csv',
    '/api/deviceApiKey/export?sortCol=createdOn&sortDir=asc&page=0&size=10&format=csv',
    '/api/result/export?sortCol=endedOn&sortDir=asc&page=0&size=10&format=csv',
    '/api/result/export?sortCol=assayName&sortDir=asc&page=0&size=10&format=csv&diseaseId=3',
  ]
  before(() => {
    shared.checkToken(server, queriesCSV[0])
  })
  it('should return CSV files when using valid token', async () => {
    await Promise.each(queriesCSV, async query => {
      const res = await server.get(query).set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 200)
      // Content-Type for CSV
      assert.equal(res.type, 'application/octet-stream')
      const base64 = Buffer.from(res.body, 'binary').toString('base64')
      assert.isString(base64)
    })
  })

  const resultListQueriesCSV = [
    '/api/result/export?sortCol=endedOn&sortDir=asc&page=0&size=10&format=xlsx',
    '/api/result/export?sortCol=assayName&sortDir=asc&page=0&size=10&format=&diseaseId=3',
  ]

  before(() => {
    shared.checkToken(server, resultListQueriesCSV[0])
  })
  it('should return CSV files when download a result list report', async () => {
    await Promise.each(resultListQueriesCSV, async query => {
      const res = await server.get(query).set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 200)
      // Content-Type for CSV
      assert.equal(res.type, 'application/octet-stream')
      const base64 = Buffer.from(res.body, 'binary').toString('base64')
      assert.isString(base64)
    })
  })
})
