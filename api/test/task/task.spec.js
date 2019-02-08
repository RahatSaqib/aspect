const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')
// const _ = require('lodash')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe.only('Task Routes', () => {
  describe('/task', () => {
    const path = '/api/task'
    describe('GET', () => {
      shared.checkToken(server, path)
      it.only('should return a list alarms and issues for grouped for days', done => {
        server
          .get(`${path}?sortCol=time&sortDir=desc&page=0&size=10`)
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            /* assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'array')
            assert.equal(res.body.data.length, 2)
            assert.property(res.body.data[0], 'id')
            assert.property(res.body.data[0], 'name')
            assert.property(res.body.data[0], 'shortName')
            assert.property(res.body.data[0], 'createdOn')
            assert.property(res.body, 'total')
            siteId = res.body.data[0].id */
            assert.isNotNull(res.body.data)

            assert.isAbove(res.body.data.length, 1)
            assert.typeOf(res.body.data, 'Array')
            assert.property(res.body.data[0], 'alertType')
            assert.property(res.body.data[0], 'topic')
            assert.property(res.body.data[0], 'message')
            assert.property(res.body.data[0], 'site')
            assert.property(res.body.data[0], 'time')
            assert.property(res.body.data[0], 'notificationCount')
            assert.property(res.body.data[0], 'id')
            assert.property(res.body, 'total')
            assert.property(res.body, 'countByAlert')
            assert.typeOf(res.body.countByAlert, 'Object')
            done()
          })
      })
    })
  })
})
