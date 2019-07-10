const supertest = require('supertest')
const chai = require('chai')

const { assert } = chai
const shared = require('../utils/sharedToken')

const server = supertest.agent('http://localhost:8080/api')
const path = '/device/export'
describe.only('Excel reports', () => {
  shared.checkToken(server, path)

  it('should return a list of devices when using valid token', async () => {
    /* const request = {
      query: {},
      auth: { credentials: { name: 'admin' } },
      format: 'xlsx',
    } */
    await server
      .get(path)
      .set('Authorization', `Bearer ${shared.token}`)
      .end((err, res) => {
        assert.isTrue(!res)
      })
  })
})
