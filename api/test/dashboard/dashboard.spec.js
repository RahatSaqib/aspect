const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')

// This agent refers to PORT where program is runninng.
const server = supertest.agent('http://localhost:8080')
const assert = chai.assert

describe('Dashboard routes', () => {
  const path = '/api/dashboard'

  describe('GET', () => {
    shared.checkToken(server, path)

    it('should return an object with site, device, result and user counts', (done) => {
      server
      .get(path)
      .set('Authorization', `Bearer ${shared.token}`)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.property(res.body, 'data')
        assert.typeOf(res.body.data, 'Object')
        assert.property(res.body.data, 'sitesTotal')
        assert.property(res.body.data, 'devicesTotal')
        assert.property(res.body.data, 'resultsTotal30d')
        assert.property(res.body.data, 'resultsTotal1d')
        assert.property(res.body.data, 'usersTotal')
        done()
      })
    })
  })
})
