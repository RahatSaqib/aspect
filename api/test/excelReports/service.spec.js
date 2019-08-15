const Promise = require('bluebird')
const supertest = require('supertest')
const chai = require('chai')

const { assert } = chai
const shared = require('../utils/sharedToken')

const server = supertest.agent('http://localhost:8080/api')

describe('Excel reports', () => {
  it('should return a files when using valid token', async () => {
    const queries = [
      '/device/export?sortCol=name&sortDir=asc&page=0&size=10&format=&hasResults=1',
      '/inventory/export?sortCol=siteName&sortDir=asc&page=0&size=10&format',
      '/person/export?sortCol=name&sortDir=asc&page=0&size=10&format=',
      '/site/export?sortCol=name&sortDir=asc&page=0&size=10&format=',
      '/report/export?sortCol=name&sortDir=asc&page=0&size=10&format=xlsx',
      '/notification/export?sortCol=name&sortDir=asc&page=0&size=10&format=csv',
      '/deviceApiKey/export?sortCol=createdOn&sortDir=asc&page=0&size=10&format=',
    ]
    shared.checkToken(server, queries[0])
    return Promise.each(queries, async query => {
      const res = await server
        .get(query)
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.status, 200)
      assert.instanceOf(res.body, Buffer)
    })
  })
})
