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
})
