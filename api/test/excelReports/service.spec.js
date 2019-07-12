const supertest = require('supertest')
const chai = require('chai')

const { assert } = chai
const shared = require('../utils/sharedToken')

const server = supertest.agent('http://localhost:8080/api')
const path = '/device/export'
describe.only('Excel reports', () => {
  shared.checkToken(server, path)

  it('should return a list of devices when using valid token', () => {
    /* const request = {
      query: {},
      auth: { credentials: { name: 'admin' } },
      format: 'xlsx',
    } */
    server
      .get(
        `${path}?sortCol=name&sortDir=asc&page=0&size=10&format=&hasResults=1`
      )
      .set('Authorization', `Bearer ${shared.token}`)
      .end((error, res) => {
        console.log(res)
        assert.isNotNull(!res)
        assert.isString(res.text)
      })
  })
})
