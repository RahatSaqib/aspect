const supertest = require('supertest')
const chai = require('chai')

const { assert } = chai
const shared = require('../utils/sharedToken')

const server = supertest.agent('http://localhost:8080/api')
const path = '/device/export'
describe('Excel reports', () => {
  shared.checkToken(server, path)

  it('should return a list of devices when using valid token', async () => {
    await server
      .get(
        `${path}?sortCol=name&sortDir=asc&page=0&size=10&format=&hasResults=1`
      )
      .set('Authorization', `Bearer ${shared.token}`)
      .end((error, res) => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.isNotNull(!res)
        assert.isString(res.text)
      })
  })
  it('should return a list of supplies when using valid token', async () => {
    await server
      .get(
        '/inventory/export?sortCol=siteName&sortDir=asc&page=0&size=10&format'
      )
      .set('Authorization', `Bearer ${shared.token}`)
      .end((error, res) => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.isNotNull(!res)
        assert.isString(res.text)
      })
  })
  it('should return a list of contacts when using valid token', async () => {
    await server
      .get('/person/export?sortCol=name&sortDir=asc&page=0&size=10&format=')
      .set('Authorization', `Bearer ${shared.token}`)
      .end((error, res) => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.isNotNull(!res)
        assert.isString(res.text)
      })
  })
  it('should return a list of sites when using valid token', async () => {
    await server
      .get('/site/export?sortCol=name&sortDir=asc&page=0&size=10&format=')
      .set('Authorization', `Bearer ${shared.token}`)
      .end((error, res) => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.isNotNull(!res)
        assert.isString(res.text)
      })
  })
  it('should return a list of reports when using valid token', async () => {
    await server
      .get('/report/export?sortCol=name&sortDir=asc&page=0&size=10&format=xlsx')
      .set('Authorization', `Bearer ${shared.token}`)
      .end((error, res) => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.isNotNull(!res)
        assert.isString(res.text)
      })
  })
  it('should return a list of notification when using valid token', async () => {
    await server
      .get(
        '/notification/export?sortCol=name&sortDir=asc&page=0&size=10&format=csv'
      )
      .set('Authorization', `Bearer ${shared.token}`)
      .end((error, res) => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.isNotNull(!res)
        assert.isString(res.text)
      })
  })
  it('should return a list of deviceApiKey when using valid token', async () => {
    await server
      .get(
        '/deviceApiKey/export?sortCol=createdOn&sortDir=asc&page=0&size=10&format='
      )
      .set('Authorization', `Bearer ${shared.token}`)
      .end((error, res) => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.isNotNull(!res)
        assert.isString(res.text)
      })
  })
  it('should return a list of routers when using valid token', async () => {
    await server
      .get('/device/export?sortCol=name&sortDir=asc&page=0&size=10&format=')
      .set('Authorization', `Bearer ${shared.token}`)
      .end((error, res) => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.isNotNull(!res)
        assert.isString(res.text)
      })
  })
})
