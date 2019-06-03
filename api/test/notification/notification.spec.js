const supertest = require('supertest')
const chai = require('chai')
const Promise = require('bluebird')

const { rowsAsObject } = require('../../seeds/utils')
const shared = require('../utils/sharedToken')
const { run } = require('../../src/db')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe.only('Notification routes', () => {
  const path = '/api/notification'

  const now = new Date()
  const sampleIssues = [
    'DeviceOffline',
    'DeviceMaintenance',
    'ModuleFailureError',
  ]

  const ntArr = []

  beforeEach(async () =>
    run(async knex => {
      const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')
      await Promise.each(sampleIssues, async issue => {
        const issueType = issueTypes[issue]
        const [ntId] = await knex('NotificationType').insert({
          partnerId: 1,
          issueTypeId: issueType.id,
          name: issueType.name,
          createdOn: now,
          updatedOn: now,
        })

        ntArr.push(ntId)

        await knex('Notification').insert({
          notificationTypeId: ntId,
          createdOn: now,
        })
      })
    })
  )

  afterEach(async () =>
    run(async knex => {
      await Promise.each(ntArr, async ntId => {
        await knex('Notification')
          .where('notificationTypeId', ntId)
          .del()
        await knex('NotificationType')
          .where('id', ntId)
          .del()
      })
    })
  )

  describe('GET /notification', () => {
    shared.checkToken(server, path)

    it('should return a list of notifications when using valid token', done => {
      server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 3)
          res.body.data.forEach(notification => {
            assert.property(notification, 'name')
            assert.property(notification, 'lastTriggeredOn')
            assert.property(notification, 'totalTriggers')
            assert.property(notification, 'alertCount')
            assert.property(notification, 'smsCount')
            assert.property(notification, 'emailCount')
          })
          done()
        })
    })
  })

  describe.only('GET /TestPushNotification', () => {
    shared.checkToken(server, path)

    it('should send a push notification for all test devices', () => {
      server
        .get('/api/testpushnotification')
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'ok')
          assert.equal(res.body.ok, true)
        })
    })
  })
})
