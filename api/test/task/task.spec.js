const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')
const { createAlertTestContext } = require('./util')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai
const context = createAlertTestContext({ user: 'admin' })
describe('Task Routes', () => {
  before(context.beforeEach)
  after(context.afterEach)

  describe('/taskbystatus', () => {
    const path = '/api/taskbystatus'
    describe('GET', () => {
      it('should return a list of alarms and issues by specific date, siteid and issuestatus', done => {
        const alertTemplateId = 1
        const date = new Date().toISOString()
        const statusId = 1

        server
          .get(
            `${path}?alertTemplateId=${alertTemplateId}&date=${date}&categoryId=${statusId}`
          )
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
            assert.property(res.body.data[0], 'id')
            assert.property(res.body, 'total')
            assert.property(res.body, 'countByAlert')
            assert.typeOf(res.body.countByAlert, 'Object')

            done()
          })
      })
    })
  })

  describe('/task/{taskId}', () => {
    const path = '/api/task/'
    describe('GET', () => {
      it('should return an alarm and issues by specific id', done => {
        const taskId = context.getMessageId()
        server
          .get(`${path}${taskId}`)
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            assert.typeOf(res.body, 'object')
            assert.isNotNull(res.body)
            assert.property(res.body, 'issueStatus')
            assert.property(res.body, 'title')
            assert.property(res.body, 'issueCategory')
            assert.property(res.body, 'message')
            assert.property(res.body, 'device')
            assert.property(res.body, 'deviceId')
            assert.property(res.body, 'site')
            assert.property(res.body, 'siteId')
            assert.property(res.body, 'time')
            assert.property(res.body, 'id')
            assert.property(res.body, 'issueStatusId')
            assert.property(res.body, 'issueStatus')
            assert.property(res.body, 'personName')
            assert.isNotNull(res.body.jobPersons)
            assert.typeOf(res.body.jobPersons, 'array')

            assert.isAbove(res.body.jobPersons.length, 0)
            assert.property(res.body.jobPersons[0], 'personId')
            assert.property(res.body.jobPersons[0], 'personName')
            done()
          })
      })
    })
  })
  describe('/task', () => {
    const path = '/api/task'
    describe('GET', () => {
      it('should return a list of alarms and issues grouped by days', done => {
        server
          .get(`${path}?sortCol=time&sortDir=desc&page=0&size=10`)
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            assert.isNotNull(res.body.data)

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
