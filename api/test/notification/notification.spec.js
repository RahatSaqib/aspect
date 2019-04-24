const supertest = require('supertest')
const chai = require('chai')
const Promise = require('bluebird')

const shared = require('../utils/sharedToken')
const { run } = require('../../src/db')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('Notification routes', () => {
  const path = '/api/notification'

  const now = new Date()

  const notificationTypes = [
    {
      partnerId: 1,
      issueTypeId: 2,
      name: 'Results Delayed',
      createdOn: now,
      updatedOn: now,
    },
    {
      partnerId: 1,
      issueTypeId: 3,
      name: 'Module Failure',
      createdOn: now,
      updatedOn: now,
    },
    {
      partnerId: 1,
      issueTypeId: 4,
      name: 'Machine Temperature High',
      createdOn: now,
      updatedOn: now,
    },
  ]
  const ntArr = []

  beforeEach(async () => {
    run(async knex => {
      await Promise.each(notificationTypes, async notificationType => {
        const [ntId] = await knex('NotificationType').insert(notificationType)
        ntArr.push(ntId)
        await knex('Notification').insert({
          notificationTypeId: ntId,
          createdOn: now,
        })
      })
    })
  })

  afterEach(async () => {
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
  })
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
})
