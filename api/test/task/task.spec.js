const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')
// const _ = require('lodash')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('Task Routes', () => {
  describe('/task', () => {
    const path = '/api/task'
    describe('GET', () => {
      shared.checkToken(server, path)
      it('should return a list alarms and issues for grouped for days', done => {
        server
          .get(`${path}?sortCol=time&sortDir=desc&page=0&size=10`)
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            assert.isNotNull(res.body.data)

            assert.isAbove(res.body.data.length, 1)
            assert.typeOf(res.body.data, 'Array')
            assert.property(res.body.data[0], 'issueStatus')
            assert.property(res.body.data[0], 'issueCategory')
            assert.property(res.body.data[0], 'message')
            assert.property(res.body.data[0], 'site')
            assert.property(res.body.data[0], 'time')
            assert.property(res.body.data[0], 'issueCount')
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
