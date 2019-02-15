const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')
const { createAlertTestContext } = require('./util')
const { run } = require('../../src/db')
// const _ = require('lodash')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai
const context = createAlertTestContext({ user: 'admin' })
describe.only('Task Routes', () => {
  beforeEach(context.beforeEach)
  afterEach(context.afterEach)

  describe('/taskbystatus', () => {
    const path = '/api/taskbystatus'
    describe('GET', () => {
      shared.checkToken(server, path)
      it('should return a list of alarms and issues by specific date, siteid and issuestatus', done => {
        const alertTemplateId = 1
        const date = new Date().toISOString()
        const statusId = 4

        server
          .get(
            `${path}?alertTemplateId=${alertTemplateId}&date=${date}&categoryId=${statusId}`
          )
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            assert.isNotNull(res.body.data)
            assert.isAbove(res.body.data.length, 1)

            console.log(typeof res.body.data)
            assert.typeOf(res.body.data, 'Array')
            assert.property(res.body.data[0], 'issueStatus')
            assert.property(res.body.data[0], 'issueCategory')
            assert.property(res.body.data[0], 'message')
            assert.property(res.body.data[0], 'site')
            assert.property(res.body.data[0], 'time')
            assert.property(res.body.data[0], 'id')
            assert.property(res.body, 'total')
            assert.property(res.body, 'countByAlert')
            assert.typeOf(res.body.countByAlert, 'Object')

            done()
          })
      })
    })
  })

  describe.only('/task/{taskId}', () => {
    const path = '/api/task/'
    describe('GET', () => {
      shared.checkToken(server, path)
      it('should return an alarm and issues by specific id', done => {
        run(() => {
          server
            .get(`${path}1`)
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              console.log(res.body)
              assert.isNotNull(res.body)
              assert.property(res.body, 'issueStatus')
              assert.property(res.body, 'issueCategory')
              assert.property(res.body, 'message')
              assert.property(res.body, 'site')
              assert.property(res.body, 'time')
              assert.property(res.body, 'id')
              done()
            })
        })
      })
    })
  })
  describe('/task', () => {
    const path = '/api/task'
    describe('GET', () => {
      shared.checkToken(server, path)
      it('should return a list of alarms and issues grouped by days', done => {
        server
          .get(`${path}?sortCol=time&sortDir=desc&page=0&size=10`)
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            assert.isNotNull(res.body.data)
            console.log(typeof res.body.data)

            assert.isAbove(res.body.data.length, 0)
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
