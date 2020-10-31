const Promise = require('bluebird')
const chai = require('chai')

const { assert } = chai
const shared = require('../utils/sharedToken')
const server = require('../utils/testUtils')

describe('Excel reports', () => {
  it('should return Excel files when using valid token', async () => {
    // when param 'format' is missing then it defaults to `xlsx`
    const queries = [
      '/api/device/export?sortCol=name&sortDir=asc&page=0&size=10&format=&hasResults=1',
      '/api/device/export?sortCol=name&sortDir=asc&page=0&size=10&format=&diseaseId=3', // check device export filtered by disease
      '/api/inventory/export?sortCol=siteName&sortDir=asc&page=0&size=10&format',
      '/api/person/export?sortCol=name&sortDir=asc&page=0&size=10&format=',
      '/api/site/export?sortCol=name&sortDir=asc&page=0&size=10&format=',
      '/api/report/export?sortCol=name&sortDir=asc&page=0&size=10&format=xlsx',
      '/api/notification/export?sortCol=name&sortDir=asc&page=0&size=10&format=xlsx',
      '/api/deviceApiKey/export?sortCol=createdOn&sortDir=asc&page=0&size=10&format=',
      '/api/result/export?sortCol=createdOn&sortDir=asc&page=0&size=10&format=xlsx',
      '/api/result/export?sortCol=name&sortDir=asc&page=0&size=10&format=&diseaseId=3',
    ]
    shared.checkToken(server, queries[0])
    await Promise.each(queries, async query => {
      const res = await server
        .get(query)
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.status, 200)
      // Content-Type for Excel
      assert.equal(
        res.type,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      assert.isObject(res.body)
    })
  })

  it('should return CSV files when using valid token', async () => {
    // must specify param 'format' = `csv`
    const queries = [
      '/device/export?sortCol=name&sortDir=asc&page=0&size=10&format=csv&hasResults=1',
      '/device/export?sortCol=name&sortDir=asc&page=0&size=10&format=csv&diseaseId=3',
      '/inventory/export?sortCol=siteName&sortDir=asc&page=0&size=10&format=csv',
      '/person/export?sortCol=name&sortDir=asc&page=0&size=10&format=csv',
      '/site/export?sortCol=name&sortDir=asc&page=0&size=10&format=csv',
      '/report/export?sortCol=name&sortDir=asc&page=0&size=10&format=csv',
      '/notification/export?sortCol=name&sortDir=asc&page=0&size=10&format=csv',
      '/deviceApiKey/export?sortCol=createdOn&sortDir=asc&page=0&size=10&format=csv',
      '/result/export?sortCol=createdOn&sortDir=asc&page=0&size=10&format=csv',
      '/result/export?sortCol=name&sortDir=asc&page=0&size=10&format=csv&diseaseId=3',
    ]
    shared.checkToken(server, queries[0])
    await Promise.each(queries, async query => {
      const res = await server
        .get(query)
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.status, 200)
      // Content-Type for CSV
      assert.equal(res.type, 'application/octet-stream')
      const base64 = Buffer.from(res.body, 'binary').toString('base64')
      assert.isString(base64)
    })
  })
})
